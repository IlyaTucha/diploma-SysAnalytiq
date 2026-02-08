from django.shortcuts import get_object_or_404
from app.internal.courses.db.models import Lesson
from ..db.models import Progress


class ProgressService:
    @staticmethod
    def get_completed_lessons(user):
        return list(
            Progress.objects.filter(user=user).values_list('lesson_id', flat=True)
        )

    @staticmethod
    def mark_lesson_completed(user, lesson_id):
        lesson = get_object_or_404(Lesson, id=lesson_id)
        progress, _ = Progress.objects.get_or_create(user=user, lesson=lesson)
        return progress

    @staticmethod
    def unmark_lesson_completed(user, lesson_id):
        Progress.objects.filter(user=user, lesson_id=lesson_id).delete()
