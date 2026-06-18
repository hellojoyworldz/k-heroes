from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.content_repository import CharacterNotFoundError, list_characters, get_character_card
from db.database import get_db
from models.character import CharacterCard

router = APIRouter(prefix="/api/v2/characters", tags=["Character v2"])


@router.get("", response_model=List[CharacterCard])
async def get_characters(
    category: Optional[str] = Query(None, description="인물 분류 카테고리"),
    db: Session = Depends(get_db),
):
    return list_characters(db, category=category)


@router.get("/{name}", response_model=CharacterCard)
async def get_character_details(name: str, db: Session = Depends(get_db)):
    try:
        return get_character_card(db, name)
    except CharacterNotFoundError:
        raise HTTPException(status_code=404, detail=f"Character '{name}' not found in profiles.")
