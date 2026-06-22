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


@pytest.mark.usefixtures("jwt_env", "superadmin_user")
def test_get_me(client):
    response = client.get(
        "/api/v2/admin/auth/me",
        headers=login_headers(client, SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD),
    )

    assert response.status_code == 200
    assert response.json()["username"] == SUPERADMIN_USERNAME


def test_login_without_jwt_secret(client, superadmin_user):
    response = client.post(
        "/api/v2/admin/auth/login",
        json={"username": SUPERADMIN_USERNAME, "password": SUPERADMIN_PASSWORD},
    )

    assert response.status_code == 503
