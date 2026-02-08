from ninja import Schema
from typing import Optional
import uuid

class UserSchema(Schema):
    id: uuid.UUID
    name: str = ""
    email: str
    avatar: Optional[str] = None
    is_admin: bool
    group_id: Optional[uuid.UUID] = None

class GoogleLoginSchema(Schema):
    token: str

class AuthResponse(Schema):
    access: str
    refresh: str
    user: UserSchema
