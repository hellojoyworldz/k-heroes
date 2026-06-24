import os
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from core.security import (
    USER_SESSION_COOKIE,
    create_access_token,
    get_jwt_expire_hours,
    verify_google_id_token,
)
from db.database import get_db
from db.models import User
from models.user import (
    GoogleLoginRequest,
    UserAuthResponse,
    UserLoginRequest,
    UserPlaySessionItem,
    UserResponse,
    UserSessionResponse,
    UserSignupRequest,
)
from repositories import user as user_repository
from router.v2.deps import get_current_user

router = APIRouter(prefix="/api/v2/auth", tags=["Auth v2"])


def issue_token(user: User) -> str:
    try:
        return create_access_token(
            subject_id=user.id,
            role=user.grade.value,
            token_kind="user",
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail="회원 인증이 설정되지 않았습니다.") from exc


def authenticate_user(body: UserLoginRequest, db: Session) -> User:
    try:
        return user_repository.authenticate_local_user(db, body)
    except ValueError:
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.") from None


def authenticate_google_user(body: GoogleLoginRequest, db: Session) -> User:
    try:
        payload = verify_google_id_token(body.id_token)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail="구글 인증이 설정되지 않았습니다.") from exc
    except ValueError:
        raise HTTPException(status_code=401, detail="구글 로그인 정보가 올바르지 않습니다.") from None
    except Exception:
        raise HTTPException(status_code=401, detail="구글 로그인 정보가 올바르지 않습니다.") from None

    provider_user_id = str(payload.get("sub") or "").strip()
    if not provider_user_id:
        raise HTTPException(status_code=401, detail="구글 로그인 정보가 올바르지 않습니다.")

    email = payload.get("email")
    name = payload.get("name")
    user = user_repository.authenticate_google_user(
        db,
        provider_user_id=provider_user_id,
        email=email if isinstance(email, str) and email else None,
        name=name if isinstance(name, str) and name else None,
    )
    db.commit()
    db.refresh(user)
    return user


@router.post("/signup", response_model=UserAuthResponse, status_code=201)
def signup(body: UserSignupRequest, db: Session = Depends(get_db)):
    """회원 — 로컬 가입."""
    try:
        user = user_repository.create_local_user(db, body)
        db.commit()
        db.refresh(user)
    except user_repository.UserDuplicateError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    access_token = issue_token(user)
    return UserAuthResponse(access_token=access_token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=UserAuthResponse)
def login(body: UserLoginRequest, db: Session = Depends(get_db)):
    """회원 — 로그인."""
    user = authenticate_user(body, db)
    access_token = issue_token(user)
    return UserAuthResponse(access_token=access_token, user=UserResponse.model_validate(user))


@router.post("/google", response_model=UserAuthResponse)
def google_login(body: GoogleLoginRequest, db: Session = Depends(get_db)):
    """회원 — 구글 로그인."""
    user = authenticate_google_user(body, db)
    access_token = issue_token(user)
    return UserAuthResponse(access_token=access_token, user=UserResponse.model_validate(user))


@router.post("/session", response_model=UserSessionResponse)
def create_session(
    body: UserLoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """회원 — 브라우저 세션 로그인."""
    user = authenticate_user(body, db)
    access_token = issue_token(user)
    response.set_cookie(
        key=USER_SESSION_COOKIE,
        value=access_token,
        httponly=True,
        max_age=get_jwt_expire_hours() * 60 * 60,
        path="/",
        samesite="lax",
        secure=os.environ.get("USER_COOKIE_SECURE", "false").lower() == "true",
    )
    return UserSessionResponse(user=UserResponse.model_validate(user))


@router.post("/google/session", response_model=UserSessionResponse)
def create_google_session(
    body: GoogleLoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """회원 — 구글 브라우저 세션 로그인."""
    user = authenticate_google_user(body, db)
    access_token = issue_token(user)
    response.set_cookie(
        key=USER_SESSION_COOKIE,
        value=access_token,
        httponly=True,
        max_age=get_jwt_expire_hours() * 60 * 60,
        path="/",
        samesite="lax",
        secure=os.environ.get("USER_COOKIE_SECURE", "false").lower() == "true",
    )
    return UserSessionResponse(user=UserResponse.model_validate(user))


@router.post("/session/logout", status_code=204)
def delete_session(response: Response):
    """회원 — 브라우저 세션 로그아웃."""
    response.delete_cookie(
        key=USER_SESSION_COOKIE,
        path="/",
        httponly=True,
        samesite="lax",
        secure=os.environ.get("USER_COOKIE_SECURE", "false").lower() == "true",
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """회원 — 현재 로그인 정보."""
    return current_user


@router.get("/sessions", response_model=list[UserPlaySessionItem])
def list_my_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    date_from: date | None = Query(None, description="완료일 시작일(YYYY-MM-DD)"),
    date_to: date | None = Query(None, description="완료일 종료일(YYYY-MM-DD)"),
    character_name: str | None = Query(None, description="캐릭터 이름 부분 일치"),
    scenario_title: str | None = Query(None, description="시나리오 제목 부분 일치"),
):
    """회원 — 완료한 시뮬레이션 기록."""
    return user_repository.list_completed_play_sessions(
        db,
        current_user.id,
        date_from=date_from,
        date_to=date_to,
        character_name=character_name,
        scenario_title=scenario_title,
    )
