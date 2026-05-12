"""Add Clerk identity mapping to users.

Revision ID: 013_clerk_auth
Revises: 012_round_version
Create Date: 2026-05-12
"""
from alembic import op
import sqlalchemy as sa


revision = "013_clerk_auth"
down_revision = "012_round_version"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("clerk_user_id", sa.String(length=128), nullable=True))
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=True)
    op.create_index("ix_users_clerk_user_id", "users", ["clerk_user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_clerk_user_id", table_name="users")
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=False)
    op.drop_column("users", "clerk_user_id")
