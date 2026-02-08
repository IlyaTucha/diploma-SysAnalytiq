from ninja import Schema
from typing import List
import uuid


class GroupSchema(Schema):
    id: uuid.UUID
    name: str
    invite_code: str


class GroupCreateSchema(Schema):
    name: str


class JoinGroupSchema(Schema):
    invite_code: str


class GroupMemberSchema(Schema):
    id: uuid.UUID
    name: str
    email: str
