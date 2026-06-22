from tests.helpers import get_character, get_category


def test_list_characters(client):
    response = client.get("/api/v2/characters")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["id"] is not None
    assert data[0]["scenarios"] == []
    assert data[0]["associated_stories"] == {}


def test_list_characters_with_unknown_category_id(client):
    response = client.get("/api/v2/characters", params={"category_id": 999999})
    assert response.status_code == 200
    assert response.json() == []


def test_list_characters_with_valid_category_filter(client, db_session):
    character = get_character(db_session, "이순신")
    assert character is not None

    response = client.get("/api/v2/characters", params={"category_id": character.category_id})
    assert response.status_code == 200
    names = [item["name"] for item in response.json()]
    assert "이순신" in names
    assert all(item["category"] == character.category for item in response.json())


def test_list_characters_without_category_returns_all(client):
    all_response = client.get("/api/v2/characters")
    filtered_response = client.get(
        "/api/v2/characters",
        params={"category_id": get_category_id(client, "정치 / 외교")},
    )

    assert all_response.status_code == 200
    assert filtered_response.status_code == 200
    assert len(filtered_response.json()) < len(all_response.json())


def get_category_id(client, title: str) -> int:
    categories = client.get("/api/v2/character-categories").json()
    return next(item["id"] for item in categories if item["title"] == title)


def test_get_character_detail(client, db_session):
    character = get_character(db_session, "이순신")
    assert character is not None

    response = client.get(f"/api/v2/characters/{character.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == character.id
    assert data["name"] == "이순신"
    assert len(data["scenarios"]) >= 1
    assert len(data["stats"]) >= 1
    assert data["mbti_details"]["E_I"]


def test_get_character_not_found(client):
    response = client.get("/api/v2/characters/999999")
    assert response.status_code == 404
