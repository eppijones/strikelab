"""Swing DNA — Phase 1 sensor capture columns.

Adds:
  • round_shots.biometric_data JSONB — full 60s HR window (samples,
    rrIntervals, isHighFrequency) attached to a shot. Lives next to
    the existing flat `heart_rate_at_shot` / `heart_rate_variability`
    columns which stay populated for fast queries.

The pre-existing `motion_data` JSON column already holds the full
SwingMotionData blob; nothing to change there.

Revision ID: 007_swing_dna
Revises: 006_catalog
Create Date: 2026-05-09
"""
from alembic import op
import sqlalchemy as sa


revision = "007_swing_dna"
down_revision = "006_catalog"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "round_shots",
        sa.Column("biometric_data", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("round_shots", "biometric_data")
