from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from db.models import AdminRole


class AdminUserResponse(BaseModel):
    id: int
    username: str
    role: AdminRole
    is_active: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AdminUserCreate(BaseModel):
    username: str = Field(..., min_length=1, max_length=50, description="로그인 아이디")
    password: str = Field(..., min_length=8, max_length=128, description="비밀번호")
    role: AdminRole = Field(..., description="superadmin | admin | partner")

    model_config = ConfigDict(extra="forbid")


class AdminUserUpdate(BaseModel):
    role: Optional[AdminRole] = Field(None, description="superadmin | admin | partner")
    is_active: Optional[bool] = Field(None, description="true=활성, false=비활성")
    password: Optional[str] = Field(None, min_length=8, max_length=128, description="비밀번호")

    model_config = ConfigDict(extra="forbid")


class AdminLoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=128)

    model_config = ConfigDict(extra="forbid")


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin_user: AdminUserResponse


class TokenType(str, Enum):
    BEARER = "bearer"
