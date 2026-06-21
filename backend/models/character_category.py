from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class CharacterCategoryCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="카테고리명 (예: 정치 / 외교)")

    model_config = ConfigDict(extra="forbid")


class CharacterCategoryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100, description="카테고리명")
    is_active: Optional[bool] = Field(None, description="true=사용, false=미사용")

    model_config = ConfigDict(extra="forbid")


class CharacterCategoryResponse(BaseModel):
    id: int
    title: str
    sort_order: int
    is_active: bool
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CharacterCategoryReorderRequest(BaseModel):
    ids: List[int] = Field(..., min_length=1, description="카테고리 DB id 배열 (index=sort_order)")
