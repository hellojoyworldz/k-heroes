import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import jwt
import bcrypt

JWT_ALGORITHM = "HS256"
DEFAULT_JWT_EXPIRE_HOURS = 8
ADMIN_SESSION_COOKIE = "k_heroes_admin_session"


def get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET", "")


def get_jwt_expire_hours() -> int:
    return int(os.environ.get("JWT_EXPIRE_HOURS", str(DEFAULT_JWT_EXPIRE_HOURS)))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(*, admin_user_id: int, role: str) -> str:
    secret = get_jwt_secret()
    if not secret:
        raise RuntimeError("JWT_SECRET is not configured")

    expire = datetime.now(timezone.utc) + timedelta(hours=get_jwt_expire_hours())
    payload: Dict[str, Any] = {
        "sub": str(admin_user_id),
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, secret, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    secret = get_jwt_secret()
    if not secret:
        raise RuntimeError("JWT_SECRET is not configured")
    return jwt.decode(token, secret, algorithms=[JWT_ALGORITHM])
