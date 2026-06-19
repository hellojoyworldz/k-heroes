from tests.helpers import get_character


def test_list_characters(client):
    response = client.get("/api/v2/characters")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["scenarios"] == []
    assert data[0]["associated_stories"] == {}


def test_list_characters_with_empty_category_filter(client):
    response = client.get("/api/v2/characters", params={"category": "없는카테고리"})
    assert response.status_code == 200
    assert response.json() == []


def test_list_characters_with_valid_category_filter(client, db_session):
    character = get_character(db_session, "이순신")
    assert character is not None

    response = client.get("/api/v2/characters", params={"category": character.category})
    assert response.status_code == 200
    names = [item["name"] for item in response.json()]
    assert "이순신" in names
    assert all(item["category"] == character.category for item in response.json())


def test_list_characters_all_category_alias(client):
    all_response = client.get("/api/v2/characters")
    ko_response = client.get("/api/v2/characters", params={"category": "전체"})
    en_response = client.get("/api/v2/characters", params={"category": "all"})

    assert ko_response.status_code == 200
    assert en_response.status_code == 200
    assert len(ko_response.json()) == len(all_response.json())
    assert len(en_response.json()) == len(all_response.json())


def test_get_character_detail(client):
    response = client.get("/api/v2/characters/이순신")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "이순신"
    assert len(data["scenarios"]) >= 1
    assert len(data["stats"]) >= 1
    assert data["mbti_details"]["E_I"]


def test_get_character_not_found(client):
    response = client.get("/api/v2/characters/없는인물")
    assert response.status_code == 404
