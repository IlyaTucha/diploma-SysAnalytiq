import logging
from django.utils import timezone
from app.internal.users.db.models import User
from app.internal.submissions.db.models import Submission
from app.internal.notifications.db.models import Notification
from app.internal.progress.db.models import Progress
from app.internal.telegram.service import TelegramService

logger = logging.getLogger(__name__)


class AdminService:
    @staticmethod
    def get_stats():
        return {
            "total_students": User.objects.filter(is_staff=False).count(),
            "total_submissions": Submission.objects.count(),
            "pending_reviews": Submission.objects.filter(status='pending', student__group__isnull=False).count()
        }

    @staticmethod
    def review_submission(submission_id, reviewer, status, feedback=None, inline_comments=None):
        submission = Submission.objects.select_related('lesson__module', 'student').get(id=submission_id)
        submission.status = status
        submission.feedback = feedback

        # Сохраняем историю проверок
        history = submission.review_history or []
        history.append({
            'status': status,
            'feedback': feedback or '',
            'reviewer_name': reviewer.display_name,
            'reviewed_at': timezone.now().isoformat(),
            'inline_comments': inline_comments or [],
            'student_solution': submission.student_solution or '',
            'execution_result': submission.execution_result,
        })
        submission.review_history = history
        submission.save()

        # Удаляем старые уведомления для этого задания
        Notification.objects.filter(
            user=submission.student,
            submission=submission,
        ).delete()

        first_comment = inline_comments[0] if inline_comments else None

        Notification.objects.create(
            user=submission.student,
            reviewer=reviewer,
            submission=submission,
            type=status,
            message=feedback or "",
            module_name=submission.lesson.module.title,
            lesson_title=submission.lesson.title,
            lesson_path=f"/modules/{submission.lesson.module.slug}/{submission.lesson.id}",
            highlighted_code=first_comment['highlighted_text'] if first_comment else '',
            inline_comment=first_comment['text'] if first_comment else '',
            start_line=first_comment['line_start'] if first_comment else None,
            end_line=first_comment['line_end'] if first_comment else None,
            inline_comments=inline_comments or [],
        )

        # При принятии работы автоматически отмечаем прогресс
        if status == 'approved':
            Progress.objects.get_or_create(
                user=submission.student,
                lesson=submission.lesson
            )

        # Telegram-уведомление студенту
        try:
            TelegramService.notify_student_review(
                submission=submission,
                status=status,
                feedback=feedback,
                inline_comments=inline_comments,
                reviewer=reviewer,
            )
        except Exception as e:
            logger.error(f"Telegram notify_student_review error: {e}")

        return submission
