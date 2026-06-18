"""JSON → DB 시드 로직 (테이블 생성과 분리)."""

from __future__ import annotations

import json
import os

from sqlalchemy import func, inspect, select

from db.database import SessionLocal, engine
from db.models import Character, CharacterStat, Choice, Ending, Scenario, Turn

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHARACTERS_JSON_PATH = os.path.join(BASE_DIR, "data", "characters.json")
ENDINGS_DIR = os.path.join(BASE_DIR, "data", "endings")

CONTENT_TABLES = ("characters", "character_stats", "scenarios", "turns", "choices", "endings")


def tables_exist() -> bool:
    inspector = inspect(engine)
    existing = set(inspector.get_table_names())
    return all(name in existing for name in CONTENT_TABLES)


def clear_content_data(session) -> None:
    """콘텐츠 테이블만 비웁니다 (users, play_sessions 등은 유지)."""
    session.query(Ending).delete()
    session.query(Choice).delete()
    session.query(Turn).delete()
    session.query(Scenario).delete()
    session.query(CharacterStat).delete()
    session.query(Character).delete()


def seed_characters(session) -> dict[tuple[str, int], int]:
    """characters.json을 DB에 적재하고 (character_name, scenario_id) -> scenario PK 매핑을 반환."""
    with open(CHARACTERS_JSON_PATH, "r", encoding="utf-8") as f:
        characters_data = json.load(f)

    scenario_lookup: dict[tuple[str, int], int] = {}

    for name, profile in characters_data.items():
        mbti_details = profile.get("mbti_details", {})
        character = Character(
            name=name,
            category=profile["category"],
            era=profile["era"],
            era_tag=profile["era_tag"],
            role=profile["role"],
            years=profile["years"],
            image_url=profile.get("image_url", ""),
            situation=profile["situation"],
            one_line_summary=profile["one_line_summary"],
            mbti=profile["mbti"],
            mbti_nickname=profile["mbti_nickname"],
            mbti_e_i=mbti_details.get("E_I", ""),
            mbti_s_n=mbti_details.get("S_N", ""),
            mbti_t_f=mbti_details.get("T_F", ""),
            mbti_j_p=mbti_details.get("J_P", ""),
            intro_quote=profile["intro_quote"],
            intro_desc=profile["intro_desc"],
            keywords=profile.get("keywords", []),
            associated_stories=profile.get("associated_stories", {}),
        )
        session.add(character)
        session.flush()

        for idx, stat in enumerate(profile.get("stats", [])):
            session.add(
                CharacterStat(
                    character_id=character.id,
                    name=stat["name"],
                    value=stat["value"],
                    desc=stat["desc"],
                    sort_order=idx,
                )
            )

        for scenario_data in profile.get("scenarios", []):
            scenario = Scenario(
                character_id=character.id,
                scenario_id=scenario_data["scenario_id"],
                title=scenario_data["title"],
                description=scenario_data["description"],
                historical_facts=scenario_data["historical_facts"],
                source_story_ids=scenario_data.get("source_story_ids", []),
            )
            session.add(scenario)
            session.flush()
            scenario_lookup[(name, scenario_data["scenario_id"])] = scenario.id

            for turn_data in scenario_data.get("turns", []):
                turn = Turn(
                    scenario_id=scenario.id,
                    turn_no=turn_data["turn_no"],
                    title=turn_data["title"],
                    situation=turn_data["situation"],
                    turn_image=turn_data.get("turn_image", ""),
                    tip_title=turn_data["tip_title"],
                    tip_desc=turn_data["tip_desc"],
                )
                session.add(turn)
                session.flush()

                for choice_key, choice_data in turn_data.get("choices", {}).items():
                    session.add(
                        Choice(
                            turn_id=turn.id,
                            choice_key=choice_key,
                            title=choice_data["title"],
                            description=choice_data["description"],
                            choice_image=choice_data.get("choice_image", ""),
                            result_text=choice_data["result_text"],
                            is_historical=choice_data["is_historical"],
                            stats=choice_data.get("stats", {}),
                        )
                    )

    return scenario_lookup


def seed_endings(session, scenario_lookup: dict[tuple[str, int], int]) -> None:
    if not os.path.isdir(ENDINGS_DIR):
        print(f"[WARNING] endings 디렉터리 없음: {ENDINGS_DIR}")
        return

    for filename in sorted(os.listdir(ENDINGS_DIR)):
        if not filename.endswith(".json"):
            continue

        base_name = filename[:-5]
        if "_" not in base_name:
            print(f"[WARNING] endings 파일명 형식 불일치: {filename}")
            continue

        character_name, scenario_id_str = base_name.rsplit("_", 1)
        try:
            scenario_id = int(scenario_id_str)
        except ValueError:
            print(f"[WARNING] scenario_id 파싱 실패: {filename}")
            continue

        scenario_pk = scenario_lookup.get((character_name, scenario_id))
        if scenario_pk is None:
            print(f"[WARNING] 시나리오 매칭 실패: {filename}")
            continue

        filepath = os.path.join(ENDINGS_DIR, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            endings_data = json.load(f)

        for path_key, ending_data in endings_data.items():
            session.add(
                Ending(
                    scenario_id=scenario_pk,
                    path_key=path_key,
                    ending_type=ending_data.get("ending_type", ""),
                    title=ending_data.get("title", ""),
                    history_fact=ending_data.get("history_fact", ""),
                    story_headline=ending_data.get("story_headline", ""),
                    story_contents=ending_data.get("story_contents", ""),
                    factual_contents=ending_data.get("factual_contents", ""),
                    image_url=ending_data.get("image_url", ""),
                    summary_items=ending_data.get("summary_items", []),
                    recommended_places=ending_data.get("recommended_places", []),
                )
            )


def print_summary(session) -> None:
    character_count = session.scalar(select(func.count()).select_from(Character))
    stat_count = session.scalar(select(func.count()).select_from(CharacterStat))
    scenario_count = session.scalar(select(func.count()).select_from(Scenario))
    turn_count = session.scalar(select(func.count()).select_from(Turn))
    choice_count = session.scalar(select(func.count()).select_from(Choice))
    ending_count = session.scalar(select(func.count()).select_from(Ending))

    print("\n[SEED SUMMARY]")
    print(f"  characters       : {character_count}")
    print(f"  character_stats  : {stat_count}")
    print(f"  scenarios        : {scenario_count}")
    print(f"  turns            : {turn_count}")
    print(f"  choices          : {choice_count}")
    print(f"  endings          : {ending_count}")


def run_seed(force: bool = False) -> None:
    if not tables_exist():
        raise RuntimeError("테이블이 없습니다. 먼저 `python scripts/init_db.py`를 실행하세요.")

    session = SessionLocal()
    try:
        existing = session.scalar(select(func.count()).select_from(Character))
        if existing and not force:
            print(f"[WARNING] DB에 이미 {existing}명의 인물이 있습니다. --force 옵션으로 재시드하세요.")
            return

        if existing and force:
            print("[INFO] 기존 콘텐츠 데이터 삭제 중...")
            clear_content_data(session)
            session.flush()

        print("[INFO] characters.json 시드 중...")
        scenario_lookup = seed_characters(session)
        print("[INFO] endings/*.json 시드 중...")
        seed_endings(session, scenario_lookup)
        session.commit()
        print_summary(session)
        print("\n[SUCCESS] DB 시드 완료")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
