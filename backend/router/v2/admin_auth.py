from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.security import create_access_token, verify_password
from db.database import get_db
from db.models import AdminUser
from models.admin_user import AdminLoginRequest, AdminLoginResponse, AdminUserResponse
from repositories import admin_user as admin_user_repository
from router.v2.deps import get_current_admin_user

router = APIRouter(prefix="/api/v2/admin/auth", tags=["Admin Auth v2"])


@router.post("/login", response_model=AdminLoginResponse)
def login(body: AdminLoginRequest, db: Session = Depends(get_db)):
    """어드민 — 로그인."""
    admin_user = admin_user_repository.get_admin_user_by_username(db, body.username)
    if not admin_user or not admin_user.is_active:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not verify_password(body.password, admin_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    try:
        access_token = create_access_token(
            admin_user_id=admin_user.id,
            role=admin_user.role.value,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail="Admin auth is not configured") from exc

    admin_user_repository.record_login(db, admin_user)
    db.commit()
    db.refresh(admin_user)

    return AdminLoginResponse(
        access_token=access_token,
        admin_user=AdminUserResponse.model_validate(admin_user),
    )


@router.get("/me", response_model=AdminUserResponse)
def get_me(current_admin: AdminUser = Depends(get_current_admin_user)):
    """어드민 — 현재 로그인 정보."""
    return current_admin
