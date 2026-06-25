from datetime import datetime

import pytest

from core.security import hash_password
from db.models import AuthProvider, PlaySession, User, UserGrade
from tests.helpers import get_scenario

TEST_LOGIN_ID = "studentone"
TEST_PASSWORD = "user-secret"


def seed_user(db_session, *, login_id: str = TEST_LOGIN_ID):
    user = User(
        auth_provider=AuthProvider.LOCAL,
        login_id=login_id,
        name="학생1",
        email=f"{login_id}@example.com",
        password_hash=hash_password(TEST_PASSWORD),
        nickname="학생1",
        grade=UserGrade.STUDENT,
    )
    db_session.add(user)
    db_session.flush()
    return user


def seed_completed_session(
    db_session,
    *,
    user_id: int,
    scenario_id: int,
    character_name: str,
    scenario_title: str,
    session_id: str,
    completed_at: datetime,
) -> PlaySession:
    session = PlaySession(
        id=session_id,
        user_id=user_id,
        scenario_id=scenario_id,
        ending_id=None,
        status="completed",
        choices_path=["A", "A", "A"],
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


@pytest.mark.usefixtures("jwt_env")
def test_signup(client):
    response = client.post(
        "/api/v2/auth/signup",
        json={
            "login_id": TEST_LOGIN_ID,
            "password": TEST_PASSWORD,
            "name": "학생1",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["access_token"]
    assert data["token_type"] == "bearer"
    assert data["user"]["login_id"] == TEST_LOGIN_ID
    assert data["user"]["grade"] == "student"


@pytest.mark.usefixtures("jwt_env")
def test_signup_without_name_and_email(client):
    response = client.post(
        "/api/v2/auth/signup",
        json={
            "login_id": "studenttwo",
            "password": TEST_PASSWORD,
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["user"]["login_id"] == "studenttwo"
    assert data["user"]["name"] is None
    assert data["user"]["email"] is None


@pytest.mark.usefixtures("jwt_env")
def test_signup_duplicate_login_id(client, db_session):
    seed_user(db_session)

    response = client.post(
        "/api/v2/auth/signup",
        json={
            "login_id": TEST_LOGIN_ID,
            "password": TEST_PASSWORD,
            "name": "학생2",
        },
    )

    assert response.status_code == 409


@pytest.mark.usefixtures("jwt_env")
def test_signup_rejects_short_login_id(client):
    response = client.post(
        "/api/v2/auth/signup",
        json={
            "login_id": "abc",
            "password": TEST_PASSWORD,
            "name": "학생2",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "아이디는 4자 이상 50자 이하로 입력해 주세요."


@pytest.mark.usefixtures("jwt_env")
def test_signup_allows_digits_and_specials(client):
    response = client.post(
        "/api/v2/auth/signup",
        json={
            "login_id": "user123",
            "password": TEST_PASSWORD,
            "name": "학생2",
        },
    )

    assert response.status_code == 201


@pytest.mark.usefixtures("jwt_env")
def test_signup_rejects_invalid_email(client):
    response = client.post(
        "/api/v2/auth/signup",
        json={
            "login_id": "studenttwo",
            "password": TEST_PASSWORD,
            "email": "not-an-email",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "이메일 형식이 올바르지 않습니다."


@pytest.mark.usefixtures("jwt_env")
def test_login_rejects_short_login_id(client):
    response = client.post(
        "/api/v2/auth/login",
        json={"login_id": "abc", "password": TEST_PASSWORD},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "아이디는 4자 이상 50자 이하로 입력해 주세요."


@pytest.mark.usefixtures("jwt_env")
def test_login_allows_digits_and_specials(client, db_session):
    seed_user(db_session, login_id="user123")

    response = client.post(
        "/api/v2/auth/login",
        json={"login_id": "user123", "password": TEST_PASSWORD},
    )

    assert response.status_code == 200


@pytest.mark.usefixtures("jwt_env")
def test_login_rejects_invalid_start_character(client):
    response = client.post(
        "/api/v2/auth/login",
        json={"login_id": "User123", "password": TEST_PASSWORD},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "아이디는 소문자로 시작해 주세요."


@pytest.mark.usefixtures("jwt_env")
def test_login_and_me(client, db_session):
    seed_user(db_session)

    login_response = client.post(
        "/api/v2/auth/login",
        json={"login_id": TEST_LOGIN_ID, "password": TEST_PASSWORD},
    )

    assert login_response.status_code == 200
    data = login_response.json()
    assert data["user"]["login_id"] == TEST_LOGIN_ID

    me_response = client.get(
        "/api/v2/auth/me",
        headers={"Authorization": f"Bearer {data['access_token']}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["login_id"] == TEST_LOGIN_ID


@pytest.mark.usefixtures("jwt_env")
def test_session_cookie_login_and_logout(client, db_session):
    seed_user(db_session)

    login_response = client.post(
        "/api/v2/auth/session",
        json={"login_id": TEST_LOGIN_ID, "password": TEST_PASSWORD},
    )

    assert login_response.status_code == 200
    assert login_response.json()["user"]["login_id"] == TEST_LOGIN_ID
    assert login_response.cookies.get("k_heroes_user_session")
    assert "Max-Age" not in login_response.headers["set-cookie"]

    me_response = client.get("/api/v2/auth/me")
    assert me_response.status_code == 200
    assert me_response.json()["login_id"] == TEST_LOGIN_ID

    logout_response = client.post("/api/v2/auth/session/logout")
    assert logout_response.status_code == 204
    assert not client.cookies.get("k_heroes_user_session")


@pytest.mark.usefixtures("jwt_env")
def test_session_cookie_login_remember_me_sets_persistent_cookie(client, db_session):
    seed_user(db_session)

    login_response = client.post(
        "/api/v2/auth/session",
        json={
            "login_id": TEST_LOGIN_ID,
            "password": TEST_PASSWORD,
            "remember_me": True,
        },
    )

    assert login_response.status_code == 200
    assert login_response.cookies.get("k_heroes_user_session")
    assert "Max-Age=2592000" in login_response.headers["set-cookie"]


@pytest.mark.usefixtures("jwt_env")
def test_sessions_date_filter(client, db_session):
    user = seed_user(db_session)
    scenario = get_scenario(db_session, "이순신", 0)
    assert scenario is not None

    seed_completed_session(
        db_session,
        user_id=user.id,
        scenario_id=scenario.id,
        character_name="이순신",
        scenario_title="first scenario",
        session_id="session-1",
        completed_at=datetime(2026, 1, 10, 12, 0, 0),
    )
    seed_completed_session(
        db_session,
        user_id=user.id,
        scenario_id=scenario.id,
        character_name="이순신",
        scenario_title="second scenario",
        session_id="session-2",
        completed_at=datetime(2026, 2, 20, 12, 0, 0),
    )
    db_session.commit()

    login_response = client.post(
        "/api/v2/auth/login",
        json={"login_id": TEST_LOGIN_ID, "password": TEST_PASSWORD},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    filtered_response = client.get(
        "/api/v2/auth/sessions?date_from=2026-02-01&date_to=2026-02-28",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert filtered_response.status_code == 200
    payload = filtered_response.json()
    assert payload["page"] == 1
    assert payload["page_size"] == 20
    assert payload["total"] == 1
    assert payload["total_pages"] == 1
    assert payload["summary"]["completed_count"] == 1
    assert payload["summary"]["average_history_score"] == 100.0
    assert len(payload["items"]) == 1
    assert payload["items"][0]["id"] == "session-2"

    title_filtered_response = client.get(
        "/api/v2/auth/sessions?scenario_title=first",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert title_filtered_response.status_code == 200
    title_payload = title_filtered_response.json()
    assert len(title_payload["items"]) == 1
    assert title_payload["items"][0]["id"] == "session-1"


@pytest.mark.usefixtures("jwt_env")
def test_sessions_pagination_and_summary(client, db_session):
    user = seed_user(db_session)
    scenario = get_scenario(db_session, "이순신", 0)
    assert scenario is not None

    seed_completed_session(
        db_session,
        user_id=user.id,
        scenario_id=scenario.id,
        character_name="이순신",
        scenario_title="first scenario",
        session_id="session-1",
        completed_at=datetime(2026, 1, 10, 12, 0, 0),
    )
    session_2 = seed_completed_session(
        db_session,
        user_id=user.id,
        scenario_id=scenario.id,
        character_name="이순신",
        scenario_title="second scenario",
        session_id="session-2",
        completed_at=datetime(2026, 2, 20, 12, 0, 0),
    )
    session_2.history_score = 80
    db_session.commit()

    login_response = client.post(
        "/api/v2/auth/login",
        json={"login_id": TEST_LOGIN_ID, "password": TEST_PASSWORD},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    page1_response = client.get(
        "/api/v2/auth/sessions?page=1&page_size=1",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert page1_response.status_code == 200
    page1_payload = page1_response.json()
    assert page1_payload["page"] == 1
    assert page1_payload["page_size"] == 1
    assert page1_payload["total"] == 2
    assert page1_payload["total_pages"] == 2
    assert page1_payload["summary"]["completed_count"] == 2
    assert page1_payload["summary"]["average_history_score"] == 90.0
    assert len(page1_payload["items"]) == 1

    page2_response = client.get(
        "/api/v2/auth/sessions?page=2&page_size=1",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert page2_response.status_code == 200
    page2_payload = page2_response.json()
    assert page2_payload["page"] == 2
    assert len(page2_payload["items"]) == 1


@pytest.mark.usefixtures("jwt_env")
def test_update_my_profile_and_password(client, db_session):
    seed_user(db_session)

    login_response = client.post(
        "/api/v2/auth/login",
        json={"login_id": TEST_LOGIN_ID, "password": TEST_PASSWORD},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    update_response = client.patch(
        "/api/v2/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "수정된이름",
            "email": "updated@example.com",
            "nickname": "새닉네임",
            "current_password": TEST_PASSWORD,
            "new_password": "new-secret-password",
        },
    )
    assert update_response.status_code == 200
    data = update_response.json()
    assert data["name"] == "수정된이름"
    assert data["email"] == "updated@example.com"
    assert data["nickname"] == "새닉네임"

    relogin_response = client.post(
        "/api/v2/auth/login",
        json={"login_id": TEST_LOGIN_ID, "password": "new-secret-password"},
    )
    assert relogin_response.status_code == 200


@pytest.mark.usefixtures("jwt_env")
def test_update_my_profile_duplicate_email(client, db_session):
    seed_user(db_session)
    other_user = User(
        auth_provider=AuthProvider.LOCAL,
        login_id="studenttwo",
        name="학생2",
        email="duplicate@example.com",
        password_hash=hash_password(TEST_PASSWORD),
        nickname="학생2",
        grade=UserGrade.STUDENT,
    )
    db_session.add(other_user)
    db_session.commit()

    login_response = client.post(
        "/api/v2/auth/login",
        json={"login_id": TEST_LOGIN_ID, "password": TEST_PASSWORD},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    update_response = client.patch(
        "/api/v2/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"email": "duplicate@example.com"},
    )
    assert update_response.status_code == 409
