from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class CharacterCategoryCreate(BaseModel):
    label: str = Field(..., min_length=1, max_length=100)

    model_config = ConfigDict(extra="forbid")


class CharacterCategoryUpdate(BaseModel):
    label: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None

    model_config = ConfigDict(extra="forbid")


class CharacterCategoryResponse(BaseModel):
    id: int
    label: str
    sort_order: int
    is_active: bool
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CharacterCategoryReorderRequest(BaseModel):
    ids: List[int] = Field(..., min_length=1)
