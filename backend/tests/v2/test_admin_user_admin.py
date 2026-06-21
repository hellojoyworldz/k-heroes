import pytest

from db.models import AdminRole, AdminUser
from tests.admin_auth_helpers import (
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    PARTNER_PASSWORD,
    PARTNER_USERNAME,
    SUPERADMIN_PASSWORD,
    SUPERADMIN_USERNAME,
    admin_user,
    jwt_env,
    login_headers,
    partner_user,
    seed_admin_user,
    superadmin_user,
)


@pytest.mark.usefixtures("jwt_env", "superadmin_user", "admin_user")
def test_list_admin_users(client):
    response = client.get(
        "/api/v2/admin/admin-users",
        headers=login_headers(client, SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD),
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert {item["username"] for item in data} == {SUPERADMIN_USERNAME, ADMIN_USERNAME}


@pytest.mark.usefixtures("jwt_env", "superadmin_user", "admin_user")
def test_list_admin_users_filter_role(client):
    response = client.get(
        "/api/v2/admin/admin-users?role=admin",
        headers=login_headers(client, SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD),
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["username"] == ADMIN_USERNAME


@pytest.mark.usefixtures("jwt_env", "superadmin_user")
def test_create_admin_user_as_superadmin(client):
    response = client.post(
        "/api/v2/admin/admin-users",
        json={
            "username": "new_admin",
            "password": "new-admin1",
            "role": "admin",
        },
        headers=login_headers(client, SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD),
    )

    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "new_admin"
    assert data["role"] == "admin"
    assert data["is_active"] is True
    assert data["deleted_at"] is None


@pytest.mark.usefixtures("jwt_env", "superadmin_user", "admin_user")
def test_create_admin_user_as_admin(client):
    response = client.post(
        "/api/v2/admin/admin-users",
        json={
            "username": "partner_new",
            "password": "partner-new1",
            "role": "partner",
        },
        headers=login_headers(client, ADMIN_USERNAME, ADMIN_PASSWORD),
    )

    assert response.status_code == 201
    assert response.json()["role"] == "partner"


@pytest.mark.usefixtures("jwt_env", "superadmin_user", "admin_user")
def test_create_superadmin_as_admin_forbidden(client):
    response = client.post(
        "/api/v2/admin/admin-users",
        json={
            "username": "evil_super",
            "password": "evil-super1",
            "role": "superadmin",
        },
        headers=login_headers(client, ADMIN_USERNAME, ADMIN_PASSWORD),
    )

    assert response.status_code == 403


@pytest.mark.usefixtures("jwt_env", "superadmin_user", "admin_user")
def test_create_duplicate_username(client):
    response = client.post(
        "/api/v2/admin/admin-users",
        json={
            "username": ADMIN_USERNAME,
            "password": "another-pass",
            "role": "admin",
        },
        headers=login_headers(client, SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD),
    )

    assert response.status_code == 409


@pytest.mark.usefixtures("jwt_env")
def test_update_admin_user_as_superadmin(client, db_session, superadmin_user, admin_user):
    target = db_session.get(AdminUser, admin_user.id)

    response = client.patch(
        f"/api/v2/admin/admin-users/{target.id}",
        json={"is_active": False},
        headers=login_headers(client, SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD),
    )

    assert response.status_code == 200
    assert response.json()["is_active"] is False


@pytest.mark.usefixtures("jwt_env")
def test_update_superadmin_as_admin_forbidden(client, db_session, superadmin_user, admin_user):
    target = db_session.get(AdminUser, superadmin_user.id)

    response = client.patch(
        f"/api/v2/admin/admin-users/{target.id}",
        json={"is_active": False},
        headers=login_headers(client, ADMIN_USERNAME, ADMIN_PASSWORD),
    )

    assert response.status_code == 403


@pytest.mark.usefixtures("jwt_env")
def test_delete_admin_user_soft_delete(client, db_session, superadmin_user, admin_user):
    target = db_session.get(AdminUser, admin_user.id)

    response = client.delete(
        f"/api/v2/admin/admin-users/{target.id}",
        headers=login_headers(client, SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD),
    )

    assert response.status_code == 200
    assert response.json()["deleted_at"] is not None

    list_response = client.get(
        "/api/v2/admin/admin-users",
        headers=login_headers(client, SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD),
    )
    assert len(list_response.json()) == 1

    get_response = client.get(
        f"/api/v2/admin/admin-users/{target.id}",
        headers=login_headers(client, SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD),
    )
    assert get_response.status_code == 404


@pytest.mark.usefixtures("jwt_env")
def test_delete_last_superadmin_forbidden(client, db_session, superadmin_user):
    target = db_session.get(AdminUser, superadmin_user.id)

    response = client.delete(
        f"/api/v2/admin/admin-users/{target.id}",
        headers=login_headers(client, SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD),
    )

    assert response.status_code == 409


@pytest.mark.usefixtures("jwt_env", "superadmin_user", "partner_user")
def test_partner_cannot_access_admin_users(client):
    response = client.get(
        "/api/v2/admin/admin-users",
        headers=login_headers(client, PARTNER_USERNAME, PARTNER_PASSWORD),
    )

    assert response.status_code == 403


@pytest.mark.usefixtures("jwt_env", "superadmin_user")
def test_create_admin_user_rejects_short_password(client):
    response = client.post(
        "/api/v2/admin/admin-users",
        json={
            "username": "short_pw",
            "password": "123",
            "role": "admin",
        },
        headers=login_headers(client, SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD),
    )

    assert response.status_code == 422
