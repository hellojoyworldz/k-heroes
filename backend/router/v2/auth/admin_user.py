from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import AdminRole, AdminUser
from models.auth.admin_user import AdminUserCreate, AdminUserResponse, AdminUserUpdate
from models.common.pagination import ALLOWED_PAGE_SIZES, PaginatedResponse
from repositories.auth import admin_user as admin_user_repository
from router.v2.deps import require_roles

admin_router = APIRouter(
    prefix="/api/v2/admin/admin-users",
    tags=["Admin Users v2 Admin"],
    dependencies=[Depends(require_roles(AdminRole.SUPERADMIN, AdminRole.ADMIN))],
)


@admin_router.get("", response_model=PaginatedResponse[AdminUserResponse])
def list_admin_users(
    role: Optional[AdminRole] = Query(None, description="superadmin | admin | partner"),
    is_active: Optional[bool] = Query(None, description="true=활성만, false=비활성만, 생략=전체"),
    username: Optional[str] = Query(None, description="아이디 부분 일치"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    db: Session = Depends(get_db),
):
    """어드민 — 어드민 회원 목록."""
    if page_size not in ALLOWED_PAGE_SIZES:
        raise HTTPException(
            status_code=422,
            detail="페이지당 항목 수는 10, 20, 50, 100 중 하나여야 합니다.",
        )

    users, total = admin_user_repository.list_admin_users(
        db,
        role=role,
        is_active=is_active,
        username=username,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse[AdminUserResponse](
        items=users,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=(total + page_size - 1) // page_size,
    )


@admin_router.get("/{admin_user_id}", response_model=AdminUserResponse)
def get_admin_user(admin_user_id: int, db: Session = Depends(get_db)):
    """어드민 — 어드민 회원 상세."""
    try:
        return admin_user_repository.get_admin_user_by_id(db, admin_user_id)
    except admin_user_repository.AdminUserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@admin_router.post("", response_model=AdminUserResponse, status_code=201)
def create_admin_user(
    body: AdminUserCreate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_roles(AdminRole.SUPERADMIN, AdminRole.ADMIN)),
):
    """어드민 — 어드민 회원 생성."""
    try:
        admin_user = admin_user_repository.create_admin_user(db, current_admin, body)
        db.commit()
    except admin_user_repository.AdminUserDuplicateError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except admin_user_repository.AdminUserForbiddenError as exc:
        db.rollback()
        raise HTTPException(status_code=403, detail=str(exc)) from exc

    return admin_user


@admin_router.patch("/{admin_user_id}", response_model=AdminUserResponse)
def update_admin_user(
    admin_user_id: int,
    body: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_roles(AdminRole.SUPERADMIN, AdminRole.ADMIN)),
):
    """어드민 — 어드민 회원 수정."""
    try:
        admin_user = admin_user_repository.update_admin_user(db, current_admin, admin_user_id, body)
        db.commit()
    except admin_user_repository.AdminUserNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except admin_user_repository.AdminUserForbiddenError as exc:
        db.rollback()
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except admin_user_repository.LastSuperadminError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    return admin_user


@admin_router.delete("/{admin_user_id}", response_model=AdminUserResponse)
def delete_admin_user(
    admin_user_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(require_roles(AdminRole.SUPERADMIN, AdminRole.ADMIN)),
):
    """어드민 — 어드민 회원 소프트 삭제."""
    try:
        admin_user = admin_user_repository.delete_admin_user(db, current_admin, admin_user_id)
        db.commit()
    except admin_user_repository.AdminUserNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except admin_user_repository.AdminUserForbiddenError as exc:
        db.rollback()
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except admin_user_repository.LastSuperadminError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    return admin_user
