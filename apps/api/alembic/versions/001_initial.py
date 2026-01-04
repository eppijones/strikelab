"""Initial migration

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('display_name', sa.String(100), nullable=False),
        sa.Column('handicap_index', sa.Float, nullable=True),
        sa.Column('language', sa.String(5), default='en'),
        sa.Column('units', sa.String(10), default='yards'),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Friend Links
    op.create_table(
        'friend_links',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('friend_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
    )
    
    # Invites
    op.create_table(
        'invites',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('creator_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('token', sa.String(64), unique=True, nullable=False, index=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('message', sa.Text, nullable=True),
        sa.Column('used', sa.Boolean, default=False),
        sa.Column('used_by_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime, nullable=True),
    )
    
    # Courses
    op.create_table(
        'courses',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('par', sa.Integer, nullable=True),
        sa.Column('slope_rating', sa.Float, nullable=True),
        sa.Column('course_rating', sa.Float, nullable=True),
        sa.Column('holes', postgresql.JSON, nullable=True),
        sa.Column('latitude', sa.Float, nullable=True),
        sa.Column('longitude', sa.Float, nullable=True),
        sa.Column('golfbox_id', sa.String(100), nullable=True),
        sa.Column('gimmie_id', sa.String(100), nullable=True),
        sa.Column('teeone_id', sa.String(100), nullable=True),
        sa.Column('website', sa.String(500), nullable=True),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Sessions
    op.create_table(
        'sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('source', sa.String(50), nullable=False),
        sa.Column('session_type', sa.String(50), default='range'),
        sa.Column('name', sa.String(200), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('session_date', sa.DateTime, nullable=False),
        sa.Column('raw_data', postgresql.JSON, nullable=True),
        sa.Column('computed_stats', postgresql.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Shots
    op.create_table(
        'shots',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sessions.id'), nullable=False),
        sa.Column('shot_number', sa.Integer, nullable=False),
        sa.Column('club', sa.String(50), nullable=False),
        sa.Column('target_distance', sa.Float, nullable=True),
        sa.Column('carry_distance', sa.Float, nullable=True),
        sa.Column('total_distance', sa.Float, nullable=True),
        sa.Column('ball_speed', sa.Float, nullable=True),
        sa.Column('launch_angle', sa.Float, nullable=True),
        sa.Column('spin_rate', sa.Float, nullable=True),
        sa.Column('spin_axis', sa.Float, nullable=True),
        sa.Column('peak_height', sa.Float, nullable=True),
        sa.Column('land_angle', sa.Float, nullable=True),
        sa.Column('hang_time', sa.Float, nullable=True),
        sa.Column('offline_distance', sa.Float, nullable=True),
        sa.Column('club_speed', sa.Float, nullable=True),
        sa.Column('smash_factor', sa.Float, nullable=True),
        sa.Column('attack_angle', sa.Float, nullable=True),
        sa.Column('club_path', sa.Float, nullable=True),
        sa.Column('face_angle', sa.Float, nullable=True),
        sa.Column('face_to_path', sa.Float, nullable=True),
        sa.Column('face_to_target', sa.Float, nullable=True),
        sa.Column('impact_height', sa.Float, nullable=True),
        sa.Column('impact_offset', sa.Float, nullable=True),
        sa.Column('is_mishit', sa.Boolean, default=False),
        sa.Column('mishit_type', sa.String(50), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
    )
    
    # Tee Times
    op.create_table(
        'tee_times',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('course_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('courses.id'), nullable=True),
        sa.Column('tee_time', sa.DateTime, nullable=False),
        sa.Column('players', postgresql.JSON, nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('prep_notes', sa.Text, nullable=True),
        sa.Column('focus_areas', postgresql.JSON, nullable=True),
        sa.Column('booking_source', sa.String(50), nullable=True),
        sa.Column('booking_reference', sa.String(100), nullable=True),
        sa.Column('status', sa.String(20), default='scheduled'),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sessions.id'), nullable=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Session Log Templates
    op.create_table(
        'session_log_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('language', sa.String(5), default='en'),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('structure', postgresql.JSON, nullable=False),
        sa.Column('is_default', sa.Boolean, default=False),
        sa.Column('is_system', sa.Boolean, default=True),
        sa.Column('created_by_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Session Logs
    op.create_table(
        'session_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sessions.id'), nullable=True),
        sa.Column('template_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('session_log_templates.id'), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('tee_time_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tee_times.id'), nullable=True),
        sa.Column('energy_level', sa.Integer, nullable=True),
        sa.Column('mental_state', sa.Integer, nullable=True),
        sa.Column('intent', sa.Text, nullable=True),
        sa.Column('routine_discipline', sa.Boolean, nullable=True),
        sa.Column('feel_tags', postgresql.JSON, nullable=True),
        sa.Column('shot_blocks', postgresql.JSON, nullable=True),
        sa.Column('what_worked', sa.Text, nullable=True),
        sa.Column('take_forward', sa.Text, nullable=True),
        sa.Column('dont_overthink', sa.Text, nullable=True),
        sa.Column('coach_note', sa.Text, nullable=True),
        sa.Column('voice_note_url', sa.String(500), nullable=True),
        sa.Column('voice_transcription', sa.Text, nullable=True),
        sa.Column('fatigue_mode', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Coach Reports
    op.create_table(
        'coach_reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sessions.id'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('diagnosis', sa.Text, nullable=True),
        sa.Column('interpretation', sa.Text, nullable=True),
        sa.Column('prescription', sa.Text, nullable=True),
        sa.Column('validation', sa.Text, nullable=True),
        sa.Column('next_best_move', sa.Text, nullable=True),
        sa.Column('linked_metrics', postgresql.JSON, nullable=True),
        sa.Column('report_type', sa.String(50), default='session'),
        sa.Column('language', sa.String(5), default='en'),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
    )
    
    # Chat Messages
    op.create_table(
        'chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sessions.id'), nullable=True),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('context', postgresql.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
    )
    
    # Training Plans
    op.create_table(
        'training_plans',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('focus_area', sa.String(100), nullable=True),
        sa.Column('structure', postgresql.JSON, nullable=True),
        sa.Column('drill_ids', postgresql.JSON, nullable=True),
        sa.Column('validation_metrics', postgresql.JSON, nullable=True),
        sa.Column('week_number', sa.Integer, default=1),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('started_at', sa.DateTime, nullable=True),
        sa.Column('completed_at', sa.DateTime, nullable=True),
        sa.Column('adherence_data', postgresql.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Drills
    op.create_table(
        'drills',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('name_no', sa.String(200), nullable=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('description_no', sa.Text, nullable=True),
        sa.Column('category', sa.String(50), nullable=True),
        sa.Column('focus_area', sa.String(100), nullable=True),
        sa.Column('clubs', postgresql.JSON, nullable=True),
        sa.Column('reps', sa.Integer, nullable=True),
        sa.Column('duration_minutes', sa.Integer, nullable=True),
        sa.Column('instructions', postgresql.JSON, nullable=True),
        sa.Column('instructions_no', postgresql.JSON, nullable=True),
        sa.Column('constraints', postgresql.JSON, nullable=True),
        sa.Column('success_metric', sa.String(200), nullable=True),
        sa.Column('success_threshold', sa.Float, nullable=True),
        sa.Column('is_system', sa.Boolean, default=True),
        sa.Column('created_by_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
    )
    
    # Swing Videos
    op.create_table(
        'swing_videos',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sessions.id'), nullable=True),
        sa.Column('shot_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('shots.id'), nullable=True),
        sa.Column('view_type', sa.String(20), nullable=False),
        sa.Column('club', sa.String(50), nullable=True),
        sa.Column('video_url', sa.String(500), nullable=True),
        sa.Column('thumbnail_url', sa.String(500), nullable=True),
        sa.Column('status', sa.String(20), default='uploaded'),
        sa.Column('key_frames', postgresql.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
    )
    
    # Swing Analyses
    op.create_table(
        'swing_analyses',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('video_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('swing_videos.id'), nullable=False),
        sa.Column('pose_data', postgresql.JSON, nullable=True),
        sa.Column('feedback', postgresql.JSON, nullable=True),
        sa.Column('comparison', postgresql.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
    )
    
    # Metric Snapshots
    op.create_table(
        'metric_snapshots',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('snapshot_date', sa.DateTime, nullable=False),
        sa.Column('snapshot_type', sa.String(20), default='session'),
        sa.Column('strike_score', sa.Float, nullable=True),
        sa.Column('face_control_score', sa.Float, nullable=True),
        sa.Column('distance_control_score', sa.Float, nullable=True),
        sa.Column('dispersion_score', sa.Float, nullable=True),
        sa.Column('overall_score', sa.Float, nullable=True),
        sa.Column('metrics_by_club', postgresql.JSON, nullable=True),
        sa.Column('handicap_estimate', sa.Float, nullable=True),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('metric_snapshots')
    op.drop_table('swing_analyses')
    op.drop_table('swing_videos')
    op.drop_table('drills')
    op.drop_table('training_plans')
    op.drop_table('chat_messages')
    op.drop_table('coach_reports')
    op.drop_table('session_logs')
    op.drop_table('session_log_templates')
    op.drop_table('tee_times')
    op.drop_table('shots')
    op.drop_table('sessions')
    op.drop_table('courses')
    op.drop_table('invites')
    op.drop_table('friend_links')
    op.drop_table('users')
