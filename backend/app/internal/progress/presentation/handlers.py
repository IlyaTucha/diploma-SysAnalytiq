from ninja import Router
from ninja_jwt.authentication import JWTAuth
from ..domain.services import ProgressService
from ..domain.entities import ProgressSchema, CompletedLessonsSchema

router = Router()


@router.get("/", response=CompletedLessonsSchema, auth=JWTAuth())
def get_progress(request):
    lessons = ProgressService.get_completed_lessons(request.user)
    return {"completed_lessons": lessons}


@router.post("/{lesson_id}/complete", response=ProgressSchema, auth=JWTAuth())
def complete_lesson(request, lesson_id: str):
    return ProgressService.mark_lesson_completed(request.user, lesson_id)


@router.delete("/{lesson_id}/complete", auth=JWTAuth())
def uncomplete_lesson(request, lesson_id: str):
    ProgressService.unmark_lesson_completed(request.user, lesson_id)
    return {"success": True}
