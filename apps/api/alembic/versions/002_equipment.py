"""Add equipment tables

Revision ID: 002_equipment
Revises: 001_initial
Create Date: 2026-01-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '002_equipment'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade():
    # Create user_bags table
    op.create_table(
        'user_bags',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False, server_default='My Bag'),
        sa.Column('is_primary', sa.Integer(), server_default='1'),
        sa.Column('ball_brand', sa.String(50), nullable=True),
        sa.Column('ball_model', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
    )
    op.create_index('ix_user_bags_user_id', 'user_bags', ['user_id'])
    
    # Create user_clubs table
    op.create_table(
        'user_clubs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('bag_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user_bags.id', ondelete='CASCADE'), nullable=False),
        sa.Column('club_type', sa.String(30), nullable=False),
        sa.Column('club_label', sa.String(20), nullable=True),
        sa.Column('brand_id', sa.String(50), nullable=False),
        sa.Column('model_name', sa.String(100), nullable=False),
        sa.Column('year', sa.Integer(), nullable=True),
        sa.Column('shaft_brand', sa.String(50), nullable=True),
        sa.Column('shaft_model', sa.String(100), nullable=True),
        sa.Column('shaft_flex', sa.String(5), nullable=True),
        sa.Column('shaft_weight', sa.Float(), nullable=True),
        sa.Column('loft', sa.Float(), nullable=True),
        sa.Column('lie', sa.Float(), nullable=True),
        sa.Column('length', sa.Float(), nullable=True),
        sa.Column('swing_weight', sa.String(5), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('sort_order', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
    )
    op.create_index('ix_user_clubs_bag_id', 'user_clubs', ['bag_id'])
    
    # Create club_stats table
    op.create_table(
        'club_stats',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('club_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user_clubs.id', ondelete='SET NULL'), nullable=True),
        sa.Column('club_label', sa.String(20), nullable=False),
        sa.Column('total_shots', sa.Integer(), server_default='0'),
        sa.Column('good_shots', sa.Integer(), server_default='0'),
        sa.Column('avg_carry', sa.Float(), nullable=True),
        sa.Column('max_carry', sa.Float(), nullable=True),
        sa.Column('min_carry', sa.Float(), nullable=True),
        sa.Column('std_carry', sa.Float(), nullable=True),
        sa.Column('avg_total', sa.Float(), nullable=True),
        sa.Column('avg_ball_speed', sa.Float(), nullable=True),
        sa.Column('avg_launch_angle', sa.Float(), nullable=True),
        sa.Column('avg_spin_rate', sa.Float(), nullable=True),
        sa.Column('avg_peak_height', sa.Float(), nullable=True),
        sa.Column('avg_club_speed', sa.Float(), nullable=True),
        sa.Column('avg_smash_factor', sa.Float(), nullable=True),
        sa.Column('avg_attack_angle', sa.Float(), nullable=True),
        sa.Column('avg_club_path', sa.Float(), nullable=True),
        sa.Column('avg_face_angle', sa.Float(), nullable=True),
        sa.Column('avg_face_to_path', sa.Float(), nullable=True),
        sa.Column('avg_offline', sa.Float(), nullable=True),
        sa.Column('dispersion_radius', sa.Float(), nullable=True),
        sa.Column('distance_percentile', sa.Integer(), nullable=True),
        sa.Column('accuracy_percentile', sa.Integer(), nullable=True),
        sa.Column('last_updated', sa.DateTime(), server_default=sa.text('now()')),
    )
    op.create_index('ix_club_stats_user_id', 'club_stats', ['user_id'])
    op.create_index('ix_club_stats_club_label', 'club_stats', ['user_id', 'club_label'])


def downgrade():
    op.drop_table('club_stats')
    op.drop_table('user_clubs')
    op.drop_table('user_bags')
