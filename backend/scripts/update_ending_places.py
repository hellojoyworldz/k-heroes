"""kf_area_total_merged.csv 파일에서 추천 장소의 이미지 URL 및 콘텐츠 상세 링크를 가져와 
endings/*.json 파일 및 Supabase DB를 안전하게 일괄 업데이트합니다.

사용법:
    docker exec -it k-heroes-backend python scripts/update_ending_places.py
"""
from __future__ import annotations

import json
import os
import csv
import sys

# 상위 폴더 경로를 sys.path에 추가하여 db 패키지를 import할 수 있게 함
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from db.database import SessionLocal
from db.models import Character, Scenario, Ending

CSV_PATH = os.path.join(BASE_DIR, "data", "processed", "kf_area_total_merged.csv")
ENDINGS_DIR = os.path.join(BASE_DIR, "data", "endings")


def load_csv_data() -> dict[str, tuple[str, str]]:
    """CSV 파일을 읽어서 data_title_nm -> (main_thumb_url, cntnts_url) 매핑을 생성합니다."""
    if not os.path.exists(CSV_PATH):
        print(f"[ERROR] CSV 파일을 찾을 수 없습니다: {CSV_PATH}", file=sys.stderr)
        return {}
        
    lookup = {}
    with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row.get("data_title_nm", "").strip()
            thumb = row.get("main_thumb_url", "").strip()
            link = row.get("cntnts_url", "").strip()
            
            if title:
                lookup[title] = (thumb, link)
    return lookup


def main() -> None:
    print("[1/3] CSV 데이터 로드 중...")
    csv_lookup = load_csv_data()
    print(f"[CSV] 총 {len(csv_lookup)}개의 장소 매핑을 로드했습니다.")
    
    if not os.path.isdir(ENDINGS_DIR):
        print(f"[ERROR] endings 디렉토리가 없습니다: {ENDINGS_DIR}", file=sys.stderr)
        sys.exit(1)

    print("[2/3] endings/*.json 파일 업데이트 중...")
    
    matched_count = 0
    missed_count = 0
    
    for filename in sorted(os.listdir(ENDINGS_DIR)):
        if not filename.endswith(".json"):
            continue
            
        filepath = os.path.join(ENDINGS_DIR, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            try:
                endings_data = json.load(f)
            except Exception as e:
                print(f"[JSON ERROR] {filename} 파싱 실패: {e}", file=sys.stderr)
                continue

        changed = False
        for path_key, ending_info in endings_data.items():
            places = ending_info.get("recommended_places", [])
            for place in places:
                place_name = place.get("name", "").strip()
                place_addr = place.get("address", "").strip()
                
                # 1. 정확한 이름 매칭 시도
                thumb = ""
                link = ""
                if place_name in csv_lookup:
                    thumb, link = csv_lookup[place_name]
                    matched_count += 1
                else:
                    # 2. 부분 일치 혹은 주소 매칭 시도
                    found = False
                    for title, (t_url, l_url) in csv_lookup.items():
                        if title and place_name and (title in place_name or place_name in title):
                            thumb, link = t_url, l_url
                            found = True
                            matched_count += 1
                            break
                    if not found:
                        missed_count += 1
                
                place["image_url"] = thumb
                place["link"] = link
                changed = True
                
        if changed:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(endings_data, f, indent=4, ensure_ascii=False)
                
    print(f"[JSON] 업데이트 완료 (매치: {matched_count}건, 미칭: {missed_count}건)")

    # DB 업데이트
    print("[3/3] Supabase 데이터베이스에 직접 반영(UPDATE) 하는 중...")
    db = SessionLocal()
    db_updated_endings = 0
    
    try:
        for filename in sorted(os.listdir(ENDINGS_DIR)):
            if not filename.endswith(".json"):
                continue
                
            base_name = filename[:-5]
            if "_" not in base_name:
                continue
                
            char_name, scenario_id_str = base_name.rsplit("_", 1)
            try:
                scenario_id = int(scenario_id_str)
            except ValueError:
                continue
                
            db_char = db.query(Character).filter_by(name=char_name).first()
            if not db_char:
                continue
                
            # 시나리오 sort_order 찾기
            # json 파일명의 scenario_id_str은 1 또는 2 이며, DB의 sort_order는 0 또는 1에 대응됩니다.
            sort_order = scenario_id - 1
            db_sc = db.query(Scenario).filter_by(character_id=db_char.id, sort_order=sort_order).first()
            if not db_sc:
                continue
                
            # 해당 endings/*.json 다시 읽어서 DB에 덮어쓰기
            filepath = os.path.join(ENDINGS_DIR, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                endings_data = json.load(f)
                
            for path_key, ending_info in endings_data.items():
                db_ending = db.query(Ending).filter_by(scenario_id=db_sc.id, path_key=path_key).first()
                if not db_ending:
                    continue
                    
                # DB의 recommended_places JSON 업데이트
                db_ending.recommended_places = ending_info.get("recommended_places", [])
                db_updated_endings += 1

        db.commit()
        print(f"[DB] 업데이트 성공 (엔딩 레코드: {db_updated_endings}건)")
    except Exception as e:
        db.rollback()
        print(f"[DB ERROR] DB 업데이트 트랜잭션 오류 발생: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

    print("[SUCCESS] 모든 추천 장소 이미지 및 링크 업데이트 완료")


if __name__ == "__main__":
    main()
