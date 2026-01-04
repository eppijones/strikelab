"""Add dream_handicap field to users

Revision ID: 004
Revises: 003
Create Date: 2026-01-04

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_dream_handicap'
down_revision = '003_user_onboarding'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add dream_handicap column for long-term milestone goal
    op.add_column('users', sa.Column('dream_handicap', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'dream_handicap')
