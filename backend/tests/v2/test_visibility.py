"""is_active / soft delete 노출 규칙 테스트."""

from datetime import datetime, timezone

from tests.helpers import get_character, get_ending, get_scenario


def test_inactive_character_hidden_from_list(client, db_session):
    character = get_character(db_session, "이순신")
    character.is_active = False
    db_session.flush()

    response = client.get("/api/v2/characters")
    names = [item["name"] for item in response.json()]
    assert "이순신" not in names


def test_inactive_character_returns_404_on_detail(client, db_session):
    character = get_character(db_session, "이순신")
    character.is_active = False
    db_session.flush()

    response = client.get("/api/v2/characters/이순신")
    assert response.status_code == 404


def test_soft_deleted_character_hidden(client, db_session):
    character = get_character(db_session, "이순신")
    character.deleted_at = datetime.now(timezone.utc)
    db_session.flush()

    list_response = client.get("/api/v2/characters")
    detail_response = client.get("/api/v2/characters/이순신")

    assert "이순신" not in [item["name"] for item in list_response.json()]
    assert detail_response.status_code == 404


def test_inactive_scenario_excluded_from_detail(client, db_session):
    scenario = get_scenario(db_session, "이순신", 1)
    scenario.is_active = False
    db_session.flush()

    response = client.get("/api/v2/characters/이순신")
    assert response.status_code == 200
    scenario_ids = [item["scenario_id"] for item in response.json()["scenarios"]]
    assert 1 not in scenario_ids


def test_inactive_scenario_cannot_start(client, db_session):
    scenario = get_scenario(db_session, "이순신", 1)
    scenario.is_active = False
    db_session.flush()

    response = client.post(
        "/api/v2/simulation/start",
        json={"character_name": "이순신", "scenario_id": 1},
    )
    assert response.status_code == 404


def test_soft_deleted_ending_returns_404(client, db_session):
    ending = get_ending(db_session, "이순신", 1, "A-A-A")
    ending.deleted_at = datetime.now(timezone.utc)
    db_session.flush()

    response = client.post(
        "/api/v2/simulation/ending",
        json={
            "character_name": "이순신",
            "scenario_id": 1,
            "choices_path": ["A", "A", "A"],
        },
    )
    assert response.status_code == 404
