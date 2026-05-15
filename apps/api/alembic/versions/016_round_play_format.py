"""Add play format to synced rounds.

Revision ID: 016_round_play_format
Revises: 015_round_planned_shots, 015_golfcourseapi_provider
Create Date: 2026-05-14
"""
from alembic import op
import sqlalchemy as sa


revision = "016_round_play_format"
down_revision = ("015_round_planned_shots", "015_golfcourseapi_provider")
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "rounds",
        sa.Column("play_format", sa.String(length=20), nullable=False, server_default="full18"),
    )


def downgrade() -> None:
    op.drop_column("rounds", "play_format")
