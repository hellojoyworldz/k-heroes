import pytest
from sqlalchemy import select

from db.models import PlaySession
from tests.helpers import get_scenario


@pytest.fixture
def yi_scenario_id(db_session):
    scenario = get_scenario(db_session, "이순신", 0)
    assert scenario is not None
    return scenario.id


def test_start_simulation(client, yi_scenario_id):
    response = client.post(
        "/api/v2/simulation/start",
        json={"character_name": "이순신", "scenario_id": yi_scenario_id},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["initial_state"]["character_name"] == "이순신"
    assert data["initial_state"]["scenario_id"] == yi_scenario_id
    assert data["initial_state"]["current_step"] == 1
    assert len(data["character_card"]["scenarios"]) == 1
    assert len(data["initial_state"]["game_stats"]) == len(data["character_card"]["stats"])


def test_start_simulation_character_not_found(client, yi_scenario_id):
    response = client.post(
        "/api/v2/simulation/start",
        json={"character_name": "없는인물", "scenario_id": yi_scenario_id},
    )
    assert response.status_code == 404


def test_start_simulation_scenario_not_found(client):
    response = client.post(
        "/api/v2/simulation/start",
        json={"character_name": "이순신", "scenario_id": 9999},
    )
    assert response.status_code == 404


def test_play_turn(client, yi_scenario_id):
    response = client.post(
        "/api/v2/simulation/turn",
        json={"character_name": "이순신", "scenario_id": yi_scenario_id, "current_step": 1},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["current_step"] == 1
    assert data["total_steps"] >= 1
    assert data["choice_a"]["title"]
    assert data["choice_b"]["title"]
    assert data["toggle_question"]
    assert isinstance(data["choice_a"]["stat_effects"], dict)


def test_play_turn_character_not_found(client, yi_scenario_id):
    response = client.post(
        "/api/v2/simulation/turn",
        json={"character_name": "없는인물", "scenario_id": yi_scenario_id, "current_step": 1},
    )
    assert response.status_code == 404


def test_play_turn_scenario_not_found(client):
    response = client.post(
        "/api/v2/simulation/turn",
        json={"character_name": "이순신", "scenario_id": 9999, "current_step": 1},
    )
    assert response.status_code == 404


def test_play_turn_invalid_step(client, yi_scenario_id):
    response = client.post(
        "/api/v2/simulation/turn",
        json={"character_name": "이순신", "scenario_id": yi_scenario_id, "current_step": 99},
    )
    assert response.status_code == 400


def test_generate_ending_and_get_result(client, db_session, yi_scenario_id):
    ending_response = client.post(
        "/api/v2/simulation/ending",
        json={
            "character_name": "이순신",
            "scenario_id": yi_scenario_id,
            "choices_path": ["A", "A", "A"],
        },
    )
    assert ending_response.status_code == 200
    ending_data = ending_response.json()
    assert ending_data["result_code"] == "A-A-A"
    assert ending_data["title"]
    assert ending_data["summary_items"]
    assert ending_data["uuid"]

    session = db_session.scalar(select(PlaySession).where(PlaySession.id == ending_data["uuid"]))
    assert session is not None
    assert session.character_name == "이순신"
    assert session.choices_path == ["A", "A", "A"]
    assert session.ending_id is not None

    result_response = client.get(f"/api/v2/simulation/result/{ending_data['uuid']}")
    assert result_response.status_code == 200
    result_data = result_response.json()
    assert result_data["uuid"] == ending_data["uuid"]
    assert result_data["title"] == ending_data["title"]
    assert result_data["ending_markdown"]


def test_generate_ending_not_found(client, yi_scenario_id):
    response = client.post(
        "/api/v2/simulation/ending",
        json={
            "character_name": "이순신",
            "scenario_id": yi_scenario_id,
            "choices_path": ["Z", "Z", "Z"],
        },
    )
    assert response.status_code == 404


def test_get_result_not_found(client):
    response = client.get("/api/v2/simulation/result/not-a-real-uuid")
    assert response.status_code == 404


def test_full_play_flow(client, yi_scenario_id):
    start = client.post(
        "/api/v2/simulation/start",
        json={"character_name": "이순신", "scenario_id": yi_scenario_id},
    )
    total_steps = len(start.json()["character_card"]["scenarios"][0]["turns"])

    for step in range(1, total_steps + 1):
        turn = client.post(
            "/api/v2/simulation/turn",
            json={
                "character_name": "이순신",
                "scenario_id": yi_scenario_id,
                "current_step": step,
            },
        )
        assert turn.status_code == 200
        assert turn.json()["total_steps"] == total_steps

    ending = client.post(
        "/api/v2/simulation/ending",
        json={
            "character_name": "이순신",
            "scenario_id": yi_scenario_id,
            "choices_path": ["A"] * total_steps,
        },
    )
    assert ending.status_code == 200
