from ninja import Router
from ninja_jwt.authentication import JWTAuth
from ninja.errors import HttpError
from .entities import StatsSchema, ReviewActionSchema
from app.internal.admin.domain.services import AdminService
from app.internal.admin.domain.ai_check_service import AiCheckService
from app.internal.submissions.domain.entities import SubmissionSchema
from app.internal.submissions.db.models import Submission
from typing import List

router = Router()

@router.get("/stats", response=StatsSchema, auth=JWTAuth())
def get_stats(request):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    return AdminService.get_stats()

@router.get("/submissions", response=List[SubmissionSchema], auth=JWTAuth())
def list_all_submissions(request, status: str = None):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    qs = Submission.objects.select_related('student', 'lesson', 'lesson__module').filter(
        student__group__isnull=False
    )
    if status:
        qs = qs.filter(status=status)
    return qs

@router.post("/submissions/{id}/review", response=SubmissionSchema, auth=JWTAuth())
def review_submission(request, id: int, data: ReviewActionSchema):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    inline_comments = [c.dict() for c in data.inline_comments] if data.inline_comments else None
    return AdminService.review_submission(id, request.user, data.status, data.feedback, inline_comments)


@router.post("/submissions/{id}/ai-check", auth=JWTAuth())
def ai_check_submission(request, id: int):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    return AiCheckService.check_submission(id)
