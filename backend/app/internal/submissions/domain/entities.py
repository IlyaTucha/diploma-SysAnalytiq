from ninja import Schema
from typing import Optional, Any
from datetime import datetime
import uuid

class SubmissionSchema(Schema):
    id: int
    student_id: uuid.UUID
    lesson_id: uuid.UUID
    module_id: int
    status: str
    submitted_date: datetime
    student_solution: str
    execution_result: Optional[Any] = None
    feedback: Optional[str] = None
    
    @staticmethod
    def resolve_student_id(obj):
        return obj.student_id

    @staticmethod
    def resolve_lesson_id(obj):
        return obj.lesson_id
    
    @staticmethod
    def resolve_module_id(obj):
        return obj.lesson.module_id

class SubmissionCreateSchema(Schema):
    lesson_id: uuid.UUID
    student_solution: str
