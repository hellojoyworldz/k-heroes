import pytest

from tests.admin_auth_helpers import (
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    PARTNER_PASSWORD,
    PARTNER_USERNAME,
    SUPERADMIN_PASSWORD,
    SUPERADMIN_USERNAME,
    jwt_env,
    login_headers,
    superadmin_user,
)


@pytest.mark.usefixtures("jwt_env", "superadmin_user")
def test_login_success(client):
    response = client.post(
        "/api/v2/admin/auth/login",
        json={"username": SUPERADMIN_USERNAME, "password": SUPERADMIN_PASSWORD},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["access_token"]
    assert data["admin_user"]["username"] == SUPERADMIN_USERNAME
    assert data["admin_user"]["role"] == "superadmin"
    assert "password_hash" not in data["admin_user"]


@pytest.mark.usefixtures("jwt_env", "superadmin_user")
def test_login_invalid_password(client):
    response = client.post(
        "/api/v2/admin/auth/login",
        json={"username": SUPERADMIN_USERNAME, "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "아이디 또는 비밀번호가 올바르지 않습니다."


@pytest.mark.usefixtures("jwt_env", "superadmin_user")
def test_get_me(client):
    response = client.get(
        "/api/v2/admin/auth/me",
        headers=login_headers(client, SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD),
    )

    assert response.status_code == 200
    assert response.json()["username"] == SUPERADMIN_USERNAME


@pytest.mark.usefixtures("jwt_env", "superadmin_user")
def test_browser_session(client):
    login_response = client.post(
        "/api/v2/admin/auth/session",
        json={"username": SUPERADMIN_USERNAME, "password": SUPERADMIN_PASSWORD},
    )

    assert login_response.status_code == 200
    assert login_response.json()["admin_user"]["username"] == SUPERADMIN_USERNAME
    assert "access_token" not in login_response.json()
    assert login_response.cookies.get("k_heroes_admin_session")

    me_response = client.get("/api/v2/admin/auth/me")
    assert me_response.status_code == 200
    assert me_response.json()["username"] == SUPERADMIN_USERNAME

    logout_response = client.post("/api/v2/admin/auth/session/logout")
    assert logout_response.status_code == 204
    assert not client.cookies.get("k_heroes_admin_session")


def test_login_without_jwt_secret(client, superadmin_user):
    response = client.post(
        "/api/v2/admin/auth/login",
        json={"username": SUPERADMIN_USERNAME, "password": SUPERADMIN_PASSWORD},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "관리자 인증이 설정되지 않았습니다."
