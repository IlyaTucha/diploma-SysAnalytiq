from ninja import Schema
from typing import Optional, Any, List
from datetime import datetime
import uuid

class SubmissionSchema(Schema):
    id: int
    student_id: Optional[uuid.UUID] = None
    student_name: str = ""
    student_vk_profile_url: str = ""
    student_telegram_username: str = ""
    student_group_id: Optional[uuid.UUID] = None
    lesson_id: uuid.UUID
    module_id: int
    status: str
    submitted_date: datetime
    student_solution: str
    execution_result: Optional[Any] = None
    feedback: Optional[str] = None
    attempt_count: int = 1
    review_history: List[Any] = []
    
    @staticmethod
    def resolve_student_id(obj):
        return obj.student_id

    @staticmethod
    def resolve_student_name(obj):
        if obj.student:
            return obj.student.display_name
        return obj.student_display_name or 'Удалённый студент'

    @staticmethod
    def resolve_student_vk_profile_url(obj):
        if obj.student:
            return obj.student.vk_profile_url or ""
        return ""

    @staticmethod
    def resolve_student_telegram_username(obj):
        if obj.student:
            return obj.student.telegram_username or ""
        return ""

    @staticmethod
    def resolve_student_group_id(obj):
        if obj.student:
            return obj.student.group_id
        return None

    @staticmethod
    def resolve_lesson_id(obj):
        return obj.lesson_id
    
    @staticmethod
    def resolve_module_id(obj):
        return obj.lesson.module_id

class SubmissionCreateSchema(Schema):
    lesson_id: uuid.UUID
    student_solution: str
    execution_result: Optional[Any] = None
