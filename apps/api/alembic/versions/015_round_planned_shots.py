"""Add planned shots to synced rounds.

Revision ID: 015_round_planned_shots
Revises: 014_open_golf_data
Create Date: 2026-05-13
"""
from alembic import op
import sqlalchemy as sa


revision = "015_round_planned_shots"
down_revision = "014_open_golf_data"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("rounds", sa.Column("planned_shots", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("rounds", "planned_shots")
