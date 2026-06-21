import pytest

from tests.helpers import get_category

ADMIN_TOKEN = "test-admin-token"


@pytest.fixture
def admin_client(client, monkeypatch):
    monkeypatch.setenv("ADMIN_TOKEN", ADMIN_TOKEN)
    return client


def admin_headers():
    return {"Authorization": f"Bearer {ADMIN_TOKEN}"}


def test_list_character_categories_public(client):
    response = client.get("/api/v2/character-categories")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    assert data[0]["title"] == "정치 / 외교"
    assert all(item["is_active"] is True for item in data)


def test_list_character_categories_admin(admin_client):
    response = admin_client.get("/api/v2/admin/character-categories", headers=admin_headers())

    assert response.status_code == 200
    assert len(response.json()) == 4


def test_list_character_categories_admin_filter_is_active(admin_client, db_session):
    category = get_category(db_session, "실학 / 학문")
    category.is_active = False
    db_session.flush()

    all_response = admin_client.get("/api/v2/admin/character-categories", headers=admin_headers())
    active_response = admin_client.get(
        "/api/v2/admin/character-categories?is_active=true",
        headers=admin_headers(),
    )
    inactive_response = admin_client.get(
        "/api/v2/admin/character-categories?is_active=false",
        headers=admin_headers(),
    )

    assert len(all_response.json()) == 4
    assert len(active_response.json()) == 3
    assert len(inactive_response.json()) == 1
    assert inactive_response.json()[0]["title"] == "실학 / 학문"


def test_create_character_category(admin_client):
    response = admin_client.post(
        "/api/v2/admin/character-categories",
        json={"title": "신규 카테고리"},
        headers=admin_headers(),
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "신규 카테고리"
    assert data["sort_order"] == 4
    assert data["is_active"] is True


def test_create_character_category_rejects_sort_order(admin_client):
    response = admin_client.post(
        "/api/v2/admin/character-categories",
        json={"title": "순서 지정 시도", "sort_order": 0},
        headers=admin_headers(),
    )

    assert response.status_code == 422


def test_create_character_category_duplicate(admin_client):
    payload = {"title": "중복 카테고리"}

    first = admin_client.post(
        "/api/v2/admin/character-categories",
        json=payload,
        headers=admin_headers(),
    )
    second = admin_client.post(
        "/api/v2/admin/character-categories",
        json=payload,
        headers=admin_headers(),
    )

    assert first.status_code == 201
    assert second.status_code == 409


def test_update_character_category(admin_client, db_session):
    category = get_category(db_session, "예술 / 문학")
    assert category is not None

    response = admin_client.patch(
        f"/api/v2/admin/character-categories/{category.id}",
        json={"title": "예술 / 문학 (수정)", "is_active": False},
        headers=admin_headers(),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "예술 / 문학 (수정)"
    assert data["is_active"] is False


def test_update_character_category_rejects_sort_order(admin_client, db_session):
    category = get_category(db_session, "예술 / 문학")
    assert category is not None
    original_sort_order = category.sort_order

    response = admin_client.patch(
        f"/api/v2/admin/character-categories/{category.id}",
        json={"sort_order": 99},
        headers=admin_headers(),
    )

    assert response.status_code == 422
    db_session.refresh(category)
    assert category.sort_order == original_sort_order


def test_delete_character_category_soft(admin_client, db_session):
    create_response = admin_client.post(
        "/api/v2/admin/character-categories",
        json={"title": "삭제 카테고리"},
        headers=admin_headers(),
    )
    category_id = create_response.json()["id"]

    delete_response = admin_client.delete(
        f"/api/v2/admin/character-categories/{category_id}",
        headers=admin_headers(),
    )

    assert delete_response.status_code == 200
    assert delete_response.json()["deleted_at"] is not None

    list_response = admin_client.get("/api/v2/admin/character-categories", headers=admin_headers())
    assert category_id not in [item["id"] for item in list_response.json()]


def test_reorder_character_categories(admin_client, db_session):
    categories = admin_client.get("/api/v2/admin/character-categories", headers=admin_headers()).json()
    first = categories[0]
    second = categories[1]

    response = admin_client.patch(
        "/api/v2/admin/character-categories/reorder",
        json={"ids": [second["id"], first["id"]]},
        headers=admin_headers(),
    )

    assert response.status_code == 200
    reordered = {item["id"]: item["sort_order"] for item in response.json()}
    assert reordered[first["id"]] == 1
    assert reordered[second["id"]] == 0


def test_inactive_category_hidden_from_public_list(client, db_session):
    category = get_category(db_session, "실학 / 학문")
    category.is_active = False
    db_session.flush()

    response = client.get("/api/v2/character-categories")
    labels = [item["title"] for item in response.json()]
    assert "실학 / 학문" not in labels
