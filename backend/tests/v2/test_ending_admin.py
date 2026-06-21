import pytest

from tests.helpers import get_character, get_ending, get_scenario

ADMIN_TOKEN = "test-admin-token"
ENDINGS_URL = "/api/v2/admin/endings"


@pytest.fixture
def admin_client(client, monkeypatch):
    monkeypatch.setenv("ADMIN_TOKEN", ADMIN_TOKEN)
    return client


def admin_headers():
    return {"Authorization": f"Bearer {ADMIN_TOKEN}"}


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
                "image_url": "",
            }
        ],
    }


def test_list_endings_all(admin_client):
    response = admin_client.get(ENDINGS_URL, headers=admin_headers())

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 176
    assert "path_key" in data[0]


def test_list_endings_filter_by_scenario(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 1)
    assert scenario is not None

    response = admin_client.get(
        f"{ENDINGS_URL}?scenario_id={scenario.id}",
        headers=admin_headers(),
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 8
    assert all(item["scenario_id"] == scenario.id for item in data)


def test_list_endings_scenario_not_found(admin_client):
    response = admin_client.get(f"{ENDINGS_URL}?scenario_id=99999", headers=admin_headers())
    assert response.status_code == 404


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
        headers=admin_headers(),
    ).json()

    response = admin_client.post(
        ENDINGS_URL,
        json=sample_ending_payload(scenario["id"], "A-B-A"),
        headers=admin_headers(),
    )

    assert response.status_code == 201
    data = response.json()
    assert data["scenario_id"] == scenario["id"]
    assert data["path_key"] == "A-B-A"
    assert data["title"] == "신규 엔딩"
    assert len(data["summary_items"]) == 1


def test_create_ending_duplicate_path_key(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 1)
    assert scenario is not None

    response = admin_client.post(
        ENDINGS_URL,
        json=sample_ending_payload(scenario.id, "A-A-A"),
        headers=admin_headers(),
    )

    assert response.status_code == 409


def test_get_ending(admin_client, db_session):
    ending = get_ending(db_session, "이순신", 1, "A-A-A")
    assert ending is not None

    response = admin_client.get(f"{ENDINGS_URL}/{ending.id}", headers=admin_headers())

    assert response.status_code == 200
    assert response.json()["path_key"] == "A-A-A"


def test_get_ending_not_found(admin_client):
    response = admin_client.get(f"{ENDINGS_URL}/99999", headers=admin_headers())
    assert response.status_code == 404


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
        headers=admin_headers(),
    ).json()

    create_response = admin_client.post(
        ENDINGS_URL,
        json=sample_ending_payload(scenario["id"], "B-B-B"),
        headers=admin_headers(),
    )
    ending_id = create_response.json()["id"]

    response = admin_client.patch(
        f"{ENDINGS_URL}/{ending_id}",
        json={"title": "수정된 엔딩"},
        headers=admin_headers(),
    )

    assert response.status_code == 200
    assert response.json()["title"] == "수정된 엔딩"


def test_update_ending_duplicate_path_key(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 1)
    ending = get_ending(db_session, "이순신", 1, "A-A-B")
    assert scenario is not None
    assert ending is not None

    response = admin_client.patch(
        f"{ENDINGS_URL}/{ending.id}",
        json={"path_key": "A-A-A"},
        headers=admin_headers(),
    )

    assert response.status_code == 409


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
        headers=admin_headers(),
    ).json()

    create_response = admin_client.post(
        ENDINGS_URL,
        json=sample_ending_payload(scenario["id"], "A-A-C"),
        headers=admin_headers(),
    )
    ending_id = create_response.json()["id"]

    delete_response = admin_client.delete(f"{ENDINGS_URL}/{ending_id}", headers=admin_headers())

    assert delete_response.status_code == 200
    assert delete_response.json()["deleted_at"] is not None

    list_response = admin_client.get(
        f"{ENDINGS_URL}?scenario_id={scenario['id']}",
        headers=admin_headers(),
    )
    assert ending_id not in [item["id"] for item in list_response.json()]


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
        headers=admin_headers(),
    ).json()

    admin_client.post(
        ENDINGS_URL,
        json=sample_ending_payload(scenario["id"], "A-A-A"),
        headers=admin_headers(),
    )

    response = client.post(
        "/api/v2/simulation/ending",
        json={
            "character_name": "이순신",
            "scenario_id": scenario["scenario_id"],
            "choices_path": ["A", "A", "A"],
        },
    )

    assert response.status_code == 200
    assert response.json()["title"] == "신규 엔딩"
