"""Persona + home club on User — drive persona-aware UX.

Adds two columns to `users`:
  • persona       — beginner / improver / performance. Drives the
                    web shell, dashboard, coach voice, and iOS UX.
                    Defaults to `improver` for existing rows.
  • home_club_id  — FK to courses.id. The player's primary course.
                    Used in onboarding, in the shell eyebrow, and as
                    the seam for Phase 3 white-labeled clubhouse skins.

Both columns are nullable so existing users decode cleanly.

Revision ID: 010_persona
Revises: 009_norway_courses
Create Date: 2026-05-10
"""
from alembic import op
import sqlalchemy as sa


revision = "010_persona"
down_revision = "009_norway_courses"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("persona", sa.String(20), nullable=True, server_default="improver"),
    )
    op.add_column(
        "users",
        sa.Column("home_club_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_users_home_club_id_courses",
        "users",
        "courses",
        ["home_club_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_users_persona", "users", ["persona"])
    op.create_index("ix_users_home_club_id", "users", ["home_club_id"])


def downgrade() -> None:
    op.drop_index("ix_users_home_club_id", "users")
    op.drop_index("ix_users_persona", "users")
    op.drop_constraint("fk_users_home_club_id_courses", "users", type_="foreignkey")
    op.drop_column("users", "home_club_id")
    op.drop_column("users", "persona")
