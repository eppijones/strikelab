"""Add Golf Course API provider id to courses.

Revision ID: 015_golfcourseapi_provider
Revises: 014_open_golf_data
Create Date: 2026-05-13
"""
from alembic import op
import sqlalchemy as sa


revision = "015_golfcourseapi_provider"
down_revision = "014_open_golf_data"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("courses", sa.Column("golfcourseapi_id", sa.String(length=40), nullable=True))
    op.create_index("ix_courses_golfcourseapi_id", "courses", ["golfcourseapi_id"])


def downgrade() -> None:
    op.drop_index("ix_courses_golfcourseapi_id", table_name="courses")
    op.drop_column("courses", "golfcourseapi_id")
