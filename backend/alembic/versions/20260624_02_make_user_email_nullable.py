"""Make user email nullable.

Revision ID: 20260624_02_make_user_email_nullable
Revises: 20260624_01_add_user_login_id_name_grade
Create Date: 2026-06-24 14:44:05.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260624_02_make_user_email_nullable"
down_revision = "20260624_01_add_user_login_id_name_grade"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column(
            "email",
            existing_type=sa.String(length=255),
            nullable=True,
        )


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column(
            "email",
            existing_type=sa.String(length=255),
            nullable=False,
        )
