from datetime import datetime

import pytest

from core.security import hash_password
from db.models import AuthProvider, PlaySession, User, UserGrade
from tests.admin_auth_helpers import (
    SUPERADMIN_PASSWORD,
    SUPERADMIN_USERNAME,
    jwt_env,
    login_headers,
    superadmin_user,
)


def seed_user(db_session, login_id: str, name: str) -> User:
    user = User(
        auth_provider=AuthProvider.LOCAL,
        login_id=login_id,
        name=name,
        email=f"{login_id}@example.com",
        password_hash=hash_password("user-secret"),
        nickname=name,
        grade=UserGrade.STUDENT,
    )
    db_session.add(user)
    db_session.flush()
    return user


def seed_play_session(
    db_session,
    *,
    session_id: str,
    user_id: int,
    character_name: str,
    scenario_title: str,
    completed_at: datetime,
) -> PlaySession:
    session = PlaySession(
        id=session_id,
        user_id=user_id,
        scenario_id=None,
        ending_id=None,
        status="completed",
        choices_path=["A", "A"],
        history_score=100,
        final_stats={},
        character_name=character_name,
        scenario_title=scenario_title,
        created_at=completed_at,
        completed_at=completed_at,
    )
    db_session.add(session)
    db_session.flush()
    return session


@pytest.mark.usefixtures("jwt_env", "superadmin_user")
def test_list_play_sessions_as_admin(client, db_session):
    user = seed_user(db_session, "user01", "회원1")
    seed_play_session(
        db_session,
        session_id="session-1",
        user_id=user.id,
        character_name="이순신",
        scenario_title="첫 시나리오",
        completed_at=datetime(2026, 1, 10, 12, 0, 0),
    )
    seed_play_session(
        db_session,
        session_id="session-2",
        user_id=user.id,
        character_name="이황",
        scenario_title="둘째 시나리오",
        completed_at=datetime(2026, 2, 10, 12, 0, 0),
    )
    db_session.commit()

    response = client.get(
        "/api/v2/admin/play-sessions",
        headers=login_headers(client, SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2
    assert data["items"][0]["user_login_id"] == "user01"
    assert data["items"][0]["scenario_title"] == "둘째 시나리오"


@pytest.mark.usefixtures("jwt_env", "superadmin_user")
def test_filter_play_sessions_by_date_and_character(client, db_session):
    user = seed_user(db_session, "user02", "회원2")
    seed_play_session(
        db_session,
        session_id="session-3",
        user_id=user.id,
        character_name="이순신",
        scenario_title="첫 시나리오",
        completed_at=datetime(2026, 1, 10, 12, 0, 0),
    )
    seed_play_session(
        db_session,
        session_id="session-4",
        user_id=user.id,
        character_name="이황",
        scenario_title="둘째 시나리오",
        completed_at=datetime(2026, 3, 10, 12, 0, 0),
    )
    db_session.commit()

    response = client.get(
        "/api/v2/admin/play-sessions?date_from=2026-03-01&character_name=이황",
        headers=login_headers(client, SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["character_name"] == "이황"
    assert data["items"][0]["id"] == "session-4"
