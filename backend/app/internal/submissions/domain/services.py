from app.internal.submissions.db.models import Submission
from app.internal.courses.db.models import Lesson
from ..domain.entities import SubmissionCreateSchema

class SubmissionService:
    @staticmethod
    def create_submission(user, data: SubmissionCreateSchema):
        lesson = Lesson.objects.get(id=data.lesson_id)
        submission, created = Submission.objects.get_or_create(
            student=user,
            lesson=lesson,
            defaults={'student_solution': data.student_solution}
        )
        if not created:
            submission.student_solution = data.student_solution
            submission.save()
            
        return submission
