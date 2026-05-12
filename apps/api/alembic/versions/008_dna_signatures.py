"""DNA signatures — Phase 5 fingerprint columns on PlayerShotDNA.

Adds three loose-schema JSONB columns:

  • tempo_signature   — { club: { median_ratio, sigma } } per club.
  • plane_signature   — { club: { axis: [x,y,z], spherical_sigma } } per
                        club (axis is the median normalised plane vector).
  • pressure_response — { delta_tempo_per_hr, delta_speed_per_hr, sample_count }
                        — regression of biomech deltas vs. HR-reserve fraction.

All nullable so existing rows remain valid; the dna recompute path
populates them when ≥3 motion-attached shots per club are available.

Revision ID: 008_dna_signatures
Revises: 007_swing_dna
Create Date: 2026-05-09
"""
from alembic import op
import sqlalchemy as sa


revision = "008_dna_signatures"
down_revision = "007_swing_dna"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("player_shot_dna", sa.Column("tempo_signature", sa.JSON(), nullable=True))
    op.add_column("player_shot_dna", sa.Column("plane_signature", sa.JSON(), nullable=True))
    op.add_column("player_shot_dna", sa.Column("pressure_response", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("player_shot_dna", "pressure_response")
    op.drop_column("player_shot_dna", "plane_signature")
    op.drop_column("player_shot_dna", "tempo_signature")
