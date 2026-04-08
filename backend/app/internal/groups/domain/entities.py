from ninja import Schema
from typing import Optional
import uuid


class GroupSchema(Schema):
    id: uuid.UUID
    name: str
    invite_code: str
    has_password: bool = False

    @staticmethod
    def resolve_has_password(obj):
        return bool(obj.password)


class GroupCreateSchema(Schema):
    name: str
    password: str = ""


class JoinGroupSchema(Schema):
    invite_code: str
    password: str = ""


class GroupUpdateSchema(Schema):
    password: Optional[str] = None


class GroupInviteInfoSchema(Schema):
    group_name: str
    requires_password: bool


class GroupMemberSchema(Schema):
    id: uuid.UUID
    name: str
    telegram_username: str = ""
    first_name: str = ""
    last_name: str = ""
    is_admin: bool = False
    group_id: Optional[uuid.UUID] = None

    @staticmethod
    def resolve_name(obj):
        return obj.display_name

    @staticmethod
    def resolve_is_admin(obj):
        return obj.is_staff or obj.is_superuser

    @staticmethod
    def resolve_group_id(obj):
        return obj.group_id
