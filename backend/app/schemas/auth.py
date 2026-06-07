from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, model_validator


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = None


class UserRegister(BaseModel):
    """Alias payload for clients that POST to /auth/register with `name`."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = None
    name: str | None = None

    @model_validator(mode="after")
    def normalize_name(self) -> "UserRegister":
        if not self.full_name and self.name:
            self.full_name = self.name
        return self

    def to_user_create(self) -> UserCreate:
        return UserCreate(email=self.email, password=self.password, full_name=self.full_name)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=255)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
