"""Caddie + DNA + Ghost Advice tables.

Revision ID: 005_caddie
Revises: 004_dream_handicap
Create Date: 2026-05-06
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "005_caddie"
down_revision = "004_dream_handicap"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "rounds",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id"), nullable=True),
        sa.Column("course_name", sa.String(200), nullable=False),
        sa.Column("date", sa.DateTime(), nullable=False),
        sa.Column("selected_tee", sa.String(50), nullable=True),
        sa.Column("is_complete", sa.Boolean(), default=False),
        sa.Column("current_hole_number", sa.Integer(), default=1),
        sa.Column("total_par", sa.Integer(), default=72),
        sa.Column("total_gross", sa.Integer(), default=0),
        sa.Column("total_net", sa.Integer(), default=0),
        sa.Column("holes", sa.JSON(), nullable=True),
        sa.Column("player_handicap_index", sa.Float(), nullable=True),
        sa.Column("course_handicap", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_rounds_user", "rounds", ["user_id"])

    op.create_table(
        "round_shots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("round_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rounds.id"), nullable=False),
        sa.Column("hole_number", sa.Integer(), nullable=False),
        sa.Column("shot_number", sa.Integer(), nullable=False),
        sa.Column("club", sa.String(20), nullable=False),
        sa.Column("timestamp", sa.DateTime(), nullable=False),
        sa.Column("start_lat", sa.Float(), nullable=True),
        sa.Column("start_lon", sa.Float(), nullable=True),
        sa.Column("end_lat", sa.Float(), nullable=True),
        sa.Column("end_lon", sa.Float(), nullable=True),
        sa.Column("distance_yards", sa.Float(), nullable=True),
        sa.Column("distance_meters", sa.Float(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("is_manual", sa.Boolean(), default=False),
        sa.Column("is_distance_manual", sa.Boolean(), default=False),
        sa.Column("motion_data", sa.JSON(), nullable=True),
        sa.Column("heart_rate_at_shot", sa.Float(), nullable=True),
        sa.Column("heart_rate_variability", sa.Float(), nullable=True),
        sa.Column("weather", sa.JSON(), nullable=True),
        sa.Column("outcome", sa.String(20), nullable=True),
        sa.Column("miss_direction", sa.String(20), nullable=True),
        sa.Column("lie_type", sa.String(20), nullable=True),
        sa.Column("shot_context", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_round_shots_round", "round_shots", ["round_id"])

    op.create_table(
        "player_shot_dna",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
            unique=True,
        ),
        sa.Column("last_updated", sa.DateTime(), nullable=False),
        sa.Column("total_shots", sa.Integer(), default=0),
        sa.Column("consistency_score", sa.Float(), nullable=True),
        sa.Column("club_profiles", sa.JSON(), nullable=True),
        sa.Column("stress_profile", sa.JSON(), nullable=True),
        sa.Column("fatigue_profile", sa.JSON(), nullable=True),
        sa.Column("common_mistakes", sa.JSON(), nullable=True),
    )

    op.create_table(
        "ghost_advice",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("round_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rounds.id"), nullable=True),
        sa.Column("hole_number", sa.Integer(), nullable=True),
        sa.Column("distance_yards", sa.Float(), nullable=True),
        sa.Column("suggested_club", sa.String(20), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("commit_phrase", sa.Text(), nullable=True),
        sa.Column("rationale", sa.Text(), nullable=True),
        sa.Column("feel_target", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("ghost_advice")
    op.drop_table("player_shot_dna")
    op.drop_index("ix_round_shots_round", "round_shots")
    op.drop_table("round_shots")
    op.drop_index("ix_rounds_user", "rounds")
    op.drop_table("rounds")
