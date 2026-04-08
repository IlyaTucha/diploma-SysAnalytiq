from app.internal.submissions.db.models import Submission
from app.internal.courses.db.models import Lesson
from app.internal.notifications.db.models import Notification
from app.internal.progress.db.models import Progress
from app.internal.telegram.service import TelegramService
from django.utils import timezone
from ..domain.entities import SubmissionCreateSchema

class SubmissionService:
    @staticmethod
    def create_submission(user, data: SubmissionCreateSchema):
        lesson = Lesson.objects.select_related('module').get(id=data.lesson_id)
        submission, created = Submission.objects.get_or_create(
            student=user,
            lesson=lesson,
            defaults={
                'student_solution': data.student_solution,
                'execution_result': data.execution_result,
            }
        )
        is_admin = user.is_staff or user.is_superuser

        if not created:
            was_rejected = submission.status == 'rejected'
            was_pending = submission.status == 'pending'
            submission.student_solution = data.student_solution
            submission.execution_result = data.execution_result
            submission.status = 'approved' if is_admin else 'pending'
            submission.submitted_date = timezone.now()
            submission.save()

            if is_admin:
                # Админ — автоматически принимаем, без уведомлений
                Progress.objects.get_or_create(user=user, lesson=lesson)
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
