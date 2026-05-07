from django.shortcuts import get_object_or_404
from ninja.errors import HttpError
from app.internal.courses.db.models import Lesson
from ..db.models import Progress


def _can_self_manage(user, lesson) -> bool:
    if lesson.type == 'theory':
        return True
    is_admin = user.is_staff or user.is_superuser
    return is_admin or not user.group_id


class ProgressService:
    @staticmethod
    def get_completed_lessons(user):
        return list(
            Progress.objects.filter(user=user).values_list('lesson_id', flat=True)
        )

    @staticmethod
    def mark_lesson_completed(user, lesson_id):
        lesson = get_object_or_404(Lesson, id=lesson_id)
        if not _can_self_manage(user, lesson):
            raise HttpError(403, "Практическое задание засчитывается только после проверки преподавателем")
        progress, _ = Progress.objects.get_or_create(user=user, lesson=lesson)
        return progress

    @staticmethod
    def unmark_lesson_completed(user, lesson_id):
        lesson = get_object_or_404(Lesson, id=lesson_id)
        if not _can_self_manage(user, lesson):
            raise HttpError(403, "Прогресс по практическому заданию изменяется только преподавателем")
        Progress.objects.filter(user=user, lesson=lesson).delete()
