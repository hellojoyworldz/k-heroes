from typing import Optional, Union

import jwt
from fastapi import Cookie, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from core.security import ADMIN_SESSION_COOKIE, decode_access_token, get_jwt_secret
from db.database import get_db
from db.models import AdminRole, AdminUser

security = HTTPBearer(auto_error=False)

CONTENT_ADMIN_ROLES = (AdminRole.SUPERADMIN, AdminRole.ADMIN)


def get_current_admin_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session_token: Optional[str] = Cookie(default=None, alias=ADMIN_SESSION_COOKIE),
    db: Session = Depends(get_db),
) -> AdminUser:
    if not get_jwt_secret():
        raise HTTPException(status_code=503, detail="관리자 인증이 설정되지 않았습니다.")
    token = credentials.credentials if credentials else session_token
    if not token:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    try:
        payload = decode_access_token(token)
        admin_user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, ValueError, KeyError, TypeError):
        raise HTTPException(status_code=401, detail="로그인이 만료되었습니다.") from None

    admin_user = db.get(AdminUser, admin_user_id)
    if not admin_user or admin_user.deleted_at is not None or not admin_user.is_active:
        raise HTTPException(status_code=401, detail="사용할 수 없는 관리자 계정입니다.")
    return admin_user


def require_roles(*roles: Union[AdminRole, str]):
    allowed = {role.value if isinstance(role, AdminRole) else role for role in roles}

    def dependency(current_admin: AdminUser = Depends(get_current_admin_user)) -> AdminUser:
        if current_admin.role.value not in allowed:
            raise HTTPException(status_code=403, detail="해당 작업을 수행할 권한이 없습니다.")
        return current_admin

    return dependency


require_content_admin = require_roles(*CONTENT_ADMIN_ROLES)
