from app.internal.submissions.db.models import Submission
from app.internal.courses.db.models import Lesson
from app.internal.notifications.db.models import Notification
from app.internal.progress.db.models import Progress
from app.internal.telegram.service import TelegramService
from django.utils import timezone
from ..domain.entities import SubmissionCreateSchema

class SubmissionService:
    @staticmethod
    def _append_self_practice_entry(submission, user, solution, execution_result):
        history = submission.review_history or []
        history.append({
            'status': 'approved',
            'feedback': '',
            'reviewer_name': user.display_name,
            'reviewed_at': timezone.now().isoformat(),
            'inline_comments': [],
            'student_solution': solution or '',
            'execution_result': execution_result,
            'is_self_practice': True,
        })
        submission.review_history = history

    @staticmethod
    def create_submission(user, data: SubmissionCreateSchema):
        lesson = Lesson.objects.select_related('module').get(id=data.lesson_id)
        submission, created = Submission.objects.get_or_create(
            student=user,
            lesson=lesson,
            defaults={
                'student_solution': data.student_solution,
                'execution_result': data.execution_result,
                'student_display_name': user.display_name,
            }
        )
        is_admin = user.is_staff or user.is_superuser

        if not created:
            was_rejected = submission.status == 'rejected'
            was_pending = submission.status == 'pending'
            was_approved = submission.status == 'approved'
            submission.student_solution = data.student_solution
            submission.execution_result = data.execution_result
            submission.student_display_name = user.display_name

            if was_approved and not is_admin:
                # Самостоятельная практика — статус остаётся approved,
                # уведомления преподавателю не отправляются.
                # Пополняем список решений student_history-записью внутри review_history.
                SubmissionService._append_self_practice_entry(
                    submission, user, data.student_solution, data.execution_result,
                )
            else:
                submission.status = 'approved' if is_admin else 'pending'

            submission.submitted_date = timezone.now()
            submission.save()

            if is_admin:
                # Админ — автоматически принимаем, без уведомлений
                Progress.objects.get_or_create(user=user, lesson=lesson)
            elif was_approved:
                # Самостоятельная переотправка — никого не уведомляем,
                # прогресс сохраняется
                pass
            elif was_rejected:
                # Повторная отправка после доработки — обновляем уведомление
                Notification.objects.filter(
                    user=user,
                    submission=submission,
                    type='rejected'
                ).update(type='pending')
                # Убираем прогресс
                if user.group:
                    Progress.objects.filter(user=user, lesson=lesson).delete()
                # Telegram-уведомление админам о повторной отправке
                try:
                    TelegramService.notify_admins_new_submission(submission, is_resubmission=True)
                except Exception:
                    pass
            elif was_pending:
                # Просто обновление решения, пока ещё не проверено — без уведомления
                pass
        else:
            if is_admin:
                # Админ — автоматически принимаем, без уведомлений
                submission.status = 'approved'
                submission.save()
                Progress.objects.get_or_create(user=user, lesson=lesson)
            else:
                # Первая отправка — Telegram-уведомление админам
                try:
                    TelegramService.notify_admins_new_submission(submission, is_resubmission=False)
                except Exception:
                    pass

        return submission
