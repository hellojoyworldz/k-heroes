"""Add choices_history to simulation_sessions.

Revision ID: 20260625_01_add_choices_history
Revises: 20260624_03_make_user_nickname_nullable
Create Date: 2026-06-25 00:00:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260625_01_add_choices_history"
down_revision = "20260624_03_make_user_nickname_nullable"
branch_labels = None
depends_on = None


def _table_columns(bind, table_name: str) -> set[str]:
    inspector = inspect(bind)
    if table_name not in inspector.get_table_names():
        return set()
    return {column["name"] for column in inspector.get_columns(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    if "simulation_sessions" not in inspect(bind).get_table_names():
        return

    columns = _table_columns(bind, "simulation_sessions")
    if "choices_history" not in columns:
        op.add_column(
            "simulation_sessions",
            sa.Column("choices_history", sa.JSON(), nullable=False, server_default="[]"),
        )


def downgrade() -> None:
    bind = op.get_bind()
    if "simulation_sessions" not in inspect(bind).get_table_names():
        return

    columns = _table_columns(bind, "simulation_sessions")
    if "choices_history" in columns:
        op.drop_column("simulation_sessions", "choices_history")
