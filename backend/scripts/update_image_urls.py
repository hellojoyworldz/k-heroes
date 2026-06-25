"""GCS 버킷에서 시나리오 이미지 목록을 조회하여 characters.json 및 DB를 안전하게 일괄 업데이트합니다.

사용법:
    docker exec -it k-heroes-backend python scripts/update_image_urls.py
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.request
import urllib.parse
import unicodedata

# 상위 폴더 경로를 sys.path에 추가하여 db 패키지를 import할 수 있게 함
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from db.database import SessionLocal
from db.models import Character, Scenario, Turn, Choice

CHARACTERS_JSON_PATH = os.path.join(BASE_DIR, "data", "characters.json")


def fetch_gcs_objects() -> list[dict]:
    """GCS JSON API를 통해 scenarios/ 접두사 하위 객체 목록을 조회합니다."""
    url = "https://storage.googleapis.com/storage/v1/b/k-heroes_bucket/o?prefix=scenarios/"
    req = urllib.request.Request(url, headers={'User-Agent': 'Antigravity-AI'})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            return data.get('items', [])
    except Exception as e:
        print(f"[GCS] 객체 목록 조회 중 오류 발생: {e}", file=sys.stderr)
        return []


def main() -> None:
    print("[1/4] GCS 버킷에서 이미지 목록 가져오는 중...")
    items = fetch_gcs_objects()
    print(f"[GCS] 총 {len(items)}개의 객체를 조회했습니다.")

    # 매핑 데이터 생성: (인물명_NFC, 시나리오_ID, 턴_번호, 선택지_키) -> GCS 객체명
    gcs_mapping = {}
    pattern = re.compile(
        r'^scenarios/([^/]+)/[^/]+_scenario_(\d+)_turn_(\d+)(?:_([A-Za-z]))?\.png$'
    )

    for item in items:
        name = item['name']
        if name.endswith('/') or not name.endswith('.png'):
            continue
        
        match = pattern.match(name)
        if match:
            # GCS 상의 폴더명(인물명)을 NFC로 정규화
            char_nfc = unicodedata.normalize('NFC', match.group(1))
            sc_id = int(match.group(2))
            turn_no = int(match.group(3))
            choice_key = match.group(4)  # 'A', 'B' 혹은 None
            
            key = (char_nfc, sc_id, turn_no, choice_key)
            gcs_mapping[key] = name

    print(f"[GCS] 파싱된 시나리오 이미지 매핑 수: {len(gcs_mapping)}")

    # characters.json 로드
    if not os.path.exists(CHARACTERS_JSON_PATH):
        print(f"[ERROR] characters.json 파일을 찾을 수 없습니다: {CHARACTERS_JSON_PATH}", file=sys.stderr)
        sys.exit(1)

    print("[2/4] characters.json 로드 및 이미지 URL 업데이트 중...")
    with open(CHARACTERS_JSON_PATH, "r", encoding="utf-8") as f:
        characters_data = json.load(f)

    updates_count = 0
    fallback_count = 0

    for char_name, char_info in characters_data.items():
        # 캐릭터명 정규화
        char_nfc = unicodedata.normalize('NFC', char_name)
        char_nfd = unicodedata.normalize('NFD', char_name)

        for sc_idx, sc in enumerate(char_info.get("scenarios", [])):
            sc_id = sc.get("scenario_id")  # 일반적으로 1, 2
            
            for turn in sc.get("turns", []):
                turn_no = turn.get("turn_no")
                
                # 1. 턴 이미지 업데이트
                turn_key = (char_nfc, sc_id, turn_no, None)
                if turn_key in gcs_mapping:
                    gcs_name = gcs_mapping[turn_key]
                    turn_url = f"https://storage.googleapis.com/k-heroes_bucket/{urllib.parse.quote(gcs_name)}"
                    updates_count += 1
                else:
                    # GCS에 아직 없는 경우 fallback (NFC 폴더 + NFD 파일명 규칙 적용)
                    fallback_name = f"scenarios/{char_nfc}/{char_nfd}_scenario_{sc_id}_turn_{turn_no}.png"
                    turn_url = f"https://storage.googleapis.com/k-heroes_bucket/{urllib.parse.quote(fallback_name)}"
                    fallback_count += 1
                
                turn["turn_image"] = turn_url

                # 2. 선택지 이미지 업데이트
                choices = turn.get("choices", {})
                for choice_key, choice_data in choices.items():
                    choice_map_key = (char_nfc, sc_id, turn_no, choice_key)
                    if choice_map_key in gcs_mapping:
                        gcs_name = gcs_mapping[choice_map_key]
                        choice_url = f"https://storage.googleapis.com/k-heroes_bucket/{urllib.parse.quote(gcs_name)}"
                        updates_count += 1
                    else:
                        # GCS에 아직 없는 경우 fallback (NFC 폴더 + NFD 파일명 규칙 적용)
                        fallback_name = f"scenarios/{char_nfc}/{char_nfd}_scenario_{sc_id}_turn_{turn_no}_{choice_key}.png"
                        choice_url = f"https://storage.googleapis.com/k-heroes_bucket/{urllib.parse.quote(fallback_name)}"
                        fallback_count += 1
                    
                    choice_data["choice_image"] = choice_url

    # 수정된 내용을 characters.json에 저장
    with open(CHARACTERS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(characters_data, f, indent=4, ensure_ascii=False)
    
    print(f"[JSON] 업데이트 완료 (실제 매치: {updates_count}건, 예비 생성: {fallback_count}건)")

    # DB 업데이트 수행
    print("[3/4] Supabase 데이터베이스에 직접 반영(UPDATE) 하는 중...")
    db = SessionLocal()
    db_updated_turns = 0
    db_updated_choices = 0
    
    try:
        for char_name, char_info in characters_data.items():
            db_char = db.query(Character).filter_by(name=char_name).first()
            if not db_char:
                print(f"[DB WARNING] DB에 인물 레코드가 없습니다: {char_name}")
                continue
                
            for sc_idx, sc in enumerate(char_info.get("scenarios", [])):
                db_sc = db.query(Scenario).filter_by(character_id=db_char.id, sort_order=sc_idx).first()
                if not db_sc:
                    print(f"[DB WARNING] DB에 시나리오 레코드가 없습니다: {char_name} - index {sc_idx}")
                    continue
                    
                for turn_data in sc.get("turns", []):
                    turn_no = turn_data.get("turn_no")
                    # Turn 정렬 기준 (sort_order)
                    sort_order = turn_data.get("sort_order", turn_no - 1)
                    
                    db_turn = db.query(Turn).filter_by(scenario_id=db_sc.id, sort_order=sort_order).first()
                    if not db_turn:
                        print(f"[DB WARNING] DB에 턴 레코드가 없습니다: {char_name} SC {sc_id} Turn {turn_no}")
                        continue
                    
                    # 턴 이미지 컬럼 업데이트
                    db_turn.turn_image = turn_data.get("turn_image", "")
                    db_updated_turns += 1
                    
                    # 선택지 이미지 컬럼 업데이트
                    choices = turn_data.get("choices", {})
                    for choice_key, choice_data in choices.items():
                        db_choice = db.query(Choice).filter_by(turn_id=db_turn.id, choice_key=choice_key).first()
                        if not db_choice:
                            print(f"[DB WARNING] DB에 선택지 레코드가 없습니다: {char_name} SC {sc_id} Turn {turn_no} Choice {choice_key}")
                            continue
                        
                        db_choice.choice_image = choice_data.get("choice_image", "")
                        db_updated_choices += 1

        db.commit()
        print(f"[DB] 업데이트 성공 (턴 이미지: {db_updated_turns}건, 선택지 이미지: {db_updated_choices}건)")
    except Exception as e:
        db.rollback()
        print(f"[DB ERROR] DB 업데이트 트랜잭션 오류 발생: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

    print("[4/4] 모든 업데이트 작업이 안전하게 완료되었습니다.")


if __name__ == "__main__":
    main()
