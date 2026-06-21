import pytest

from tests.admin_auth_helpers import admin_headers
from tests.helpers import get_category


def sample_character_payload(name: str = "테스트인물", category_id: int = 1) -> dict:
    return {
        "name": name,
        "category_id": category_id,
        "era": "조선 후기",
        "era_tag": "조선 후기",
        "role": "왕",
        "years": "1863-1907",
        "situation": "테스트 상황 설명입니다.",
        "one_line_summary": "한 줄 요약",
        "mbti": "INTJ",
        "mbti_nickname": "전략가",
        "mbti_e_i": "I 성향 설명",
        "mbti_s_n": "N 성향 설명",
        "mbti_t_f": "T 성향 설명",
        "mbti_j_p": "J 성향 설명",
        "intro_quote": "인용문",
        "intro_desc": "소개 설명",
        "image_url": "https://example.com/char.png",
        "keywords": ["테스트", "인물"],
    }


def test_create_character_success(admin_client, db_session):
    category = get_category(db_session, "정치 / 외교")
    payload = sample_character_payload("신규인물", category_id=category.id)

    response = admin_client.post("/api/v2/admin/characters", json=payload, headers=admin_headers(admin_client))

    assert response.status_code == 201
    data = response.json()
    assert data["id"] > 0
    assert data["name"] == "신규인물"
    assert data["category_id"] == category.id
    assert data["category"] == "정치 / 외교"
    assert data["keywords"] == ["테스트", "인물"]
    assert data["associated_stories"] == {}
    assert data["is_active"] is True
    assert data["deleted_at"] is None


def test_create_character_rejects_sort_order(admin_client, db_session):
    category = get_category(db_session, "정치 / 외교")
    payload = sample_character_payload("순서지정", category_id=category.id)
    payload["sort_order"] = 0

    response = admin_client.post("/api/v2/admin/characters", json=payload, headers=admin_headers(admin_client))

    assert response.status_code == 422


def test_create_character_without_optional_fields(admin_client, db_session):
    category = get_category(db_session, "정치 / 외교")
    payload = sample_character_payload("최소인물", category_id=category.id)
    del payload["image_url"]
    del payload["keywords"]

    response = admin_client.post("/api/v2/admin/characters", json=payload, headers=admin_headers(admin_client))

    assert response.status_code == 201
    data = response.json()
    assert data["image_url"] == ""
    assert data["keywords"] == []
    assert data["associated_stories"] == {}


def test_create_character_with_associated_stories(admin_client, db_session):
    category = get_category(db_session, "정치 / 외교")
    payload = sample_character_payload("연관스토리인물", category_id=category.id)
    payload["associated_stories"] = {"prsn": [370, 371], "cltur": [380]}

    response = admin_client.post("/api/v2/admin/characters", json=payload, headers=admin_headers(admin_client))

    assert response.status_code == 201
    assert response.json()["associated_stories"] == {"prsn": [370, 371], "cltur": [380]}


def test_update_character_associated_stories(admin_client, db_session):
    category = get_category(db_session, "정치 / 외교")
    create_response = admin_client.post(
        "/api/v2/admin/characters",
        json=sample_character_payload("연관수정", category_id=category.id),
        headers=admin_headers(admin_client),
    )
    character_id = create_response.json()["id"]

    response = admin_client.patch(
        f"/api/v2/admin/characters/{character_id}",
        json={"associated_stories": {"prsn": [100, 101]}},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    assert response.json()["associated_stories"] == {"prsn": [100, 101]}


def test_create_character_duplicate_name(admin_client, db_session):
    category = get_category(db_session, "정치 / 외교")
    payload = sample_character_payload("중복인물", category_id=category.id)

    first = admin_client.post("/api/v2/admin/characters", json=payload, headers=admin_headers(admin_client))
    second = admin_client.post("/api/v2/admin/characters", json=payload, headers=admin_headers(admin_client))

    assert first.status_code == 201
    assert second.status_code == 409


def test_list_characters_admin(admin_client):
    response = admin_client.get("/api/v2/admin/characters", headers=admin_headers(admin_client))

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert "id" in data[0]
    assert "is_active" in data[0]


def test_list_characters_admin_with_category_filter(admin_client, db_session):
    category = get_category(db_session, "정치 / 외교")
    response = admin_client.get(
        "/api/v2/admin/characters",
        params={"category_id": category.id},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert all(item["category_id"] == category.id for item in data)


def test_list_characters_admin_filter_is_active(admin_client, db_session):
    category = get_category(db_session, "정치 / 외교")
    create_response = admin_client.post(
        "/api/v2/admin/characters",
        json=sample_character_payload("비활성인물", category_id=category.id),
        headers=admin_headers(admin_client),
    )
    character_id = create_response.json()["id"]
    admin_client.patch(
        f"/api/v2/admin/characters/{character_id}",
        json={"is_active": False},
        headers=admin_headers(admin_client),
    )

    all_response = admin_client.get("/api/v2/admin/characters", headers=admin_headers(admin_client))
    active_response = admin_client.get(
        "/api/v2/admin/characters",
        params={"is_active": True},
        headers=admin_headers(admin_client),
    )
    inactive_response = admin_client.get(
        "/api/v2/admin/characters",
        params={"is_active": False},
        headers=admin_headers(admin_client),
    )

    assert character_id in [item["id"] for item in all_response.json()]
    assert character_id not in [item["id"] for item in active_response.json()]
    assert character_id in [item["id"] for item in inactive_response.json()]
    assert all(item["is_active"] is True for item in active_response.json())
    assert all(item["is_active"] is False for item in inactive_response.json())


def test_list_characters_admin_search_by_name(admin_client):
    response = admin_client.get(
        "/api/v2/admin/characters",
        params={"name": "고종"},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert all("고종" in item["name"] for item in data)


def test_list_characters_admin_search_by_tag(admin_client):
    response = admin_client.get(
        "/api/v2/admin/characters",
        params={"tag": "개혁"},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(item["name"] == "고종" for item in data)
    assert all(any("개혁" in keyword for keyword in item["keywords"]) for item in data)


def test_list_characters_admin_search_by_name_and_tag(admin_client):
    matched = admin_client.get(
        "/api/v2/admin/characters",
        params={"name": "고", "tag": "외교"},
        headers=admin_headers(admin_client),
    )
    name_only = admin_client.get(
        "/api/v2/admin/characters",
        params={"name": "고"},
        headers=admin_headers(admin_client),
    )

    assert matched.status_code == 200
    matched_names = {item["name"] for item in matched.json()}
    assert "고종" in matched_names
    assert all("고" in name for name in matched_names)
    assert all(any("외교" in keyword for keyword in item["keywords"]) for item in matched.json())
    assert len(matched.json()) <= len(name_only.json())


def test_get_character_admin(admin_client, db_session):
    category = get_category(db_session, "정치 / 외교")
    create_response = admin_client.post(
        "/api/v2/admin/characters",
        json=sample_character_payload("조회인물", category_id=category.id),
        headers=admin_headers(admin_client),
    )
    character_id = create_response.json()["id"]

    response = admin_client.get(f"/api/v2/admin/characters/{character_id}", headers=admin_headers(admin_client))

    assert response.status_code == 200
    assert response.json()["name"] == "조회인물"


def test_get_character_admin_not_found(admin_client):
    response = admin_client.get("/api/v2/admin/characters/999999", headers=admin_headers(admin_client))

    assert response.status_code == 404


def test_update_character(admin_client, db_session):
    category = get_category(db_session, "정치 / 외교")
    create_response = admin_client.post(
        "/api/v2/admin/characters",
        json=sample_character_payload("수정전", category_id=category.id),
        headers=admin_headers(admin_client),
    )
    character_id = create_response.json()["id"]

    response = admin_client.patch(
        f"/api/v2/admin/characters/{character_id}",
        json={"one_line_summary": "수정된 요약", "is_active": False},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["one_line_summary"] == "수정된 요약"
    assert data["is_active"] is False
    assert data["name"] == "수정전"


def test_reorder_characters_in_category(admin_client, db_session):
    category = get_category(db_session, "정치 / 외교")
    characters = admin_client.get(
        "/api/v2/admin/characters",
        params={"category_id": category.id},
        headers=admin_headers(admin_client),
    ).json()
    assert len(characters) >= 2

    first = characters[0]
    second = characters[1]

    response = admin_client.patch(
        "/api/v2/admin/characters/reorder",
        json={
            "category_id": category.id,
            "ids": [second["id"], first["id"]],
        },
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    reordered = {item["id"]: item["sort_order"] for item in response.json()}
    assert reordered[first["id"]] == 1
    assert reordered[second["id"]] == 0


def test_reorder_characters_wrong_category(admin_client, db_session):
    politics = get_category(db_session, "정치 / 외교")
    independence = get_category(db_session, "독립 / 호국")
    character = admin_client.get(
        "/api/v2/admin/characters",
        params={"category_id": independence.id},
        headers=admin_headers(admin_client),
    ).json()[0]

    response = admin_client.patch(
        "/api/v2/admin/characters/reorder",
        json={
            "category_id": politics.id,
            "ids": [character["id"]],
        },
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 400


def test_delete_character_soft(admin_client, db_session):
    category = get_category(db_session, "정치 / 외교")
    create_response = admin_client.post(
        "/api/v2/admin/characters",
        json=sample_character_payload("삭제대상", category_id=category.id),
        headers=admin_headers(admin_client),
    )
    character_id = create_response.json()["id"]

    delete_response = admin_client.delete(
        f"/api/v2/admin/characters/{character_id}",
        headers=admin_headers(admin_client),
    )

    assert delete_response.status_code == 200
    assert delete_response.json()["deleted_at"] is not None

    hidden = admin_client.get("/api/v2/admin/characters", headers=admin_headers(admin_client))
    assert character_id not in [item["id"] for item in hidden.json()]


def test_create_character_requires_auth(admin_client, monkeypatch):
    monkeypatch.delenv("JWT_SECRET", raising=False)

    response = admin_client.post(
        "/api/v2/admin/characters",
        json=sample_character_payload("인증없음", category_id=1),
    )

    assert response.status_code == 503


def test_create_character_invalid_token(admin_client, db_session):
    category = get_category(db_session, "정치 / 외교")
    response = admin_client.post(
        "/api/v2/admin/characters",
        json=sample_character_payload("토큰오류", category_id=category.id),
        headers={"Authorization": "Bearer wrong-token"},
    )

    assert response.status_code == 401


def test_create_character_missing_token(admin_client, db_session):
    category = get_category(db_session, "정치 / 외교")
    response = admin_client.post(
        "/api/v2/admin/characters",
        json=sample_character_payload("토큰누락", category_id=category.id),
    )

    assert response.status_code == 401


def test_get_character_admin_includes_turn_stats(admin_client, db_session):
    from tests.helpers import get_character

    character = get_character(db_session, "이순신")
    assert character is not None

    response = admin_client.get(
        f"/api/v2/admin/characters/{character.id}",
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    turn_stats = response.json()["turn_stats"]
    assert len(turn_stats) >= 3
    assert turn_stats[0]["id"] > 0
    assert "name" in turn_stats[0]
    assert "value" in turn_stats[0]


def test_create_character_with_turn_stats(admin_client, db_session):
    category = get_category(db_session, "정치 / 외교")
    payload = sample_character_payload("능력치인물", category_id=category.id)
    payload["turn_stats"] = [
        {"name": "국력", "value": 50},
        {"name": "외교", "value": 60},
    ]

    response = admin_client.post("/api/v2/admin/characters", json=payload, headers=admin_headers(admin_client))

    assert response.status_code == 201
    turn_stats = response.json()["turn_stats"]
    assert len(turn_stats) == 2
    assert turn_stats[0]["name"] == "국력"
    assert turn_stats[0]["value"] == 50
    assert turn_stats[0]["id"] > 0


def test_create_character_turn_stats_rejects_sort_order(admin_client, db_session):
    category = get_category(db_session, "정치 / 외교")
    payload = sample_character_payload("능력치422", category_id=category.id)
    payload["turn_stats"] = [{"name": "국력", "value": 50, "sort_order": 0}]

    response = admin_client.post("/api/v2/admin/characters", json=payload, headers=admin_headers(admin_client))

    assert response.status_code == 422


def test_update_character_turn_stats(admin_client, db_session):
    from tests.helpers import get_character

    character = get_character(db_session, "이순신")
    assert character is not None

    current = admin_client.get(
        f"/api/v2/admin/characters/{character.id}",
        headers=admin_headers(admin_client),
    ).json()["turn_stats"]
    first = current[0]

    response = admin_client.patch(
        f"/api/v2/admin/characters/{character.id}",
        json={
            "turn_stats": [
                {**first, "name": "전술력 (수정)", "value": 99},
                *current[1:],
            ]
        },
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    updated = response.json()["turn_stats"]
    assert updated[0]["name"] == "전술력 (수정)"
    assert updated[0]["value"] == 99
    assert updated[0]["id"] == first["id"]


def test_update_character_turn_stats_reorder(admin_client, db_session):
    from tests.helpers import get_character

    character = get_character(db_session, "이순신")
    current = admin_client.get(
        f"/api/v2/admin/characters/{character.id}",
        headers=admin_headers(admin_client),
    ).json()["turn_stats"]
    assert len(current) >= 2
    reordered = [current[1], current[0], *current[2:]]

    response = admin_client.patch(
        f"/api/v2/admin/characters/{character.id}",
        json={"turn_stats": reordered},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    result = response.json()["turn_stats"]
    assert result[0]["id"] == current[1]["id"]
    assert result[1]["id"] == current[0]["id"]


def test_update_character_turn_stats_soft_delete(admin_client, db_session):
    category = get_category(db_session, "정치 / 외교")
    create_response = admin_client.post(
        "/api/v2/admin/characters",
        json={
            **sample_character_payload("능력치삭제", category_id=category.id),
            "turn_stats": [
                {"name": "유지", "value": 10},
                {"name": "삭제", "value": 20},
            ],
        },
        headers=admin_headers(admin_client),
    )
    character_id = create_response.json()["id"]
    stats = create_response.json()["turn_stats"]

    response = admin_client.patch(
        f"/api/v2/admin/characters/{character_id}",
        json={"turn_stats": [stats[0]]},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 200
    assert len(response.json()["turn_stats"]) == 1
    assert response.json()["turn_stats"][0]["name"] == "유지"


def test_update_character_turn_stats_unknown_id(admin_client, db_session):
    from tests.helpers import get_character

    character = get_character(db_session, "이순신")
    current = admin_client.get(
        f"/api/v2/admin/characters/{character.id}",
        headers=admin_headers(admin_client),
    ).json()["turn_stats"]

    response = admin_client.patch(
        f"/api/v2/admin/characters/{character.id}",
        json={"turn_stats": [{**current[0], "id": 99999}]},
        headers=admin_headers(admin_client),
    )

    assert response.status_code == 404
