import pytest

from tests.admin_auth_helpers import admin_headers
from tests.helpers import get_character, get_ending, get_scenario

ENDINGS_URL = "/api/v2/admin/endings"


def sample_ending_payload(scenario_id: int, path_key: str = "A-A-A"):
    return {
        "scenario_id": scenario_id,
        "path_key": path_key,
        "ending_type": "True Ending",
        "title": "신규 엔딩",
        "history_fact": "역사적 사실",
        "story_headline": "헤드라인",
        "story_contents": "스토리 본문",
        "factual_contents": "사실 본문",
        "summary_items": [{"title": "교훈", "desc": "설명"}],
        "recommended_places": [
            {
                "address": "서울",
                "name": "추천 장소",
                "description": "설명",
                "link": "https://example.com",
                "image_url": "",
            }
        ],
    }


def test_list_endings_all(admin_client):
    response = admin_client.get(ENDINGS_URL, headers=admin_headers(admin_client))

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) >= 1
    assert data["total"] >= 176
    assert data["page"] == 1
    assert data["page_size"] == 20
    assert "path_key" in data["items"][0]
    assert "sort_order" in data["items"][0]
    assert "is_active" in data["items"][0]
    assert data["items"][0]["character"]["name"]
    assert data["items"][0]["character"]["category"]["title"]
    assert data["items"][0]["scenario"]["title"]


def test_list_endings_filter_by_scenario(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 0)
    assert scenario is not None

    response = admin_client.get(
        f"{ENDINGS_URL}?scenario_id={scenario.id}",
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    data = response.json()["items"]
    assert len(data) == 8
    assert all(item["scenario_id"] == scenario.id for item in data)


def test_list_endings_filter_by_character(admin_client, db_session):
    character = get_character(db_session, "이순신")
    assert character is not None

    response = admin_client.get(
        f"{ENDINGS_URL}?character_id={character.id}",
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    data = response.json()["items"]
    assert len(data) >= 1
    assert all(item["character"]["id"] == character.id for item in data)


def test_list_endings_filter_by_active(admin_client):
    response = admin_client.get(
        f"{ENDINGS_URL}?is_active=true",
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    assert all(item["is_active"] is True for item in response.json()["items"])


def test_list_endings_invalid_page_size(admin_client):
    response = admin_client.get(
        f"{ENDINGS_URL}?page_size=15",
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 422
    assert "페이지당 항목 수" in response.json()["detail"]


def test_list_endings_scenario_not_found(admin_client):
    response = admin_client.get(f"{ENDINGS_URL}?scenario_id=99999", headers=admin_headers(admin_client))
    assert response.status_code == 404
    assert "시나리오를 찾을 수 없습니다" in response.json()["detail"]


def test_create_ending(admin_client, db_session):
    character = get_character(db_session, "이순신")
    assert character is not None

    scenario = admin_client.post(
        "/api/v2/admin/scenarios",
        json={
            "character_id": character.id,
            "title": "엔딩 테스트",
            "description": "설명",
            "historical_facts": "역사",
        },
        headers=admin_headers(admin_client),
    ).json()

    response = admin_client.post(
        ENDINGS_URL,
        json=sample_ending_payload(scenario["id"], "A-B-A"),
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 201
    data = response.json()
    assert data["scenario_id"] == scenario["id"]
    assert data["path_key"] == "A-B-A"
    assert data["title"] == "신규 엔딩"
    assert data["sort_order"] >= 0
    assert data["is_active"] is True
    assert len(data["summary_items"]) == 1
    assert data["recommended_places"][0]["link"] == "https://example.com"


def test_create_ending_rejects_sort_order(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 0)
    assert scenario is not None

    payload = sample_ending_payload(scenario.id, "Z-Z-Z")
    payload["sort_order"] = 0

    response = admin_client.post(
        ENDINGS_URL,
        json=payload,
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 422


def test_create_ending_duplicate_path_key(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 0)
    assert scenario is not None

    response = admin_client.post(
        ENDINGS_URL,
        json=sample_ending_payload(scenario.id, "A-A-A"),
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 409
    assert "동일한 경로" in response.json()["detail"]


def test_get_ending(admin_client, db_session):
    ending = get_ending(db_session, "이순신", 1, "A-A-A")
    assert ending is not None

    response = admin_client.get(f"{ENDINGS_URL}/{ending.id}", headers=admin_headers(admin_client))

    assert response.status_code == 200
    assert response.json()["path_key"] == "A-A-A"


def test_get_ending_not_found(admin_client):
    response = admin_client.get(f"{ENDINGS_URL}/99999", headers=admin_headers(admin_client))
    assert response.status_code == 404
    assert "엔딩을 찾을 수 없습니다" in response.json()["detail"]


def test_update_ending(admin_client, db_session):
    character = get_character(db_session, "이순신")
    assert character is not None

    scenario = admin_client.post(
        "/api/v2/admin/scenarios",
        json={
            "character_id": character.id,
            "title": "엔딩 수정 테스트",
            "description": "설명",
            "historical_facts": "역사",
        },
        headers=admin_headers(admin_client),
    ).json()

    create_response = admin_client.post(
        ENDINGS_URL,
        json=sample_ending_payload(scenario["id"], "B-B-B"),
        headers=admin_headers(admin_client),
    )
    ending_id = create_response.json()["id"]

    response = admin_client.patch(
        f"{ENDINGS_URL}/{ending_id}",
        json={"title": "수정된 엔딩", "is_active": False},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "수정된 엔딩"
    assert data["is_active"] is False


def test_update_ending_changes_scenario(admin_client, db_session):
    character = get_character(db_session, "이순신")
    assert character is not None

    source_scenario = admin_client.post(
        "/api/v2/admin/scenarios",
        json={
            "character_id": character.id,
            "title": "엔딩 이동 원본 시나리오",
            "description": "설명",
            "historical_facts": "역사",
        },
        headers=admin_headers(admin_client),
    ).json()

    target_scenario = admin_client.post(
        "/api/v2/admin/scenarios",
        json={
            "character_id": character.id,
            "title": "엔딩 이동 대상 시나리오",
            "description": "설명",
            "historical_facts": "역사",
        },
        headers=admin_headers(admin_client),
    ).json()

    create_response = admin_client.post(
        ENDINGS_URL,
        json=sample_ending_payload(source_scenario["id"], "C-C-C"),
        headers=admin_headers(admin_client),
    )
    ending_id = create_response.json()["id"]

    response = admin_client.patch(
        f"{ENDINGS_URL}/{ending_id}",
        json={"scenario_id": target_scenario["id"]},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["scenario_id"] == target_scenario["id"]
    assert data["path_key"] == "C-C-C"

    list_response = admin_client.get(
        f"{ENDINGS_URL}?scenario_id={target_scenario['id']}",
        headers=admin_headers(admin_client),
    )
    assert ending_id in [item["id"] for item in list_response.json()["items"]]


def test_update_ending_duplicate_path_key(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 0)
    ending = get_ending(db_session, "이순신", 1, "A-A-B")
    assert scenario is not None
    assert ending is not None

    response = admin_client.patch(
        f"{ENDINGS_URL}/{ending.id}",
        json={"path_key": "A-A-A"},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 409
    assert "동일한 경로" in response.json()["detail"]


def test_delete_ending_soft(admin_client, db_session):
    character = get_character(db_session, "이순신")
    assert character is not None

    scenario = admin_client.post(
        "/api/v2/admin/scenarios",
        json={
            "character_id": character.id,
            "title": "엔딩 삭제 테스트",
            "description": "설명",
            "historical_facts": "역사",
        },
        headers=admin_headers(admin_client),
    ).json()

    create_response = admin_client.post(
        ENDINGS_URL,
        json=sample_ending_payload(scenario["id"], "A-A-C"),
        headers=admin_headers(admin_client),
    )
    ending_id = create_response.json()["id"]

    delete_response = admin_client.delete(f"{ENDINGS_URL}/{ending_id}", headers=admin_headers(admin_client))

    assert delete_response.status_code == 200
    assert delete_response.json()["deleted_at"] is not None

    list_response = admin_client.get(
        f"{ENDINGS_URL}?scenario_id={scenario['id']}",
        headers=admin_headers(admin_client),
    )
    assert ending_id not in [item["id"] for item in list_response.json()["items"]]


def test_reorder_endings(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 0)
    assert scenario is not None

    endings = admin_client.get(
        f"{ENDINGS_URL}?scenario_id={scenario.id}&page_size=100",
        headers=admin_headers(admin_client),
    ).json()["items"]
    assert len(endings) >= 2

    reversed_ids = [ending["id"] for ending in reversed(endings)]
    response = admin_client.patch(
        f"{ENDINGS_URL}/reorder",
        json={"scenario_id": scenario.id, "ids": reversed_ids},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    reordered = {item["id"]: item["sort_order"] for item in response.json()}
    for index, ending_id in enumerate(reversed_ids):
        assert reordered[ending_id] == index


def test_created_ending_used_by_simulation(admin_client, client, db_session):
    character = get_character(db_session, "이순신")
    assert character is not None

    scenario = admin_client.post(
        "/api/v2/admin/scenarios",
        json={
            "character_id": character.id,
            "title": "플레이 연동 테스트",
            "description": "설명",
            "historical_facts": "역사",
        },
        headers=admin_headers(admin_client),
    ).json()

    admin_client.post(
        ENDINGS_URL,
        json=sample_ending_payload(scenario["id"], "A-A-A"),
        headers=admin_headers(admin_client),
    )

    response = client.post(
        "/api/v2/simulation/ending",
        json={
            "character_name": "이순신",
            "scenario_id": scenario["id"],
            "choices_path": ["A", "A", "A"],
        },
    )

    assert response.status_code == 200
    assert response.json()["title"] == "신규 엔딩"
