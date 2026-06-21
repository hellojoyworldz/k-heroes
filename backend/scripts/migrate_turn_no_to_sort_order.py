"""turns.turn_no → turns.sort_order 마이그레이션 (0-indexed)."""

from __future__ import annotations

import argparse
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from sqlalchemy import inspect, text

from db.database import engine


def migrate() -> None:
    inspector = inspect(engine)
    if "turns" not in inspector.get_table_names():
        print("[SKIP] turns 테이블 없음")
        return

    columns = {col["name"] for col in inspector.get_columns("turns")}
    if "sort_order" in columns:
        print("[SKIP] sort_order 컬럼이 이미 존재합니다")
        return
    if "turn_no" not in columns:
        print("[ERROR] turn_no 컬럼을 찾을 수 없습니다")
        return

    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE turns RENAME COLUMN turn_no TO sort_order"))
        conn.execute(text("UPDATE turns SET sort_order = sort_order - 1"))
    print("[SUCCESS] turns.turn_no → sort_order 마이그레이션 완료 (0-indexed)")


def main() -> None:
    parser = argparse.ArgumentParser(description="turn_no → sort_order DB 마이그레이션")
    parser.parse_args()
    migrate()


if __name__ == "__main__":
    main()
