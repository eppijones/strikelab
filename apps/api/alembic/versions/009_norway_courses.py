"""Norway-wide course catalog — region, facility flags, NGF/OSM external IDs.

This migration extends the `courses` table with the kind of data Norges
Golfforbund (NGF) and GolfBox carry per club so that we can ingest every
Norwegian member club, including those that are primarily a driving
range / practice facility.

New columns:
  • region              — county / state / fylke
  • holes_count         — 9 / 18 / 27 …
  • email               — club contact email
  • has_driving_range   — quick boolean filter
  • has_practice_area   — short-game / chipping / pitching
  • has_putting_green   — practice green
  • has_par3_course     — short / academy course on premises
  • has_simulator       — indoor sim (Trackman / GSPro / Foresight)
  • facilities          — loose JSON blob with bay counts, brand, etc.
  • ngf_club_id         — Norges Golfforbund club id (if known)
  • osm_id              — OpenStreetMap relation/way id (open data)

All new columns are nullable so existing rows remain valid.

Revision ID: 009_norway_courses
Revises: 008_dna_signatures
Create Date: 2026-05-10
"""
from alembic import op
import sqlalchemy as sa


revision = "009_norway_courses"
down_revision = "008_dna_signatures"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("courses", sa.Column("region", sa.String(100), nullable=True))
    op.add_column("courses", sa.Column("holes_count", sa.Integer(), nullable=True))
    op.add_column("courses", sa.Column("email", sa.String(200), nullable=True))

    op.add_column("courses", sa.Column("has_driving_range", sa.Boolean(), nullable=True))
    op.add_column("courses", sa.Column("has_practice_area", sa.Boolean(), nullable=True))
    op.add_column("courses", sa.Column("has_putting_green", sa.Boolean(), nullable=True))
    op.add_column("courses", sa.Column("has_par3_course", sa.Boolean(), nullable=True))
    op.add_column("courses", sa.Column("has_simulator", sa.Boolean(), nullable=True))
    op.add_column("courses", sa.Column("facilities", sa.JSON(), nullable=True))

    op.add_column("courses", sa.Column("ngf_club_id", sa.String(40), nullable=True))
    op.add_column("courses", sa.Column("osm_id", sa.String(40), nullable=True))

    op.create_index("ix_courses_country_code", "courses", ["country_code"])
    op.create_index("ix_courses_region", "courses", ["region"])
    op.create_index(
        "ix_courses_has_driving_range", "courses", ["has_driving_range"]
    )
    op.create_index("ix_courses_ngf_club_id", "courses", ["ngf_club_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_courses_ngf_club_id", "courses")
    op.drop_index("ix_courses_has_driving_range", "courses")
    op.drop_index("ix_courses_region", "courses")
    op.drop_index("ix_courses_country_code", "courses")

    op.drop_column("courses", "osm_id")
    op.drop_column("courses", "ngf_club_id")
    op.drop_column("courses", "facilities")
    op.drop_column("courses", "has_simulator")
    op.drop_column("courses", "has_par3_course")
    op.drop_column("courses", "has_putting_green")
    op.drop_column("courses", "has_practice_area")
    op.drop_column("courses", "has_driving_range")
    op.drop_column("courses", "email")
    op.drop_column("courses", "holes_count")
    op.drop_column("courses", "region")
