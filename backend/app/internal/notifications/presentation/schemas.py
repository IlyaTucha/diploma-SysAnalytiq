from ninja import Schema
from uuid import UUID
from typing import Optional
from datetime import datetime

class ReviewerSchema(Schema):
    id: UUID
    name: str
    avatar: Optional[str] = None
    telegram_username: Optional[str] = None

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
    highlighted_code: Optional[str] = None
    inline_comment: Optional[str] = None
    start_line: Optional[int] = None
    end_line: Optional[int] = None
    inline_comments: Optional[list] = None
    
    @staticmethod
    def resolve_reviewer(obj):
        if obj.reviewer:
            return {
                "id": obj.reviewer.id,
                "name": obj.reviewer.display_name,
                "avatar": obj.reviewer.avatar_url or None,
                "telegram_username": obj.reviewer.telegram_username or None,
            }
        return None
