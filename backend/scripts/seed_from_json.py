"""
JSON 데이터(characters.json, endings/*.json)를 DB에 시드합니다.
테이블 생성은 init_db.py에서 먼저 실행하세요.

사용법 (backend 디렉터리에서):
    python scripts/init_db.py
    python scripts/seed_from_json.py
    python scripts/seed_from_json.py --force   # 기존 콘텐츠 삭제 후 재시드
"""
from __future__ import annotations

import argparse
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from db.seed import run_seed


def main() -> None:
    parser = argparse.ArgumentParser(description="JSON 데이터를 SQLite DB로 시드")
    parser.add_argument(
        "--force",
        action="store_true",
        help="기존 콘텐츠 데이터 삭제 후 재시드 (users/play_sessions는 유지)",
    )
    args = parser.parse_args()
    run_seed(force=args.force)


if __name__ == "__main__":
    main()
