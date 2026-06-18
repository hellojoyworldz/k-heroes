"""
DB 테이블 생성 스크립트 (데이터 시드 없음).

사용법 (backend 디렉터리에서):
    python scripts/init_db.py           # 테이블 없으면 생성
    python scripts/init_db.py --reset   # 기존 테이블 전부 삭제 후 재생성
"""
from __future__ import annotations

import argparse
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from db.database import Base, engine
import db.models  # noqa: F401 — 모든 테이블을 metadata에 등록


def init_tables(reset: bool = False) -> None:
    if reset:
        print("[INFO] 기존 테이블 삭제 중...")
        Base.metadata.drop_all(bind=engine)

    print("[INFO] 테이블 생성 중...")
    Base.metadata.create_all(bind=engine)
    print("[SUCCESS] 테이블 생성 완료")


def main() -> None:
    parser = argparse.ArgumentParser(description="SQLite DB 테이블 생성")
    parser.add_argument("--reset", action="store_true", help="기존 테이블 삭제 후 재생성")
    args = parser.parse_args()
    init_tables(reset=args.reset)


if __name__ == "__main__":
    main()
