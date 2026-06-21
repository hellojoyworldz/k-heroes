"""characters.json 선택지 stats → turn_stats 마이그레이션 (name+delta)."""
from __future__ import annotations

import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHARACTERS_JSON_PATH = os.path.join(BASE_DIR, "data", "characters.json")


def migrate_choice(choice_data: dict) -> bool:
    if "turn_stats" in choice_data:
        return False
    stats = choice_data.pop("stats", None)
    if not stats:
        choice_data["turn_stats"] = []
        return True
    choice_data["turn_stats"] = [
        {"name": name, "delta": delta} for name, delta in stats.items()
    ]
    return True


def migrate_characters(data: dict) -> int:
    changed = 0
    for profile in data.values():
        for scenario in profile.get("scenarios", []):
            for turn in scenario.get("turns", []):
                for choice_data in turn.get("choices", {}).values():
                    if migrate_choice(choice_data):
                        changed += 1
    return changed


def main() -> None:
    with open(CHARACTERS_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    count = migrate_characters(data)
    with open(CHARACTERS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        f.write("\n")
    print(f"[SUCCESS] {count}개 선택지를 turn_stats 형식으로 변환했습니다.")


if __name__ == "__main__":
    main()
