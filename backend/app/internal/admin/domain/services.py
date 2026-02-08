from app.internal.users.db.models import User
from app.internal.submissions.db.models import Submission
from app.internal.notifications.db.models import Notification


class AdminService:
    @staticmethod
    def get_stats():
        return {
            "total_students": User.objects.filter(is_staff=False).count(),
            "total_submissions": Submission.objects.count(),
            "pending_reviews": Submission.objects.filter(status='pending').count()
        }

    @staticmethod
    def review_submission(submission_id, reviewer, status, feedback=None):
        submission = Submission.objects.select_related('lesson__module', 'student').get(id=submission_id)
        submission.status = status
        submission.feedback = feedback
        submission.save()

        Notification.objects.create(
            user=submission.student,
            reviewer=reviewer,
            submission=submission,
            type=status,
            message=feedback or "",
            module_name=submission.lesson.module.title,
            lesson_title=submission.lesson.title,
            lesson_path=f"/modules/{submission.lesson.module.slug}/{submission.lesson.id}"
        )
        return submission
