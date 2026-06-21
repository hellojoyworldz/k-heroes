"""character_categories.label → character_categories.title 마이그레이션."""

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
    if "character_categories" not in inspector.get_table_names():
        print("[SKIP] character_categories 테이블 없음")
        return

    columns = {col["name"] for col in inspector.get_columns("character_categories")}
    if "title" in columns:
        print("[SKIP] title 컬럼이 이미 존재합니다")
        return
    if "label" not in columns:
        print("[ERROR] label 컬럼을 찾을 수 없습니다")
        return

    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE character_categories RENAME COLUMN label TO title"))
    print("[SUCCESS] character_categories.label → title 마이그레이션 완료")


def main() -> None:
    parser = argparse.ArgumentParser(description="character category label → title DB 마이그레이션")
    parser.parse_args()
    migrate()


if __name__ == "__main__":
    main()
