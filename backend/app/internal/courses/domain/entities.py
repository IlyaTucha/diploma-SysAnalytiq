from ninja import Schema
from typing import Optional, List
import uuid


class ModuleSchema(Schema):
    id: int
    title: str
    slug: str
    description: str
    color: str
    icon: str
    published: bool


class LessonSchema(Schema):
    id: uuid.UUID
    module_id: int
    number: int
    title: str
    type: str
    slug: str
    content: str
    initial_code: Optional[str] = None
    correct_answer: Optional[str] = None
    hint: Optional[str] = None
    published: bool

    @staticmethod
    def resolve_module_id(obj):
        return obj.module_id


class ModuledDetailSchema(ModuleSchema):
    lessons: List[LessonSchema]


class LessonCreateSchema(Schema):
    module_id: int
    number: int
    title: str
    type: str
    content: str
    initial_code: Optional[str] = None
    correct_answer: Optional[str] = None
    hint: Optional[str] = None
    published: bool = False


class LessonUpdateSchema(Schema):
    title: Optional[str] = None
    slug: Optional[str] = None
    number: Optional[int] = None
    type: Optional[str] = None
    content: Optional[str] = None
    initial_code: Optional[str] = None
    correct_answer: Optional[str] = None
    hint: Optional[str] = None
    published: Optional[bool] = None


class ModuleUpdateSchema(Schema):
    title: Optional[str] = None
    description: Optional[str] = None
    published: Optional[bool] = None


class LessonReorderSchema(Schema):
    lesson_ids: List[str]

