"""Add optimistic-concurrency version column to rounds.

Each PATCH / shot write bumps `rounds.version`. Clients that pass
`If-Match: <version>` get a 409 when stale, letting them refetch and
merge instead of silently overwriting another device's edits.

Revision ID: 012_round_version
Revises: 011_range_sessions
Create Date: 2026-05-11
"""
from alembic import op
import sqlalchemy as sa


revision = "012_round_version"
down_revision = "011_range_sessions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "rounds",
        sa.Column(
            "version",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
    )


def downgrade() -> None:
    op.drop_column("rounds", "version")
