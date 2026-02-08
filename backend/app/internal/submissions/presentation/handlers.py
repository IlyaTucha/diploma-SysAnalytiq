from ninja import Router
from ninja_jwt.authentication import JWTAuth
from ..domain.entities import SubmissionSchema, SubmissionCreateSchema
from ..domain.services import SubmissionService
from ..db.models import Submission
from typing import List

router = Router()

@router.get("/", response=List[SubmissionSchema], auth=JWTAuth())
def list_my_submissions(request):
    return Submission.objects.filter(student=request.user).select_related('lesson', 'lesson__module')

@router.post("/", response=SubmissionSchema, auth=JWTAuth())
def create_submission(request, data: SubmissionCreateSchema):
    return SubmissionService.create_submission(request.user, data)
