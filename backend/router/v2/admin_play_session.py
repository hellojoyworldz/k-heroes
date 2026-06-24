from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import AdminRole, AdminUser
from models.pagination import ALLOWED_PAGE_SIZES, PaginatedResponse
from models.user import AdminPlaySessionItem
from repositories import user as user_repository
from router.v2.deps import require_roles

admin_router = APIRouter(
    prefix="/api/v2/admin/play-sessions",
    tags=["Play Sessions v2 Admin"],
    dependencies=[Depends(require_roles(AdminRole.SUPERADMIN, AdminRole.ADMIN))],
)


@admin_router.get("", response_model=PaginatedResponse[AdminPlaySessionItem])
def list_play_sessions(
    date_from: Optional[date] = Query(None, description="완료일 시작일(YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="완료일 종료일(YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="completed | in_progress"),
    user_login_id: Optional[str] = Query(None, description="회원 로그인 아이디 부분 일치"),
    character_name: Optional[str] = Query(None, description="캐릭터 이름 부분 일치"),
    scenario_title: Optional[str] = Query(None, description="시나리오 제목 부분 일치"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    db: Session = Depends(get_db),
):
    """어드민 — 시뮬레이션 완료/이력 목록."""
    if page_size not in ALLOWED_PAGE_SIZES:
        raise HTTPException(
            status_code=422,
            detail="페이지당 항목 수는 10, 20, 50, 100 중 하나여야 합니다.",
        )

    items, total = user_repository.list_play_sessions_for_admin(
        db,
        page=page,
        page_size=page_size,
        date_from=date_from,
        date_to=date_to,
        status=status,
        user_login_id=user_login_id,
        character_name=character_name,
        scenario_title=scenario_title,
    )
    return PaginatedResponse[AdminPlaySessionItem](
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=(total + page_size - 1) // page_size,
    )
