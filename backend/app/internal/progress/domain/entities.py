from ninja import Schema
from datetime import datetime
from typing import List
import uuid


class ProgressSchema(Schema):
    lesson_id: uuid.UUID
    completed_at: datetime

class CompletedLessonsSchema(Schema):
    completed_lessons: List[uuid.UUID]
