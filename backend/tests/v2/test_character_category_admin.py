import pytest

from tests.admin_auth_helpers import admin_headers
from tests.helpers import get_category


def test_list_character_categories_public(client):
    response = client.get("/api/v2/character-categories")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    assert set(data[0].keys()) == {"id", "title", "description", "length"}
    assert data[0]["title"] == "정치 / 외교"
    assert data[0]["description"] == "나라를 이끄는 결단"
    assert data[0]["length"] >= 1
    assert sum(item["length"] for item in data) == 12


def test_list_character_categories_admin(admin_client):
    response = admin_client.get("/api/v2/admin/character-categories", headers=admin_headers(admin_client))

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 4
    assert data["page"] == 1
    assert data["page_size"] == 20
    assert data["total"] == 4
    assert data["total_pages"] == 1


def test_list_character_categories_admin_filter_is_active(admin_client, db_session):
    category = get_category(db_session, "사상 / 학문")
    category.is_active = False
    db_session.flush()

    all_response = admin_client.get("/api/v2/admin/character-categories", headers=admin_headers(admin_client))
    active_response = admin_client.get(
        "/api/v2/admin/character-categories?is_active=true",
        headers=admin_headers(admin_client),
    )
    inactive_response = admin_client.get(
        "/api/v2/admin/character-categories?is_active=false",
        headers=admin_headers(admin_client),
    )

    assert len(all_response.json()["items"]) == 4
    assert len(active_response.json()["items"]) == 3
    assert len(inactive_response.json()["items"]) == 1
    assert inactive_response.json()["items"][0]["title"] == "사상 / 학문"
    assert inactive_response.json()["total"] == 1


def test_list_character_categories_admin_rejects_invalid_page_size(admin_client):
    response = admin_client.get(
        "/api/v2/admin/character-categories?page_size=30",
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 422


def test_create_character_category(admin_client):
    response = admin_client.post(
        "/api/v2/admin/character-categories",
        json={"title": "신규 카테고리", "description": "신규 설명"},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "신규 카테고리"
    assert data["description"] == "신규 설명"
    assert data["sort_order"] == 4
    assert data["is_active"] is True


def test_create_character_category_rejects_sort_order(admin_client):
    response = admin_client.post(
        "/api/v2/admin/character-categories",
        json={"title": "순서 지정 시도", "description": "설명", "sort_order": 0},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 422


def test_create_character_category_duplicate(admin_client):
    payload = {"title": "중복 카테고리", "description": "설명"}

    first = admin_client.post(
        "/api/v2/admin/character-categories",
        json=payload,
        headers=admin_headers(admin_client),
    )
    second = admin_client.post(
        "/api/v2/admin/character-categories",
        json=payload,
        headers=admin_headers(admin_client),
    )

    assert first.status_code == 201
    assert second.status_code == 409


def test_update_character_category(admin_client, db_session):
    category = get_category(db_session, "예술 / 문학")
    assert category is not None

    response = admin_client.patch(
        f"/api/v2/admin/character-categories/{category.id}",
        json={"title": "예술 / 문학 (수정)", "description": "수정된 설명", "is_active": False},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "예술 / 문학 (수정)"
    assert data["description"] == "수정된 설명"
    assert data["is_active"] is False


def test_update_character_category_rejects_sort_order(admin_client, db_session):
    category = get_category(db_session, "예술 / 문학")
    assert category is not None
    original_sort_order = category.sort_order

    response = admin_client.patch(
        f"/api/v2/admin/character-categories/{category.id}",
        json={"sort_order": 99},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 422
    db_session.refresh(category)
    assert category.sort_order == original_sort_order


def test_delete_character_category_soft(admin_client, db_session):
    create_response = admin_client.post(
        "/api/v2/admin/character-categories",
        json={"title": "삭제 카테고리", "description": "삭제 대상"},
        headers=admin_headers(admin_client),
    )
    category_id = create_response.json()["id"]

    delete_response = admin_client.delete(
        f"/api/v2/admin/character-categories/{category_id}",
        headers=admin_headers(admin_client),
    )

    assert delete_response.status_code == 200
    assert delete_response.json()["deleted_at"] is not None

    list_response = admin_client.get("/api/v2/admin/character-categories", headers=admin_headers(admin_client))
    assert category_id not in [item["id"] for item in list_response.json()["items"]]


def test_reorder_character_categories(admin_client, db_session):
    list_response = admin_client.get(
        "/api/v2/admin/character-categories?page_size=100",
        headers=admin_headers(admin_client),
    )
    assert list_response.status_code == 200, list_response.text
    categories = list_response.json()["items"]
    first = categories[0]
    second = categories[1]

    response = admin_client.patch(
        "/api/v2/admin/character-categories/reorder",
        json={"ids": [second["id"], first["id"]]},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    reordered = {item["id"]: item["sort_order"] for item in response.json()}
    assert reordered[first["id"]] == 1
    assert reordered[second["id"]] == 0


def test_inactive_category_hidden_from_public_list(client, db_session):
    category = get_category(db_session, "사상 / 학문")
    category.is_active = False
    db_session.flush()

    response = client.get("/api/v2/character-categories")
    titles = [item["title"] for item in response.json()]
    assert "사상 / 학문" not in titles


def test_partner_cannot_access_content_admin(client, partner_user, jwt_env):
    from tests.admin_auth_helpers import PARTNER_PASSWORD, PARTNER_USERNAME, login_headers

    response = client.get(
        "/api/v2/admin/character-categories",
        headers=login_headers(client, PARTNER_USERNAME, PARTNER_PASSWORD),
    )

    assert response.status_code == 403
