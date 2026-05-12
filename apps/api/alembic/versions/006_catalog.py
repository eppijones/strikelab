"""Catalog tables (brands, club_models, connectors) + course extensions.

Revision ID: 006_catalog
Revises: 005_caddie
Create Date: 2026-05-06
"""
from alembic import op
import sqlalchemy as sa


revision = "006_catalog"
down_revision = "005_caddie"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---------- brands ----------
    op.create_table(
        "brands",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False, unique=True),
        sa.Column("country", sa.String(80), nullable=True),
        sa.Column("founded", sa.Integer(), nullable=True),
        sa.Column("color", sa.String(20), nullable=True),
        sa.Column(
            "primary_category",
            sa.String(20),
            nullable=False,
            server_default="clubs",
        ),
        sa.Column("categories", sa.String(120), nullable=True),
        sa.Column("logo_path", sa.String(200), nullable=True),
        sa.Column("website", sa.String(300), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.true()
        ),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # ---------- club_models ----------
    op.create_table(
        "club_models",
        sa.Column("id", sa.String(120), primary_key=True),
        sa.Column(
            "brand_id",
            sa.String(50),
            sa.ForeignKey("brands.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("club_type", sa.String(30), nullable=False),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("default_loft", sa.Float(), nullable=True),
        sa.Column("default_lie", sa.Float(), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.true()
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_club_models_brand_id", "club_models", ["brand_id"])
    op.create_index("ix_club_models_club_type", "club_models", ["club_type"])

    # ---------- connectors ----------
    op.create_table(
        "connectors",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status", sa.String(20), nullable=False, server_default="available"
        ),
        sa.Column("capabilities", sa.String(400), nullable=True),
        sa.Column("color", sa.String(20), nullable=True),
        sa.Column("logo_path", sa.String(200), nullable=True),
        sa.Column("website", sa.String(300), nullable=True),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.true()
        ),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # ---------- courses extensions ----------
    op.add_column("courses", sa.Column("country_code", sa.String(8), nullable=True))
    op.add_column("courses", sa.Column("course_type", sa.String(40), nullable=True))
    op.add_column("courses", sa.Column("total_yards", sa.Integer(), nullable=True))
    op.add_column("courses", sa.Column("total_meters", sa.Integer(), nullable=True))
    op.add_column("courses", sa.Column("designer", sa.String(120), nullable=True))
    op.add_column("courses", sa.Column("established", sa.Integer(), nullable=True))
    op.add_column(
        "courses",
        sa.Column(
            "created_by_user_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "courses",
        sa.Column(
            "is_verified", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
    )

    # course_favorites — small join table
    op.create_table(
        "course_favorites",
        sa.Column(
            "user_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "course_id",
            sa.dialects.postgresql.UUID(as_uuid=True),
            sa.ForeignKey("courses.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )


def downgrade() -> None:
    op.drop_table("course_favorites")
    op.drop_column("courses", "is_verified")
    op.drop_column("courses", "created_by_user_id")
    op.drop_column("courses", "established")
    op.drop_column("courses", "designer")
    op.drop_column("courses", "total_meters")
    op.drop_column("courses", "total_yards")
    op.drop_column("courses", "course_type")
    op.drop_column("courses", "country_code")
    op.drop_table("connectors")
    op.drop_index("ix_club_models_club_type", "club_models")
    op.drop_index("ix_club_models_brand_id", "club_models")
    op.drop_table("club_models")
    op.drop_table("brands")
