from django.core.management.base import BaseCommand
from django.core.management import call_command
from app.internal.users.db.models import User, Group
from app.internal.courses.db.models import Lesson
from app.internal.submissions.db.models import Submission
from app.internal.notifications.db.models import Notification
from app.internal.progress.db.models import Progress


GROUPS = [
    {"name": "ФТ-3-1", "password": "ft31pass"},
    {"name": "ФТ-3-2", "password": "ft32pass"},
    {"name": "КН-3", "password": ""},
]

STUDENTS = [
    {"name": "Иван Иванов", "tg": "ivan_ivanov", "group": "ФТ-3-1"},
    {"name": "Сидор Сидоров", "tg": "sidor_sidorov", "group": "ФТ-3-1"},
    {"name": "Мария Кузнецова", "tg": "maria_kuz", "group": "ФТ-3-1"},
    {"name": "Пётр Петров", "tg": "petr_petrov", "group": "ФТ-3-2"},
    {"name": "Анна Смирнова", "tg": "anna_smirnova", "group": "ФТ-3-2"},
    {"name": "Алексей Попов", "tg": "alex_popov", "group": "КН-3"},
    {"name": "Ольга Васильева", "tg": "olga_vasilyeva", "group": "КН-3"},
]


class Command(BaseCommand):
    help = "Seed full demo: modules, lessons, groups, students, submissions, progress"

    def handle(self, *args, **options):
        # 1. Ensure modules + lessons exist
        self.stdout.write("Ensuring modules and lessons exist...")
        call_command("seed_lessons", stdout=self.stdout)

        # 2. Groups
        self.stdout.write("\nCreating groups...")
        groups = {}
        for g in GROUPS:
            obj, created = Group.objects.get_or_create(
                name=g["name"],
                defaults={"password": g.get("password", "")},
            )
            if not created and not obj.password and g.get("password"):
                obj.password = g["password"]
                obj.save(update_fields=["password"])
            groups[g["name"]] = obj
            self.stdout.write(
                f"  Group {g['name']}: {'created' if created else 'exists'}"
            )

        # 3. Students
        self.stdout.write("\nCreating students...")
        students = {}
        for idx, s in enumerate(STUDENTS):
            dummy_id = 900000000 + idx
            user, created = User.objects.get_or_create(
                telegram_username=s["tg"],
                defaults={
                    "username": s["tg"],
                    "name": s["name"],
                    "telegram_id": dummy_id,
                    "first_name": s["name"].split()[0],
                    "last_name": " ".join(s["name"].split()[1:]),
                    "group": groups[s["group"]],
                },
            )
            if not created and user.group != groups[s["group"]]:
                user.group = groups[s["group"]]
                user.save(update_fields=["group"])
            students[s["tg"]] = user
            self.stdout.write(
                f"  Student {s['name']}: {'created' if created else 'exists'}"
            )

        # 4. Admin
        admin, created = User.objects.get_or_create(
            username="admin_sysanalytiq",
            defaults={
                "telegram_username": "admin_sysanalytiq",
                "telegram_id": 100000000,
                "first_name": "Админ",
                "last_name": "Админович",
                "name": "Администратор",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            admin.set_password("admin")
            admin.save()
        self.stdout.write(
            f"  Admin: {'created' if created else 'exists'}"
        )

        # 5. Collect existing lessons from DB
        lessons = {l.slug: l for l in Lesson.objects.all()}

        # 6. Submissions
        self.stdout.write("\nCreating submissions...")
        self._create_submissions(students, lessons, admin)

        # 7. Progress
        self.stdout.write("\nCreating progress...")
        self._create_progress(students, lessons)

        self.stdout.write(self.style.SUCCESS("\nDemo submissions seeding complete!"))

    def _create_submissions(self, students, lessons, admin):
        sql_select = lessons.get("sql-select")
        sql_where = lessons.get("sql-where")
        erd_entities = lessons.get("erd-entities")

        sample_submissions = []
        if sql_select:
            sample_submissions.append({
                "student": students["ivan_ivanov"],
                "lesson": sql_select,
                "status": "approved",
                "student_solution": "SELECT name, email FROM users;",
                "feedback": "Отлично! Верное решение.",
            })
            sample_submissions.append({
                "student": students["petr_petrov"],
                "lesson": sql_select,
                "status": "pending",
                "student_solution": "SELECT * FROM users",
            })
        if sql_where:
            sample_submissions.append({
                "student": students["anna_smirnova"],
                "lesson": sql_where,
                "status": "rejected",
                "student_solution": "SELECT * FROM users WHERE age = 18;",
                "feedback": "Нужно выбрать пользователей из Москвы, а не по возрасту.",
            })
            sample_submissions.append({
                "student": students["ivan_ivanov"],
                "lesson": sql_where,
                "status": "pending",
                "student_solution": "SELECT * FROM users WHERE city = 'Москва';",
            })
        if erd_entities:
            sample_submissions.append({
                "student": students["maria_kuz"],
                "lesson": erd_entities,
                "status": "pending",
                "student_solution": (
                    "Table books {\n    id int [pk]\n    title varchar\n"
                    "    author varchar\n}\n\nTable readers {\n    id int [pk]\n"
                    "    name varchar\n}\n\nTable loans {\n    id int [pk]\n"
                    "    book_id int [ref: > books.id]\n"
                    "    reader_id int [ref: > readers.id]\n}"
                ),
            })

        for sub_data in sample_submissions:
            exists = Submission.objects.filter(
                student=sub_data["student"],
                lesson=sub_data["lesson"],
            ).exists()
            if not exists:
                sub = Submission.objects.create(
                    student=sub_data["student"],
                    lesson=sub_data["lesson"],
                    status=sub_data["status"],
                    student_solution=sub_data["student_solution"],
                    feedback=sub_data.get("feedback", ""),
                )
                if sub_data["status"] in ("approved", "rejected"):
                    Notification.objects.create(
                        user=sub_data["student"],
                        reviewer=admin,
                        submission=sub,
                        type=sub_data["status"],
                        message=sub_data.get("feedback", ""),
                        module_name=sub.lesson.module.title,
                        lesson_title=sub.lesson.title,
                        lesson_path=f"/modules/{sub.lesson.module.slug}/{sub.lesson.id}",
                    )
                self.stdout.write(
                    f"  Submission {sub_data['student'].name} -> "
                    f"{sub_data['lesson'].title}: created"
                )
            else:
                self.stdout.write(
                    f"  Submission {sub_data['student'].name} -> "
                    f"{sub_data['lesson'].title}: exists"
                )

    def _create_progress(self, students, lessons):
        pairs = [
            ("ivan_ivanov", "sql-intro"),
            ("ivan_ivanov", "sql-select"),
            ("petr_petrov", "sql-intro"),
            ("anna_smirnova", "sql-intro"),
            ("anna_smirnova", "sql-select"),
            ("maria_kuz", "erd-basics"),
            ("alex_popov", "bpmn-intro"),
            ("olga_vasilyeva", "plantuml-intro"),
            ("sidor_sidorov", "swagger-intro"),
        ]
        for tg, slug in pairs:
            student = students.get(tg)
            lesson = lessons.get(slug)
            if student and lesson:
                _, created = Progress.objects.get_or_create(
                    user=student, lesson=lesson
                )
                status = "created" if created else "exists"
                self.stdout.write(
                    f"  Progress {student.name} -> {lesson.title}: {status}"
                )
