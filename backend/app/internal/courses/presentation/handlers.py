from ninja import Router
from typing import List
from ninja.errors import HttpError
from ..domain.entities import (
    ModuleSchema, ModuledDetailSchema, LessonSchema,
    LessonCreateSchema, LessonUpdateSchema, ModuleUpdateSchema, LessonReorderSchema
)
from ..domain.services import EducationService
from ninja_jwt.authentication import JWTAuth

router = Router()


@router.get("/modules", response=List[ModuleSchema])
def list_modules(request):
    return EducationService.get_all_modules()


@router.get("/modules/{slug}", response=ModuledDetailSchema)
def get_module(request, slug: str):
    return EducationService.get_module_by_slug(slug)


@router.put("/modules/{slug}", response=ModuleSchema, auth=JWTAuth())
def update_module(request, slug: str, data: ModuleUpdateSchema):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    return EducationService.update_module(slug, data)


@router.get("/modules/{slug}/lessons", response=List[LessonSchema])
def get_module_lessons(request, slug: str):
    return EducationService.get_lessons_by_module(slug)


@router.get("/lessons/{slug}", response=LessonSchema)
def get_lesson(request, slug: str):
    return EducationService.get_lesson(slug)


@router.post("/lessons", response=LessonSchema, auth=JWTAuth())
def create_lesson(request, data: LessonCreateSchema):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    return EducationService.create_lesson(data)


@router.put("/lessons/{slug}", response=LessonSchema, auth=JWTAuth())
def update_lesson(request, slug: str, data: LessonUpdateSchema):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    return EducationService.update_lesson(slug, data)


@router.delete("/lessons/{slug}", auth=JWTAuth())
def delete_lesson(request, slug: str):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    return EducationService.delete_lesson(slug)


@router.post("/modules/{slug}/reorder", response=List[LessonSchema], auth=JWTAuth())
def reorder_lessons(request, slug: str, data: LessonReorderSchema):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    return EducationService.reorder_lessons(slug, data.lesson_ids)

