from typing import Generic, List, TypeVar

from pydantic import BaseModel

T = TypeVar("T")

ALLOWED_PAGE_SIZES = {10, 20, 50, 100}


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    page: int
    page_size: int
    total: int
    total_pages: int
