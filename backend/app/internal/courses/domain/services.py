from app.internal.courses.db.models import Module, Lesson
from django.shortcuts import get_object_or_404
from django.utils.text import slugify


class EducationService:
    @staticmethod
    def get_all_modules():
        return Module.objects.all()

    @staticmethod
    def get_module_by_slug(slug: str):
        return get_object_or_404(Module.objects.prefetch_related('lessons'), slug=slug)

    @staticmethod
    def get_lesson(slug: str):
        return get_object_or_404(Lesson.objects.select_related('module'), slug=slug)

    @staticmethod
    def get_lessons_by_module(module_slug: str):
        module = get_object_or_404(Module, slug=module_slug)
        return Lesson.objects.filter(module=module).order_by('number')

    @staticmethod
    def create_lesson(data):
        module = get_object_or_404(Module, id=data.module_id)
        base_slug = slugify(data.title)
        slug = base_slug
        counter = 1
        while Lesson.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        lesson = Lesson.objects.create(
            module=module,
            number=data.number,
            title=data.title,
            slug=slug,
            type=data.type,
            content=data.content,
            initial_code=data.initial_code,
            correct_answer=data.correct_answer,
            hint=data.hint,
            published=data.published
        )
        return lesson

    @staticmethod
    def update_lesson(lesson_slug, data):
        lesson = get_object_or_404(Lesson, slug=lesson_slug)
        for attr, value in data.dict(exclude_unset=True).items():
            setattr(lesson, attr, value)
        lesson.save()
        return lesson

    @staticmethod
    def delete_lesson(lesson_slug):
        lesson = get_object_or_404(Lesson, slug=lesson_slug)
        lesson.delete()

