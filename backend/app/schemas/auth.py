import uuid
from datetime import datetime
from typing import Optional, Union
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict

class UserSignup(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False

class UserResponse(BaseModel):
    id: Union[str, uuid.UUID]
    name: str
    email: str
    google_id: Optional[str] = None
    profile_picture: Optional[str] = None
    provider: str
    created_at: datetime

    @field_validator('id', mode='before')
    def convert_uuid_to_str(cls, v):
        return str(v) if v is not None else v

    model_config = ConfigDict(from_attributes=True)

class AuthMessageResponse(BaseModel):
    status: str
    message: str
    token: Optional[str] = None
    user: Optional[UserResponse] = None
