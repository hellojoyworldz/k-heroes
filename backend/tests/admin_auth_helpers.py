import pytest

from core.security import hash_password
from db.models import AdminRole, AdminUser

JWT_SECRET = "test-jwt-secret"
SUPERADMIN_USERNAME = "superadmin"
SUPERADMIN_PASSWORD = "super-secret"
ADMIN_USERNAME = "ops_admin"
ADMIN_PASSWORD = "admin-secret"
PARTNER_USERNAME = "partner01"
PARTNER_PASSWORD = "partner-secret"


@pytest.fixture
def jwt_env(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", JWT_SECRET)


def seed_admin_user(
    db_session,
    *,
    username: str,
    password: str,
    role: AdminRole,
    is_active: bool = True,
) -> AdminUser:
    admin_user = AdminUser(
        username=username,
        password_hash=hash_password(password),
        role=role,
        is_active=is_active,
    )
    db_session.add(admin_user)
    db_session.flush()
    return admin_user


@pytest.fixture
def superadmin_user(db_session):
    return seed_admin_user(
        db_session,
        username=SUPERADMIN_USERNAME,
        password=SUPERADMIN_PASSWORD,
        role=AdminRole.SUPERADMIN,
    )


@pytest.fixture
def admin_user(db_session):
    return seed_admin_user(
        db_session,
        username=ADMIN_USERNAME,
        password=ADMIN_PASSWORD,
        role=AdminRole.ADMIN,
    )


@pytest.fixture
def partner_user(db_session):
    return seed_admin_user(
        db_session,
        username=PARTNER_USERNAME,
        password=PARTNER_PASSWORD,
        role=AdminRole.PARTNER,
    )


def login_headers(client, username: str, password: str):
    response = client.post(
        "/api/v2/admin/auth/login",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def admin_headers(client):
    return login_headers(client, SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD)
