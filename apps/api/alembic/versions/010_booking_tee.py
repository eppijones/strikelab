"""StrikeLab Tee — booking surface tables.

Adds the data model that powers the world-class booking experience documented
in PLAN.md: preference-aware recommendations, the GolfBox-grade tee sheet
matrix, persisted holds, signed Vipps/Stripe payments, the day-of mobile pass,
playmate history, and a weather/conditions cache.

This migration is intentionally additive — every new column on `users` is
nullable so legacy rows stay valid; existing in-memory hold flow continues to
work until the router is rewritten.

Revision ID: 010_booking_tee
Revises: 009_norway_courses
Create Date: 2026-05-10
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY


revision = "010_booking_tee"
down_revision = "009_norway_courses"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---------- users — NGF + WHS handicap ----------
    op.add_column("users", sa.Column("ngf_member_id", sa.String(40), nullable=True))
    op.add_column("users", sa.Column("whs_handicap", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("home_lat", sa.Float(), nullable=True))
    op.add_column("users", sa.Column("home_lon", sa.Float(), nullable=True))
    op.create_index(
        "ix_users_ngf_member_id", "users", ["ngf_member_id"], unique=False
    )

    # ---------- courses — booking provider hint ----------
    op.add_column(
        "courses",
        sa.Column(
            "booking_provider",
            sa.String(40),
            nullable=False,
            server_default="internal",
        ),
    )

    # ---------- booking_preferences ----------
    op.create_table(
        "booking_preferences",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        # Time bands the user prefers to play in (any-of). Examples:
        # ["morning", "golden", "twilight"]
        sa.Column("time_bands", JSONB(), nullable=True),
        sa.Column("max_wind_ms", sa.Float(), nullable=True),
        sa.Column("max_rain_pct", sa.Float(), nullable=True),
        sa.Column("min_temp_c", sa.Float(), nullable=True),
        sa.Column("course_types", ARRAY(sa.String(40)), nullable=True),
        sa.Column(
            "solo_only", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
        sa.Column("no_groups_behind_min", sa.Integer(), nullable=True),
        sa.Column(
            "walking_only", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
        sa.Column(
            "favorite_course_id",
            UUID(as_uuid=True),
            sa.ForeignKey("courses.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("default_player_ids", ARRAY(UUID(as_uuid=True)), nullable=True),
        sa.Column(
            "show_to_pairs",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column(
            "handicap_visible",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
    )

    # ---------- tee_sheet ----------
    op.create_table(
        "tee_sheets",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "course_id",
            UUID(as_uuid=True),
            sa.ForeignKey("courses.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("opens_at", sa.Time(), nullable=False),
        sa.Column("closes_at", sa.Time(), nullable=False),
        sa.Column(
            "interval_min", sa.Integer(), nullable=False, server_default="8"
        ),
        sa.Column("peak_price", sa.Float(), nullable=True),
        sa.Column("off_price", sa.Float(), nullable=True),
        sa.Column("golden_price", sa.Float(), nullable=True),
        sa.Column("currency", sa.String(8), nullable=False, server_default="NOK"),
        sa.Column(
            "version", sa.Integer(), nullable=False, server_default="1"
        ),
        sa.Column(
            "provider", sa.String(40), nullable=False, server_default="internal"
        ),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
        sa.UniqueConstraint("course_id", "date", name="uq_tee_sheets_course_date"),
    )
    op.create_index(
        "ix_tee_sheets_course_date", "tee_sheets", ["course_id", "date"]
    )

    # ---------- tee_sheet_slot ----------
    op.create_table(
        "tee_sheet_slots",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "tee_sheet_id",
            UUID(as_uuid=True),
            sa.ForeignKey("tee_sheets.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("tee_time", sa.DateTime(), nullable=False),
        sa.Column(
            "players_total", sa.Integer(), nullable=False, server_default="4"
        ),
        sa.Column(
            "players_taken", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column("price_amount", sa.Float(), nullable=True),
        sa.Column("currency", sa.String(8), nullable=False, server_default="NOK"),
        sa.Column("peak", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "golden", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
        sa.Column(
            "twilight", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
        sa.Column("restrictions", JSONB(), nullable=True),
        sa.Column(
            "is_blocked", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
        sa.Column("provider_ref", sa.String(120), nullable=True),
    )
    op.create_index(
        "ix_tee_sheet_slots_sheet_time",
        "tee_sheet_slots",
        ["tee_sheet_id", "tee_time"],
    )
    op.create_index("ix_tee_sheet_slots_tee_time", "tee_sheet_slots", ["tee_time"])

    # ---------- slot_player_link — bridges TeeTime ↔ slot for occupancy ----
    op.create_table(
        "slot_player_links",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "slot_id",
            UUID(as_uuid=True),
            sa.ForeignKey("tee_sheet_slots.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "tee_time_id",
            UUID(as_uuid=True),
            sa.ForeignKey("tee_times.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("seat_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
        sa.UniqueConstraint("slot_id", "tee_time_id", name="uq_slot_player_link"),
    )

    # ---------- playmate ----------
    op.create_table(
        "playmates",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "friend_user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=True,
        ),
        # Anonymous / not-yet-signed-up playmate:
        sa.Column("display_name", sa.String(120), nullable=True),
        sa.Column("phone", sa.String(40), nullable=True),
        sa.Column("handicap", sa.Float(), nullable=True),
        sa.Column("last_played_at", sa.DateTime(), nullable=True),
        sa.Column(
            "rounds_together", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column(
            "public_handicap_visible",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
        sa.UniqueConstraint(
            "user_id", "friend_user_id", name="uq_playmates_user_friend"
        ),
    )
    op.create_index(
        "ix_playmates_user_last_played",
        "playmates",
        ["user_id", "last_played_at"],
    )

    # ---------- booking_holds (persisted) ----------
    op.create_table(
        "booking_holds",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "slot_id",
            UUID(as_uuid=True),
            sa.ForeignKey("tee_sheet_slots.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "course_id",
            UUID(as_uuid=True),
            sa.ForeignKey("courses.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("course_name", sa.String(200), nullable=False),
        sa.Column("tee_time", sa.DateTime(), nullable=False),
        sa.Column("players", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("player_payload", JSONB(), nullable=True),
        sa.Column("provider", sa.String(40), nullable=False, server_default="internal"),
        sa.Column("provider_ref", sa.String(120), nullable=True),
        sa.Column("price_amount", sa.Float(), nullable=True),
        sa.Column("currency", sa.String(8), nullable=False, server_default="NOK"),
        sa.Column("total_amount", sa.Float(), nullable=True),
        sa.Column("payment_method", sa.String(40), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="held"),
        # status: held, expired, confirmed, cancelled
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index(
        "ix_booking_holds_user", "booking_holds", ["user_id", "status"]
    )

    # ---------- bookings ----------
    op.create_table(
        "bookings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "tee_time_id",
            UUID(as_uuid=True),
            sa.ForeignKey("tee_times.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "slot_id",
            UUID(as_uuid=True),
            sa.ForeignKey("tee_sheet_slots.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "course_id",
            UUID(as_uuid=True),
            sa.ForeignKey("courses.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("course_name", sa.String(200), nullable=False),
        sa.Column("tee_time", sa.DateTime(), nullable=False),
        sa.Column("players_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("players_payload", JSONB(), nullable=True),
        sa.Column("total_amount", sa.Float(), nullable=True),
        sa.Column("currency", sa.String(8), nullable=False, server_default="NOK"),
        sa.Column("payment_id", sa.String(120), nullable=True),
        sa.Column("payment_method", sa.String(40), nullable=True),
        sa.Column("payment_status", sa.String(20), nullable=True),
        sa.Column(
            "split_mode", sa.String(20), nullable=False, server_default="together"
        ),
        sa.Column("qr_code", sa.String(240), nullable=True),
        sa.Column("check_in_code", sa.String(20), nullable=True),
        sa.Column(
            "status", sa.String(20), nullable=False, server_default="confirmed"
        ),
        sa.Column("cancelled_at", sa.DateTime(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index("ix_bookings_user", "bookings", ["user_id", "tee_time"])
    op.create_index(
        "ix_bookings_check_in_code", "bookings", ["check_in_code"], unique=False
    )

    # ---------- course_conditions cache ----------
    op.create_table(
        "course_conditions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "course_id",
            UUID(as_uuid=True),
            sa.ForeignKey("courses.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "captured_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
        sa.Column("for_date", sa.Date(), nullable=True),
        # Per-hour observations live in `hourly` JSONB to keep this table flat.
        # [{ "h": 14, "t": 22, "w": 5, "dir": "SW", "sun": 0.92, "cloud": 0.1, "rain": 0.0 }, ...]
        sa.Column("hourly", JSONB(), nullable=True),
        sa.Column("green_speed", sa.Float(), nullable=True),
        sa.Column("fairway_state", sa.String(20), nullable=True),
        sa.Column("rough_state", sa.String(20), nullable=True),
        sa.Column("mowed_hrs_ago", sa.Integer(), nullable=True),
        sa.Column("wind_ms", sa.Float(), nullable=True),
        sa.Column("temp_c", sa.Float(), nullable=True),
        sa.Column("sun_pct", sa.Float(), nullable=True),
        sa.Column("cloud_pct", sa.Float(), nullable=True),
        sa.Column("rain_pct", sa.Float(), nullable=True),
        sa.Column("sunrise", sa.String(8), nullable=True),
        sa.Column("sunset", sa.String(8), nullable=True),
        sa.Column("golden_start", sa.String(8), nullable=True),
        sa.Column(
            "source", sa.String(40), nullable=False, server_default="met.no"
        ),
    )
    op.create_index(
        "ix_course_conditions_course_date",
        "course_conditions",
        ["course_id", "for_date"],
    )


def downgrade() -> None:
    op.drop_index("ix_course_conditions_course_date", "course_conditions")
    op.drop_table("course_conditions")

    op.drop_index("ix_bookings_check_in_code", "bookings")
    op.drop_index("ix_bookings_user", "bookings")
    op.drop_table("bookings")

    op.drop_index("ix_booking_holds_user", "booking_holds")
    op.drop_table("booking_holds")

    op.drop_index("ix_playmates_user_last_played", "playmates")
    op.drop_table("playmates")

    op.drop_table("slot_player_links")

    op.drop_index("ix_tee_sheet_slots_tee_time", "tee_sheet_slots")
    op.drop_index("ix_tee_sheet_slots_sheet_time", "tee_sheet_slots")
    op.drop_table("tee_sheet_slots")

    op.drop_index("ix_tee_sheets_course_date", "tee_sheets")
    op.drop_table("tee_sheets")

    op.drop_table("booking_preferences")

    op.drop_column("courses", "booking_provider")

    op.drop_index("ix_users_ngf_member_id", "users")
    op.drop_column("users", "home_lon")
    op.drop_column("users", "home_lat")
    op.drop_column("users", "whs_handicap")
    op.drop_column("users", "ngf_member_id")
