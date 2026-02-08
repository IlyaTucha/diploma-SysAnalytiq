import pytest
from app.internal.courses.db.models import Module, Lesson


@pytest.mark.django_db
def test_submission_flow(user_client, admin_client):
    # Проверяет отправку решения студентом и ревью преподавателем
    module = Module.objects.create(title="M1", slug="m1", description="d", color="c", icon="i")
    lesson = Lesson.objects.create(
        module=module, number=1, title="L1", slug="l1", type="practice", content="c"
    )

    resp = user_client.post(
        "/submissions/",
        json={"lesson_id": str(lesson.id), "student_solution": "SELECT * FROM users;"},
        **user_client.auth_headers,
    )
    assert resp.status_code == 200
    sub_data = resp.json()
    assert sub_data["status"] == "pending"
    sub_id = sub_data["id"]

    resp = admin_client.post(
        f"/admin/submissions/{sub_id}/review",
        json={"status": "approved", "feedback": "Good job!"},
        **admin_client.auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "approved"
    assert resp.json()["feedback"] == "Good job!"
