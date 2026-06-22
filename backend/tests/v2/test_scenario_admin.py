import pytest
from sqlalchemy import func, select

from db.models import Scenario
from tests.admin_auth_helpers import admin_headers
from tests.helpers import get_character, get_scenario

SCENARIOS_URL = "/api/v2/admin/scenarios"


def test_list_scenarios_admin(admin_client):
    response = admin_client.get(SCENARIOS_URL, headers=admin_headers(admin_client))

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) >= 1
    assert "character" in data["items"][0]
    assert data["items"][0]["character"]["name"]
    assert "category" in data["items"][0]["character"]
    assert data["items"][0]["character"]["category"]["title"]
    assert data["page"] == 1
    assert data["page_size"] == 20
    assert data["total"] >= 1


def test_list_scenarios_filter_by_character_id(admin_client, db_session):
    character = get_character(db_session, "이순신")
    assert character is not None

    response = admin_client.get(
        f"{SCENARIOS_URL}?character_id={character.id}",
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    data = response.json()["items"]
    assert len(data) >= 1
    assert all(item["character_id"] == character.id for item in data)

    other_response = admin_client.get(
        f"{SCENARIOS_URL}?character_id=99999",
        headers=admin_headers(admin_client),
    )
    assert other_response.json()["items"] == []


def test_list_scenarios_filter_is_active(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 0)
    assert scenario is not None
    scenario.is_active = False
    db_session.flush()

    active_response = admin_client.get(
        f"{SCENARIOS_URL}?character_id={scenario.character_id}&is_active=true",
        headers=admin_headers(admin_client),
    )
    inactive_response = admin_client.get(
        f"{SCENARIOS_URL}?character_id={scenario.character_id}&is_active=false",
        headers=admin_headers(admin_client),
    )

    assert scenario.id not in [item["id"] for item in active_response.json()["items"]]
    assert scenario.id in [item["id"] for item in inactive_response.json()["items"]]


def test_list_scenarios_admin_rejects_invalid_page_size(admin_client):
    response = admin_client.get(
        f"{SCENARIOS_URL}?page_size=30",
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 422


def test_create_scenario(admin_client, db_session):
    character = get_character(db_session, "이순신")
    assert character is not None
    current_max = db_session.scalar(
        select(func.max(Scenario.sort_order)).where(Scenario.character_id == character.id)
    )
    expected_sort_order = (current_max or -1) + 1

    response = admin_client.post(
        SCENARIOS_URL,
        json={
            "character_id": character.id,
            "title": "신규 시나리오",
            "description": "설명",
            "historical_facts": "역사적 사실",
            "source_story_ids": [1, 2],
        },
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 201
    data = response.json()
    assert data["character_id"] == character.id
    assert data["sort_order"] == expected_sort_order
    assert data["title"] == "신규 시나리오"
    assert data["source_story_ids"] == [1, 2]
    assert data["is_active"] is True


def test_create_scenario_rejects_sort_order(admin_client, db_session):
    character = get_character(db_session, "이순신")
    assert character is not None

    response = admin_client.post(
        SCENARIOS_URL,
        json={
            "character_id": character.id,
            "title": "순서 지정 시도",
            "description": "설명",
            "historical_facts": "역사적 사실",
            "sort_order": 0,
        },
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 422


def test_create_scenario_character_not_found(admin_client):
    response = admin_client.post(
        SCENARIOS_URL,
        json={
            "character_id": 99999,
            "title": "시나리오",
            "description": "설명",
            "historical_facts": "역사적 사실",
        },
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 404


def test_get_scenario(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 0)
    assert scenario is not None

    response = admin_client.get(
        f"{SCENARIOS_URL}/{scenario.id}",
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    assert response.json()["id"] == scenario.id
    assert response.json()["character"]["name"] == "이순신"
    assert "scenario_id" not in response.json()


def test_get_scenario_not_found(admin_client):
    response = admin_client.get(f"{SCENARIOS_URL}/99999", headers=admin_headers(admin_client))
    assert response.status_code == 404


def test_update_scenario(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 0)
    assert scenario is not None

    response = admin_client.patch(
        f"{SCENARIOS_URL}/{scenario.id}",
        json={"title": "수정된 제목", "is_active": False},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "수정된 제목"
    assert data["is_active"] is False


def test_update_scenario_character_id(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 0)
    other_character = get_character(db_session, "고종")
    assert scenario is not None
    assert other_character is not None

    current_max = db_session.scalar(
        select(func.max(Scenario.sort_order)).where(Scenario.character_id == other_character.id)
    )
    expected_sort_order = (current_max or -1) + 1

    response = admin_client.patch(
        f"{SCENARIOS_URL}/{scenario.id}",
        json={"character_id": other_character.id},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["character_id"] == other_character.id
    assert data["character"]["name"] == "고종"
    assert data["sort_order"] == expected_sort_order


def test_update_scenario_rejects_sort_order(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 0)
    assert scenario is not None
    original_sort_order = scenario.sort_order

    response = admin_client.patch(
        f"{SCENARIOS_URL}/{scenario.id}",
        json={"sort_order": 99},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 422
    db_session.refresh(scenario)
    assert scenario.sort_order == original_sort_order


def test_delete_scenario_soft(admin_client, db_session):
    character = get_character(db_session, "이순신")
    assert character is not None

    create_response = admin_client.post(
        SCENARIOS_URL,
        json={
            "character_id": character.id,
            "title": "삭제 대상",
            "description": "설명",
            "historical_facts": "역사적 사실",
        },
        headers=admin_headers(admin_client),
    )
    scenario_db_id = create_response.json()["id"]

    delete_response = admin_client.delete(
        f"{SCENARIOS_URL}/{scenario_db_id}",
        headers=admin_headers(admin_client),
    )

    assert delete_response.status_code == 200
    assert delete_response.json()["deleted_at"] is not None

    list_response = admin_client.get(
        f"{SCENARIOS_URL}?character_id={character.id}",
        headers=admin_headers(admin_client),
    )
    assert scenario_db_id not in [item["id"] for item in list_response.json()["items"]]


def test_reorder_scenarios(admin_client, db_session):
    character = get_character(db_session, "이순신")
    assert character is not None

    scenarios = admin_client.get(
        f"{SCENARIOS_URL}?character_id={character.id}",
        headers=admin_headers(admin_client),
    ).json()["items"]
    if len(scenarios) < 2:
        pytest.skip("이순신 시나리오가 2개 이상 필요합니다")

    first = scenarios[0]
    second = scenarios[1]

    response = admin_client.patch(
        f"{SCENARIOS_URL}/reorder",
        json={"character_id": character.id, "ids": [second["id"], first["id"]]},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    reordered = {item["id"]: item["sort_order"] for item in response.json()}
    assert reordered[first["id"]] == 1
    assert reordered[second["id"]] == 0


def test_inactive_scenario_hidden_from_public_detail(client, db_session):
    character = get_character(db_session, "이순신")
    scenario = get_scenario(db_session, "이순신", 0)
    assert character is not None
    assert scenario is not None
    scenario.is_active = False
    db_session.flush()

    response = client.get(f"/api/v2/characters/{character.id}")
    scenario_ids = [item["id"] for item in response.json()["scenarios"]]
    assert scenario.id not in scenario_ids
