from django.core.management.base import BaseCommand
from app.internal.courses.db.models import Module

MODULES = [
    {
        "title": "SQL",
        "slug": "sql",
        "description": "Создание и выполнение SQL запросов",
        "color": "#10B981",
        "icon": "database",
    },
    {
        "title": "ERD",
        "slug": "erd",
        "description": "Проектирование ER-диаграмм баз данных",
        "color": "#EC4899",
        "icon": "git-branch",
    },
    {
        "title": "BPMN",
        "slug": "bpmn",
        "description": "Моделирование бизнес-процессов в нотации BPMN",
        "color": "#8B5CF6",
        "icon": "workflow",
    },
    {
        "title": "PlantUML",
        "slug": "plantuml",
        "description": "Создание диаграмм с помощью PlantUML",
        "color": "#F59E0B",
        "icon": "code",
    },
    {
        "title": "Swagger",
        "slug": "swagger",
        "description": "Описание API с помощью Swagger/OpenAPI",
        "color": "#06B6D4",
        "icon": "file-text",
    },
]


class Command(BaseCommand):
    help = "Seed the 5 fixed course modules (SQL, ERD, BPMN, PlantUML, Swagger)"

    def handle(self, *args, **options):
        for m in MODULES:
            _, created = Module.objects.update_or_create(slug=m["slug"], defaults={
                k: v for k, v in m.items() if k != "slug"
            })
            status = "created" if created else "updated"
            self.stdout.write(f"  {m['title']}: {status}")
        self.stdout.write(self.style.SUCCESS("Done."))
