from ninja import Schema
from typing import Optional
import uuid

class UserSchema(Schema):
    id: uuid.UUID
    name: str = ""
    first_name: str = ""
    last_name: str = ""
    vk_profile_url: str = ""
    telegram_username: str = ""
    telegram_notifications: bool = False
    avatar: Optional[str] = None
    is_admin: bool
    group_id: Optional[uuid.UUID] = None
    group_name: Optional[str] = None

class VKLoginSchema(Schema):
    access_token: str

class UpdateProfileSchema(Schema):
    first_name: str = ""
    last_name: str = ""

class ToggleNotificationsSchema(Schema):
    enabled: bool

class TelegramBindSchema(Schema):
    id: int
    first_name: str = ""
    last_name: str = ""
    username: str = ""
    photo_url: str = ""
    auth_date: int
    hash: str

class AuthResponse(Schema):
    access: str
    refresh: str
    user: UserSchema
