import pytest
from sqlalchemy import func, select

from db.models import Turn
from tests.helpers import get_character, get_character_stat, get_scenario

ADMIN_TOKEN = "test-admin-token"
TURNS_URL = "/api/v2/admin/turns"


@pytest.fixture
def admin_client(client, monkeypatch):
    monkeypatch.setenv("ADMIN_TOKEN", ADMIN_TOKEN)
    return client


def admin_headers():
    return {"Authorization": f"Bearer {ADMIN_TOKEN}"}


def sample_turn_payload(db_session, scenario_id: int, character_name: str = "이순신"):
    stat = get_character_stat(db_session, character_name, "전술력")
    if not stat:
        stat = get_character_stat(db_session, character_name, "국력")
    assert stat is not None
    stat_id = stat.id
    return {
        "scenario_id": scenario_id,
        "title": "신규 턴",
        "situation": "상황 설명",
        "tip_title": "팁 질문",
        "tip_desc": "팁 답변",
        "choices": {
            "A": {
                "title": "역사 선택",
                "description": "A 설명",
                "result_text": "A 결과",
                "is_historical": True,
                "turn_stats": [{"stat_id": stat_id, "delta": 5}],
            },
            "B": {
                "title": "가상 선택",
                "description": "B 설명",
                "result_text": "B 결과",
                "is_historical": False,
                "turn_stats": [{"stat_id": stat_id, "delta": -3}],
            },
        },
    }


def test_list_turns_admin_all(admin_client):
    response = admin_client.get(TURNS_URL, headers=admin_headers())

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 66
    assert "choices" in data[0]
    assert "A" in data[0]["choices"]


def test_list_turns_filter_by_scenario(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 1)
    assert scenario is not None

    response = admin_client.get(
        f"{TURNS_URL}?scenario_id={scenario.id}",
        headers=admin_headers(),
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    assert all(item["scenario_id"] == scenario.id for item in data)


def test_list_turns_scenario_not_found(admin_client):
    response = admin_client.get(f"{TURNS_URL}?scenario_id=99999", headers=admin_headers())
    assert response.status_code == 404


def test_create_turn(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 1)
    assert scenario is not None
    current_max = db_session.scalar(
        select(func.max(Turn.sort_order)).where(
            Turn.scenario_id == scenario.id,
            Turn.deleted_at.is_(None),
        )
    )
    expected_sort_order = 0 if current_max is None else current_max + 1

    response = admin_client.post(
        TURNS_URL,
        json=sample_turn_payload(db_session, scenario.id),
        headers=admin_headers(),
    )

    assert response.status_code == 201
    data = response.json()
    assert data["scenario_id"] == scenario.id
    assert data["sort_order"] == expected_sort_order
    assert data["title"] == "신규 턴"


def test_create_turn_rejects_sort_order(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 1)
    assert scenario is not None
    payload = sample_turn_payload(db_session, scenario.id)
    payload["sort_order"] = 0

    response = admin_client.post(TURNS_URL, json=payload, headers=admin_headers())
    assert response.status_code == 422


def test_create_turn_requires_choices(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 1)
    assert scenario is not None

    response = admin_client.post(
        TURNS_URL,
        json={
            "scenario_id": scenario.id,
            "title": "선택지 없음",
            "situation": "상황",
            "tip_title": "팁",
            "tip_desc": "답",
        },
        headers=admin_headers(),
    )

    assert response.status_code == 422


def test_create_turn_unknown_stat(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 1)
    assert scenario is not None
    payload = sample_turn_payload(db_session, scenario.id)
    payload["choices"]["A"]["turn_stats"] = [{"stat_id": 99999, "delta": 1}]

    response = admin_client.post(TURNS_URL, json=payload, headers=admin_headers())
    assert response.status_code == 404


def test_get_turn(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 1)
    assert scenario is not None
    turn = db_session.scalar(
        select(Turn).where(
            Turn.scenario_id == scenario.id,
            Turn.deleted_at.is_(None),
        )
    )
    assert turn is not None

    response = admin_client.get(f"{TURNS_URL}/{turn.id}", headers=admin_headers())

    assert response.status_code == 200
    assert response.json()["id"] == turn.id


def test_get_turn_not_found(admin_client):
    response = admin_client.get(f"{TURNS_URL}/99999", headers=admin_headers())
    assert response.status_code == 404


def test_update_turn(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 1)
    assert scenario is not None

    create_response = admin_client.post(
        TURNS_URL,
        json=sample_turn_payload(db_session, scenario.id),
        headers=admin_headers(),
    )
    turn_id = create_response.json()["id"]

    response = admin_client.patch(
        f"{TURNS_URL}/{turn_id}",
        json={"title": "수정된 턴"},
        headers=admin_headers(),
    )

    assert response.status_code == 200
    assert response.json()["title"] == "수정된 턴"


def test_update_turn_choices_sync(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 1)
    assert scenario is not None
    stat = get_character_stat(db_session, "이순신", "전술력")
    assert stat is not None

    create_response = admin_client.post(
        TURNS_URL,
        json=sample_turn_payload(db_session, scenario.id),
        headers=admin_headers(),
    )
    turn_id = create_response.json()["id"]
    choice_a_id = create_response.json()["choices"]["A"]["id"]

    response = admin_client.patch(
        f"{TURNS_URL}/{turn_id}",
        json={
            "choices": {
                "A": {
                    "title": "수정 A",
                    "description": "수정 설명",
                    "result_text": "수정 결과",
                    "is_historical": False,
                    "turn_stats": [{"stat_id": stat.id, "delta": 10}],
                },
                "B": {
                    "title": "수정 B",
                    "description": "B 설명",
                    "result_text": "B 결과",
                    "is_historical": True,
                    "turn_stats": [],
                },
            }
        },
        headers=admin_headers(),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["choices"]["A"]["id"] == choice_a_id
    assert data["choices"]["A"]["title"] == "수정 A"


def test_update_turn_rejects_sort_order(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 1)
    assert scenario is not None
    turn = db_session.scalar(
        select(Turn).where(
            Turn.scenario_id == scenario.id,
            Turn.deleted_at.is_(None),
        )
    )
    assert turn is not None

    response = admin_client.patch(
        f"{TURNS_URL}/{turn.id}",
        json={"sort_order": 99},
        headers=admin_headers(),
    )

    assert response.status_code == 422


def test_delete_turn_soft(admin_client, db_session):
    scenario = get_scenario(db_session, "이순신", 1)
    assert scenario is not None

    create_response = admin_client.post(
        TURNS_URL,
        json=sample_turn_payload(db_session, scenario.id),
        headers=admin_headers(),
    )
    turn_id = create_response.json()["id"]

    delete_response = admin_client.delete(f"{TURNS_URL}/{turn_id}", headers=admin_headers())

    assert delete_response.status_code == 200
    assert delete_response.json()["deleted_at"] is not None

    list_response = admin_client.get(
        f"{TURNS_URL}?scenario_id={scenario.id}",
        headers=admin_headers(),
    )
    assert turn_id not in [item["id"] for item in list_response.json()]


def test_reorder_turns(admin_client, db_session):
    character = get_character(db_session, "이순신")
    assert character is not None

    scenario_response = admin_client.post(
        "/api/v2/admin/scenarios",
        json={
            "character_id": character.id,
            "title": "reorder 테스트",
            "description": "설명",
            "historical_facts": "역사",
        },
        headers=admin_headers(),
    )
    scenario_id = scenario_response.json()["id"]

    first = admin_client.post(
        TURNS_URL,
        json={**sample_turn_payload(db_session, scenario_id), "title": "첫 번째"},
        headers=admin_headers(),
    ).json()
    second = admin_client.post(
        TURNS_URL,
        json={**sample_turn_payload(db_session, scenario_id), "title": "두 번째"},
        headers=admin_headers(),
    ).json()

    response = admin_client.patch(
        f"{TURNS_URL}/reorder",
        json={"scenario_id": scenario_id, "ids": [second["id"], first["id"]]},
        headers=admin_headers(),
    )

    assert response.status_code == 200
    reordered = {item["id"]: item["sort_order"] for item in response.json()}
    assert reordered[first["id"]] == 1
    assert reordered[second["id"]] == 0


def test_deleted_turn_hidden_from_public_detail(client, db_session, admin_client):
    scenario = get_scenario(db_session, "이순신", 1)
    character = get_character(db_session, "이순신")
    assert scenario is not None
    assert character is not None

    turn_count_before = len(
        client.get(f"/api/v2/characters/{character.id}").json()["scenarios"][0]["turns"]
    )

    create_response = admin_client.post(
        TURNS_URL,
        json=sample_turn_payload(db_session, scenario.id),
        headers=admin_headers(),
    )
    turn_id = create_response.json()["id"]

    admin_client.delete(f"{TURNS_URL}/{turn_id}", headers=admin_headers())

    assert len(
        client.get(f"/api/v2/characters/{character.id}").json()["scenarios"][0]["turns"]
    ) == turn_count_before
