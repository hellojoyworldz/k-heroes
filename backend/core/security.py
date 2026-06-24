import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import jwt
import bcrypt
from google.auth.transport.requests import Request
from google.oauth2 import id_token as google_id_token

JWT_ALGORITHM = "HS256"
DEFAULT_JWT_EXPIRE_HOURS = 8
ADMIN_SESSION_COOKIE = "k_heroes_admin_session"
USER_SESSION_COOKIE = "k_heroes_user_session"


def get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET", "")


def get_jwt_expire_hours() -> int:
    return int(os.environ.get("JWT_EXPIRE_HOURS", str(DEFAULT_JWT_EXPIRE_HOURS)))


def get_google_client_id() -> str:
    return os.environ.get("GOOGLE_CLIENT_ID", "")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(*, subject_id: int, role: str, token_kind: str = "admin") -> str:
    secret = get_jwt_secret()
    if not secret:
        raise RuntimeError("JWT_SECRET is not configured")

    expire = datetime.now(timezone.utc) + timedelta(hours=get_jwt_expire_hours())
    payload: Dict[str, Any] = {
        "sub": str(subject_id),
        "role": role,
        "kind": token_kind,
        "exp": expire,
    }
    return jwt.encode(payload, secret, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    secret = get_jwt_secret()
    if not secret:
        raise RuntimeError("JWT_SECRET is not configured")
    return jwt.decode(token, secret, algorithms=[JWT_ALGORITHM])


def verify_google_id_token(token: str) -> Dict[str, Any]:
    client_id = get_google_client_id()
    if not client_id:
        raise RuntimeError("GOOGLE_CLIENT_ID is not configured")
    request = Request()
    return google_id_token.verify_oauth2_token(token, request, client_id)
