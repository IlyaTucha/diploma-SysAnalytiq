from app.internal.courses.db.models import Module, Lesson
from django.shortcuts import get_object_or_404
from django.utils.text import slugify
import uuid as uuid_mod


def _find_lesson(identifier: str) -> Lesson:
    """Ищет урок по slug, а если не найден — пробует по UUID."""
    lesson = Lesson.objects.filter(slug=identifier).first()
    if lesson:
        return lesson
    try:
        uid = uuid_mod.UUID(identifier)
        lesson = Lesson.objects.filter(id=uid).first()
    except (ValueError, AttributeError):
        pass
    if lesson:
        return lesson
    return get_object_or_404(Lesson, slug=identifier)


class EducationService:
    @staticmethod
    def get_all_modules():
        return Module.objects.all()

    @staticmethod
    def get_module_by_slug(slug: str):
        return get_object_or_404(Module.objects.prefetch_related('lessons'), slug=slug)

    @staticmethod
    def get_lesson(slug: str):
        return _find_lesson(slug)

    @staticmethod
    def get_lessons_by_module(module_slug: str):
        module = get_object_or_404(Module, slug=module_slug)
        return Lesson.objects.filter(module=module).order_by('number')

    @staticmethod
    def create_lesson(data):
        module = get_object_or_404(Module, id=data.module_id)
        base_slug = slugify(data.title, allow_unicode=True)
        if not base_slug:
            base_slug = str(uuid_mod.uuid4())[:8]
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
        lesson = _find_lesson(lesson_slug)
        for attr, value in data.dict(exclude_unset=True).items():
            setattr(lesson, attr, value)
        lesson.save()
        return lesson

    @staticmethod
    def delete_lesson(lesson_slug):
        lesson = _find_lesson(lesson_slug)
        lesson.delete()

    @staticmethod
    def update_module(slug, data):
        module = Module.objects.get(slug=slug)
        if data.title is not None:
            module.title = data.title
        if data.description is not None:
            module.description = data.description
        if data.published is not None:
            module.published = data.published
        module.save()
        return module

    @staticmethod
    def reorder_lessons(module_slug, lesson_ids):
        module = get_object_or_404(Module, slug=module_slug)
        lessons = Lesson.objects.filter(module=module)
        lesson_map = {str(l.id): l for l in lessons}
        for i, lid in enumerate(lesson_ids, start=1):
            lesson = lesson_map.get(lid)
            if lesson:
                lesson.number = i
                lesson.save(update_fields=['number'])
        return Lesson.objects.filter(module=module).order_by('number')

