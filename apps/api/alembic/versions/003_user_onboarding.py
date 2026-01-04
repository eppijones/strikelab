"""Add onboarding fields to users

Revision ID: 003
Revises: 002
Create Date: 2026-01-04

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_user_onboarding'
down_revision = '002_equipment'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns for user onboarding
    op.add_column('users', sa.Column('goal_handicap', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('practice_frequency', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('onboarding_completed', sa.Boolean(), server_default='false', nullable=False))


def downgrade() -> None:
    op.drop_column('users', 'onboarding_completed')
    op.drop_column('users', 'practice_frequency')
    op.drop_column('users', 'goal_handicap')
