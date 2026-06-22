"""
DB 테이블 생성 스크립트 (데이터 시드 없음).

사용법 (backend 디렉터리에서):
    python scripts/init_db.py           # 테이블 없으면 생성 + 스키마 마이그레이션
    python scripts/init_db.py --reset   # 기존 테이블 전부 삭제 후 재생성
"""
from __future__ import annotations

import argparse
import sys

BASE_DIR = __import__("os").path.dirname(__import__("os").path.dirname(__import__("os").path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from sqlalchemy import text

from db.database import DATABASE_URL, Base, engine
import db.models  # noqa: F401 — 모든 테이블을 metadata에 등록
import json


def _sqlite_table_columns(conn, table: str) -> set[str]:
    rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
    return {row[1] for row in rows}


def _sqlite_table_exists(conn, table: str) -> bool:
    row = conn.execute(
        text("SELECT name FROM sqlite_master WHERE type='table' AND name=:table"),
        {"table": table},
    ).fetchone()
    return row is not None


def _migrate_character_stats_to_json(conn) -> None:
    if not _sqlite_table_exists(conn, "characters"):
        return

    character_columns = _sqlite_table_columns(conn, "characters")
    if "stats" not in character_columns:
        conn.execute(text("ALTER TABLE characters ADD COLUMN stats JSON NOT NULL DEFAULT '[]'"))

    if not _sqlite_table_exists(conn, "character_stats"):
        return

    character_rows = conn.execute(text("SELECT id FROM characters")).fetchall()
    for (character_id,) in character_rows:
        stat_rows = conn.execute(
            text(
                "SELECT id, name, value, desc FROM character_stats "
                "WHERE character_id = :character_id AND deleted_at IS NULL "
                "ORDER BY sort_order, id"
            ),
            {"character_id": character_id},
        ).fetchall()

        if not stat_rows:
            continue

        stats_json = [
            {"name": row[1], "value": row[2], "desc": row[3] or ""}
            for row in stat_rows
        ]
        old_id_to_index = {row[0]: index for index, row in enumerate(stat_rows)}

        conn.execute(
            text("UPDATE characters SET stats = :stats WHERE id = :character_id"),
            {"stats": json.dumps(stats_json, ensure_ascii=False), "character_id": character_id},
        )

        choice_rows = conn.execute(
            text(
                "SELECT choices.id, choices.turn_stats FROM choices "
                "JOIN turns ON turns.id = choices.turn_id "
                "JOIN scenarios ON scenarios.id = turns.scenario_id "
                "WHERE scenarios.character_id = :character_id"
            ),
            {"character_id": character_id},
        ).fetchall()

        for choice_id, turn_stats_raw in choice_rows:
            if not turn_stats_raw:
                continue
            turn_stats = json.loads(turn_stats_raw) if isinstance(turn_stats_raw, str) else turn_stats_raw
            remapped = []
            for item in turn_stats:
                old_id = int(item["stat_id"])
                new_index = old_id_to_index.get(old_id)
                if new_index is None:
                    continue
                remapped.append({"stat_id": new_index, "delta": int(item["delta"])})
            conn.execute(
                text("UPDATE choices SET turn_stats = :turn_stats WHERE id = :choice_id"),
                {
                    "turn_stats": json.dumps(remapped, ensure_ascii=False),
                    "choice_id": choice_id,
                },
            )

    conn.execute(text("DROP TABLE character_stats"))


def _migrate_character_turn_stats(conn) -> None:
    if not _sqlite_table_exists(conn, "characters"):
        return
    if not _sqlite_table_exists(conn, "character_turn_stats"):
        return

    from repositories.turn_stats import CATEGORY_STAT_TEMPLATE_KEYS

    character_rows = conn.execute(
        text(
            "SELECT characters.id, character_categories.title "
            "FROM characters "
            "JOIN character_categories ON character_categories.id = characters.category_id"
        )
    ).fetchall()

    for character_id, category_title in character_rows:
        stat_rows = conn.execute(
            text(
                "SELECT id, name FROM character_turn_stats "
                "WHERE character_id = :character_id AND deleted_at IS NULL "
                "ORDER BY sort_order, id"
            ),
            {"character_id": character_id},
        ).fetchall()

        template_keys = CATEGORY_STAT_TEMPLATE_KEYS.get(category_title, [])
        name_to_id: dict[str, int] = {row[1]: row[0] for row in stat_rows}

        if not stat_rows and template_keys:
            for sort_order, name in enumerate(template_keys):
                conn.execute(
                    text(
                        "INSERT INTO character_turn_stats "
                        "(character_id, name, sort_order, deleted_at) "
                        "VALUES (:character_id, :name, :sort_order, NULL)"
                    ),
                    {
                        "character_id": character_id,
                        "name": name,
                        "sort_order": sort_order,
                    },
                )
            stat_rows = conn.execute(
                text(
                    "SELECT id, name FROM character_turn_stats "
                    "WHERE character_id = :character_id AND deleted_at IS NULL "
                    "ORDER BY sort_order, id"
                ),
                {"character_id": character_id},
            ).fetchall()
            name_to_id = {row[1]: row[0] for row in stat_rows}

        if not name_to_id:
            continue

        choice_rows = conn.execute(
            text(
                "SELECT choices.id, choices.turn_stats FROM choices "
                "JOIN turns ON turns.id = choices.turn_id "
                "JOIN scenarios ON scenarios.id = turns.scenario_id "
                "WHERE scenarios.character_id = :character_id"
            ),
            {"character_id": character_id},
        ).fetchall()

        for choice_id, turn_stats_raw in choice_rows:
            if not turn_stats_raw:
                continue
            turn_stats = (
                json.loads(turn_stats_raw) if isinstance(turn_stats_raw, str) else turn_stats_raw
            )
            if not turn_stats:
                continue
            if all("turn_stats_id" in item for item in turn_stats):
                continue

            remapped = []
            for item in turn_stats:
                if "turn_stats_id" in item:
                    remapped.append(
                        {
                            "turn_stats_id": int(item["turn_stats_id"]),
                            "delta": int(item["delta"]),
                        }
                    )
                    continue
                stat_index = int(item.get("stat_id", -1))
                if stat_index < 0 or stat_index >= len(template_keys):
                    continue
                stat_name = template_keys[stat_index]
                turn_stats_id = name_to_id.get(stat_name)
                if turn_stats_id is None:
                    continue
                remapped.append(
                    {"turn_stats_id": turn_stats_id, "delta": int(item["delta"])}
                )
            conn.execute(
                text("UPDATE choices SET turn_stats = :turn_stats WHERE id = :choice_id"),
                {
                    "turn_stats": json.dumps(remapped, ensure_ascii=False),
                    "choice_id": choice_id,
                },
            )


def migrate_schema() -> None:
    if not DATABASE_URL.startswith("sqlite"):
        return

    with engine.begin() as conn:
        _migrate_character_stats_to_json(conn)
        _migrate_character_turn_stats(conn)

        turn_columns = _sqlite_table_columns(conn, "turns")
        if "is_active" in turn_columns:
            pass
        elif turn_columns:
            conn.execute(text("ALTER TABLE turns ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1"))

        ending_columns = _sqlite_table_columns(conn, "endings")
        if ending_columns:
            if "is_active" not in ending_columns:
                conn.execute(text("ALTER TABLE endings ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1"))
            if "sort_order" not in ending_columns:
                conn.execute(text("ALTER TABLE endings ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0"))
                scenario_rows = conn.execute(
                    text("SELECT DISTINCT scenario_id FROM endings WHERE deleted_at IS NULL")
                ).fetchall()
                for (scenario_id,) in scenario_rows:
                    ending_rows = conn.execute(
                        text(
                            "SELECT id FROM endings "
                            "WHERE scenario_id = :scenario_id AND deleted_at IS NULL "
                            "ORDER BY path_key, id"
                        ),
                        {"scenario_id": scenario_id},
                    ).fetchall()
                    for index, (ending_id,) in enumerate(ending_rows):
                        conn.execute(
                            text("UPDATE endings SET sort_order = :sort_order WHERE id = :ending_id"),
                            {"sort_order": index, "ending_id": ending_id},
                        )


def init_tables(reset: bool = False) -> None:
    if reset:
        print("[INFO] 기존 테이블 삭제 중...")
        Base.metadata.drop_all(bind=engine)

    print("[INFO] 테이블 생성 중...")
    Base.metadata.create_all(bind=engine)
    print("[INFO] 스키마 마이그레이션 중...")
    migrate_schema()
    print("[SUCCESS] 테이블 생성 완료")


def main() -> None:
    parser = argparse.ArgumentParser(description="SQLite DB 테이블 생성")
    parser.add_argument("--reset", action="store_true", help="기존 테이블 삭제 후 재생성")
    args = parser.parse_args()
    init_tables(reset=args.reset)


if __name__ == "__main__":
    main()
