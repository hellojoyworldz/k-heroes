"""Make user nickname nullable.

Revision ID: 20260624_03_make_user_nickname_nullable
Revises: 20260624_02_make_user_email_nullable
Create Date: 2026-06-24 14:44:06.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260624_03_make_user_nickname_nullable"
down_revision = "20260624_02_make_user_email_nullable"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column(
            "nickname",
            existing_type=sa.String(length=100),
            nullable=True,
        )


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column(
            "nickname",
            existing_type=sa.String(length=100),
            nullable=False,
        )
