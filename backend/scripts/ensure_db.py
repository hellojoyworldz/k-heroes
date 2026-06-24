"""
서버 시작 전 DB를 준비합니다 (Supabase/PostgreSQL 전용).

- 테이블 없으면 생성
- 콘텐츠 없으면 JSON 시드
- 어드민 계정 없으면 bootstrap (BOOTSTRAP_ADMIN_* 환경변수)
"""
from __future__ import annotations

import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from sqlalchemy import func, select

import db.models  # noqa: F401
from core.security import hash_password
from db.database import SessionLocal
from db.models import AdminRole, AdminUser, Character
from db.seed import run_seed
from repositories.admin_user import get_admin_user_by_username
from scripts.init_db import init_tables


def ensure_admin_user() -> None:
    username = os.environ.get("BOOTSTRAP_ADMIN_USERNAME", "").strip()
    password = os.environ.get("BOOTSTRAP_ADMIN_PASSWORD", "")

    if not username or not password:
        print("[SKIP] BOOTSTRAP_ADMIN_USERNAME/PASSWORD 미설정 — 어드민 자동 생성 생략")
        return

    if len(password) < 8:
        print("[WARNING] BOOTSTRAP_ADMIN_PASSWORD가 8자 미만 — 어드민 자동 생성 생략")
        return

    db = SessionLocal()
    try:
        existing = get_admin_user_by_username(db, username)
        if existing:
            print(f"[SKIP] 어드민 '{username}' 이미 존재 (id={existing.id})")
            return

        admin_user = AdminUser(
            username=username,
            password_hash=hash_password(password),
            role=AdminRole.SUPERADMIN,
            is_active=True,
        )
        db.add(admin_user)
        db.commit()
        print(f"[SUCCESS] superadmin 생성: {username} (id={admin_user.id})")
    finally:
        db.close()


def ensure_database() -> None:
    print("[INFO] DB 준비 중...")
    init_tables(reset=False)

    db = SessionLocal()
    try:
        character_count = db.scalar(select(func.count()).select_from(Character)) or 0
    finally:
        db.close()

    if character_count == 0:
        print("[INFO] 콘텐츠 데이터 없음 — Supabase JSON 시드 실행")
        run_seed(force=False)
    else:
        print(f"[INFO] 기존 DB 사용 중 (characters={character_count})")

    ensure_admin_user()
    print("[SUCCESS] DB 준비 완료")


if __name__ == "__main__":
    ensure_database()
