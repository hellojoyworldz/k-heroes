"""
어드민 JWT 발급 (Swagger / curl 테스트용).

사용법 (backend 디렉터리에서):
    python scripts/issue_admin_token.py --bootstrap
    python scripts/issue_admin_token.py --username superadmin --password 'your-pass'
    python scripts/issue_admin_token.py

.env (필수: JWT_SECRET, bootstrap 시 계정 정보):
    JWT_SECRET=...
    BOOTSTRAP_ADMIN_USERNAME=superadmin
    BOOTSTRAP_ADMIN_PASSWORD=your-password-min-8-chars
"""
from __future__ import annotations

import argparse
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from dotenv import load_dotenv

load_dotenv(os.path.join(BASE_DIR, "..", ".env"))

import db.models  # noqa: F401
from core.security import create_access_token, get_jwt_secret, hash_password, verify_password
from db.database import SessionLocal
from db.models import AdminRole, AdminUser
from repositories.auth.admin_user import get_admin_user_by_username


def bootstrap_superadmin(db, username: str, password: str) -> AdminUser:
    existing = get_admin_user_by_username(db, username)
    if existing:
        print(f"[SKIP] 어드민 '{username}' 이미 존재 (id={existing.id})")
        return existing

    admin_user = AdminUser(
        username=username,
        password_hash=hash_password(password),
        role=AdminRole.SUPERADMIN,
        is_active=True,
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    print(f"[SUCCESS] superadmin 생성: {username} (id={admin_user.id})")
    return admin_user


def issue_token(*, username: str, password: str) -> str:
    if not get_jwt_secret():
        raise RuntimeError("JWT_SECRET이 설정되지 않았습니다 (.env 확인)")

    db = SessionLocal()
    try:
        admin_user = get_admin_user_by_username(db, username)
        if not admin_user or not admin_user.is_active:
            raise RuntimeError(f"어드민 계정을 찾을 수 없습니다: {username}")
        if not verify_password(password, admin_user.password_hash):
            raise RuntimeError("비밀번호가 올바르지 않습니다")

        token = create_access_token(
            subject_id=admin_user.id,
            role=admin_user.role.value,
        )
        print(f"[INFO] role={admin_user.role.value}, expires_in_hours={os.environ.get('JWT_EXPIRE_HOURS', '8')}")
        return token
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="어드민 JWT 발급 (Swagger 테스트용)")
    parser.add_argument("--username", default=os.environ.get("BOOTSTRAP_ADMIN_USERNAME", "superadmin"))
    parser.add_argument("--password", default=os.environ.get("BOOTSTRAP_ADMIN_PASSWORD"))
    parser.add_argument(
        "--bootstrap",
        action="store_true",
        help="계정이 없으면 superadmin 생성 (username/password 필요, 최소 8자)",
    )
    args = parser.parse_args()

    if not args.password:
        parser.error("--password 또는 .env BOOTSTRAP_ADMIN_PASSWORD가 필요합니다")

    if len(args.password) < 8:
        parser.error("비밀번호는 8자 이상이어야 합니다")

    if args.bootstrap:
        db = SessionLocal()
        try:
            bootstrap_superadmin(db, args.username, args.password)
        finally:
            db.close()

    token = issue_token(username=args.username, password=args.password)

    print()
    print("=" * 60)
    print("access_token:")
    print(token)
    print("=" * 60)
    print()
    print("Swagger: Authorize → Bearer {위 토큰}")
    print(f'curl:  -H "Authorization: Bearer {token}"')


if __name__ == "__main__":
    main()
