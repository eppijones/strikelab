"""Add open golf data provenance and geometry.

Revision ID: 014_open_golf_data
Revises: 013_clerk_auth
Create Date: 2026-05-13
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "014_open_golf_data"
down_revision = "013_clerk_auth"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "data_sources",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column("license_name", sa.String(length=120), nullable=False),
        sa.Column("license_url", sa.String(length=500), nullable=True),
        sa.Column("attribution", sa.Text(), nullable=False),
        sa.Column("source_url", sa.String(length=500), nullable=True),
        sa.Column("terms_url", sa.String(length=500), nullable=True),
        sa.Column("refresh_interval_hours", sa.Integer(), nullable=True),
        sa.Column("is_open", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "course_geometries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_id", sa.String(length=80), nullable=True),
        sa.Column("osm_id", sa.String(length=80), nullable=True),
        sa.Column("geometry_version", sa.String(length=40), nullable=False, server_default="v1"),
        sa.Column("features", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("summary", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("validation", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("attribution", sa.Text(), nullable=True),
        sa.Column("captured_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_id"], ["data_sources.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_course_geometries_course_id", "course_geometries", ["course_id"])
    op.create_index("ix_course_geometries_osm_id", "course_geometries", ["osm_id"])


def downgrade() -> None:
    op.drop_index("ix_course_geometries_osm_id", table_name="course_geometries")
    op.drop_index("ix_course_geometries_course_id", table_name="course_geometries")
    op.drop_table("course_geometries")
    op.drop_table("data_sources")
