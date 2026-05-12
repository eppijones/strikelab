"""Merge heads + `range_sessions` for StrikeLab Caddie range sync.

Stores the full JSON envelope from the iPhone (`StrikeLabRangeExport`)
so the web app can run the same analytics as local import.

Revision ID: 011_range_sessions
Revises: 010_booking_tee, 010_persona
Create Date: 2026-05-11
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "011_range_sessions"
down_revision = ("010_booking_tee", "010_persona")
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "range_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("schema_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("shot_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("location", sa.String(200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_range_sessions_user_id", "range_sessions", ["user_id"], unique=False)
    op.create_index("ix_range_sessions_start_time", "range_sessions", ["start_time"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_range_sessions_start_time", table_name="range_sessions")
    op.drop_index("ix_range_sessions_user_id", table_name="range_sessions")
    op.drop_table("range_sessions")
