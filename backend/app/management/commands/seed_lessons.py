from django.core.management.base import BaseCommand
from django.core.management import call_command
from app.internal.courses.db.models import Module, Lesson
from .lessons import (
    SQL_LESSONS,
    ERD_LESSONS,
    BPMN_LESSONS,
    PLANTUML_LESSONS,
    SWAGGER_LESSONS,
)


LESSONS_BY_MODULE = {
    "sql": SQL_LESSONS,
    "erd": ERD_LESSONS,
    "bpmn": BPMN_LESSONS,
    "plantuml": PLANTUML_LESSONS,
    "swagger": SWAGGER_LESSONS,
}


class Command(BaseCommand):
    help = "Seed modules and their lessons (theory + practice with auto-check configs)"

    def handle(self, *args, **options):
        # Ensure modules exist first
        self.stdout.write("Ensuring modules exist...")
        call_command("seed_modules", stdout=self.stdout)

        self.stdout.write("\nCreating lessons...")
        for module_slug, module_lessons in LESSONS_BY_MODULE.items():
            try:
                module = Module.objects.get(slug=module_slug)
            except Module.DoesNotExist:
                self.stdout.write(self.style.WARNING(
                    f"  Module {module_slug} not found, skipping"
                ))
                continue
            for ldata in module_lessons:
                lesson, created = Lesson.objects.update_or_create(
                    slug=ldata["slug"],
                    defaults={
                        "module": module,
                        "number": ldata["number"],
                        "title": ldata["title"],
                        "type": ldata["type"],
                        "content": ldata["content"],
                        "initial_code": ldata.get("initial_code", ""),
                        "correct_answer": ldata.get("correct_answer", ""),
                        "hint": ldata.get("hint", ""),
                        "published": True,
                    },
                )
                self.stdout.write(
                    f"  Lesson {ldata['title']}: {'created' if created else 'updated'}"
                )

        self.stdout.write(self.style.SUCCESS("Lessons seeding complete!"))
