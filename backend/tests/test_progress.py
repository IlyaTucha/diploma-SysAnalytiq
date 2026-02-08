import pytest
from app.internal.courses.db.models import Module, Lesson


@pytest.mark.django_db
def test_progress_flow(user_client):
    # Проверяет отметку уроков завершёнными и снятие отметки
    module = Module.objects.create(title="SQL", slug="sql", description="d", color="c", icon="i")
    lesson = Lesson.objects.create(
        module=module, number=1, title="L1", slug="l1", type="theory", content="c"
    )

    resp = user_client.get("/progress/", **user_client.auth_headers)
    assert resp.status_code == 200
    assert resp.json()["completed_lessons"] == []

    resp = user_client.post(f"/progress/{lesson.id}/complete", **user_client.auth_headers)
    assert resp.status_code == 200

    resp = user_client.get("/progress/", **user_client.auth_headers)
    assert resp.status_code == 200
    assert str(lesson.id) in [str(lid) for lid in resp.json()["completed_lessons"]]

    resp = user_client.delete(f"/progress/{lesson.id}/complete", **user_client.auth_headers)
    assert resp.status_code == 200

    resp = user_client.get("/progress/", **user_client.auth_headers)
    assert resp.status_code == 200
    assert resp.json()["completed_lessons"] == []
