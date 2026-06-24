from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.security import hash_password
from db.models import AdminRole, AdminUser
from models.auth.admin_user import AdminUserCreate, AdminUserUpdate


class AdminUserNotFoundError(Exception):
    def __init__(self, admin_user_id: int):
        self.admin_user_id = admin_user_id
        super().__init__(f"어드민 회원을 찾을 수 없습니다. (ID: {admin_user_id})")


class AdminUserDuplicateError(Exception):
    def __init__(self, username: str):
        self.username = username
        super().__init__(f"이미 사용 중인 아이디입니다. ({username})")


class AdminUserForbiddenError(Exception):
    def __init__(self, message: str):
        super().__init__(message)


class LastSuperadminError(Exception):
    def __init__(self):
        super().__init__("마지막 최고 관리자는 권한을 변경하거나 삭제할 수 없습니다.")


def _get_admin_user_or_raise(db: Session, admin_user_id: int) -> AdminUser:
    admin_user = db.get(AdminUser, admin_user_id)
    if not admin_user or admin_user.deleted_at is not None:
        raise AdminUserNotFoundError(admin_user_id)
    return admin_user


def _count_active_superadmins(db: Session, *, exclude_id: Optional[int] = None) -> int:
    query = select(AdminUser).where(
        AdminUser.role == AdminRole.SUPERADMIN,
        AdminUser.deleted_at.is_(None),
        AdminUser.is_active.is_(True),
    )
    if exclude_id is not None:
        query = query.where(AdminUser.id != exclude_id)
    return len(list(db.scalars(query)))


def _ensure_actor_can_manage_target(actor: AdminUser, target: AdminUser) -> None:
    if actor.role == AdminRole.SUPERADMIN:
        return
    if actor.role != AdminRole.ADMIN:
        raise AdminUserForbiddenError("해당 작업을 수행할 권한이 없습니다.")
    if target.role == AdminRole.SUPERADMIN:
        raise AdminUserForbiddenError("최고 관리자 계정은 관리할 수 없습니다.")


def _ensure_actor_can_assign_role(actor: AdminUser, role: AdminRole) -> None:
    if actor.role == AdminRole.SUPERADMIN:
        return
    if actor.role != AdminRole.ADMIN:
        raise AdminUserForbiddenError("해당 작업을 수행할 권한이 없습니다.")
    if role == AdminRole.SUPERADMIN:
        raise AdminUserForbiddenError("최고 관리자 역할을 부여할 수 없습니다.")


def _ensure_unique_username(db: Session, username: str) -> None:
    existing = db.scalar(
        select(AdminUser).where(
            AdminUser.username == username,
            AdminUser.deleted_at.is_(None),
        )
    )
    if existing:
        raise AdminUserDuplicateError(username)


def get_admin_user_by_username(db: Session, username: str) -> Optional[AdminUser]:
    return db.scalar(
        select(AdminUser).where(
            AdminUser.username == username,
            AdminUser.deleted_at.is_(None),
        )
    )


def list_admin_users(
    db: Session,
    *,
    role: Optional[AdminRole] = None,
    is_active: Optional[bool] = None,
    username: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[AdminUser], int]:
    conditions = [AdminUser.deleted_at.is_(None)]
    if role is not None:
        conditions.append(AdminUser.role == role)
    if is_active is not None:
        conditions.append(AdminUser.is_active == is_active)
    if username:
        conditions.append(AdminUser.username.contains(username))

    total = db.scalar(select(func.count(AdminUser.id)).where(*conditions)) or 0
    query = (
        select(AdminUser)
        .where(*conditions)
        .order_by(AdminUser.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(db.scalars(query)), total


def get_admin_user_by_id(db: Session, admin_user_id: int) -> AdminUser:
    return _get_admin_user_or_raise(db, admin_user_id)


def create_admin_user(db: Session, actor: AdminUser, data: AdminUserCreate) -> AdminUser:
    _ensure_actor_can_assign_role(actor, data.role)
    _ensure_unique_username(db, data.username)

    admin_user = AdminUser(
        username=data.username,
        password_hash=hash_password(data.password),
        role=data.role,
        is_active=True,
    )
    db.add(admin_user)
    db.flush()
    db.refresh(admin_user)
    return admin_user


def update_admin_user(
    db: Session,
    actor: AdminUser,
    admin_user_id: int,
    data: AdminUserUpdate,
) -> AdminUser:
    admin_user = _get_admin_user_or_raise(db, admin_user_id)
    _ensure_actor_can_manage_target(actor, admin_user)

    updates = data.model_dump(exclude_unset=True)

    if "role" in updates:
        new_role = updates["role"]
        _ensure_actor_can_assign_role(actor, new_role)
        if (
            admin_user.role == AdminRole.SUPERADMIN
            and new_role != AdminRole.SUPERADMIN
            and _count_active_superadmins(db, exclude_id=admin_user.id) == 0
        ):
            raise LastSuperadminError()

    if "is_active" in updates and updates["is_active"] is False:
        if (
            admin_user.role == AdminRole.SUPERADMIN
            and _count_active_superadmins(db, exclude_id=admin_user.id) == 0
        ):
            raise LastSuperadminError()

    if "password" in updates:
        admin_user.password_hash = hash_password(updates.pop("password"))

    for field, value in updates.items():
        setattr(admin_user, field, value)

    db.flush()
    db.refresh(admin_user)
    return admin_user


def delete_admin_user(db: Session, actor: AdminUser, admin_user_id: int) -> AdminUser:
    admin_user = _get_admin_user_or_raise(db, admin_user_id)
    _ensure_actor_can_manage_target(actor, admin_user)

    if (
        admin_user.role == AdminRole.SUPERADMIN
        and _count_active_superadmins(db, exclude_id=admin_user.id) == 0
    ):
        raise LastSuperadminError()

    admin_user.deleted_at = datetime.now(timezone.utc)
    db.flush()
    db.refresh(admin_user)
    return admin_user


def record_login(db: Session, admin_user: AdminUser) -> None:
    admin_user.last_login_at = datetime.now(timezone.utc)
    db.flush()
