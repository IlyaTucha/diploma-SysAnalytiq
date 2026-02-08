from ninja import Schema
from uuid import UUID
from typing import Optional
from datetime import datetime

class ReviewerSchema(Schema):
    id: UUID
    name: str
    email: str
    avatar: Optional[str] = None

class NotificationSchema(Schema):
    id: UUID
    type: str
    message: str
    is_read: bool
    created_at: datetime
    module_name: Optional[str] = None
    lesson_title: Optional[str] = None
    lesson_path: Optional[str] = None
    reviewer: Optional[ReviewerSchema] = None
    
    @staticmethod
    def resolve_reviewer(obj):
        if obj.reviewer:
            return {
                "id": obj.reviewer.id,
                "name": obj.reviewer.name or f"{obj.reviewer.first_name} {obj.reviewer.last_name}".strip(),
                "email": obj.reviewer.email,
                "avatar": obj.reviewer.avatar.url if obj.reviewer.avatar else None
            }
        return None
