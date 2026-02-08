import pytest
from app.internal.courses.db.models import Module


@pytest.mark.django_db
def test_list_modules(user_client):
    # Проверяет получение списка модулей
    Module.objects.create(title="SQL", slug="sql", description="Learn SQL", color="#10B981", icon="database")
    response = user_client.get("/modules")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["title"] == "SQL"


@pytest.mark.django_db
def test_create_lesson_flow(admin_client):
    # Проверяет создание, чтение и обновление урока
    module = Module.objects.create(title="Test Mod", slug="test-mod", description="d", color="c", icon="i")

    lesson_payload = {
        "module_id": module.id,
        "number": 1,
        "title": "Intro to Select",
        "type": "theory",
        "content": "# Hello",
    }

    resp = admin_client.post("/lessons", json=lesson_payload, **admin_client.auth_headers)
    assert resp.status_code == 200
    lesson_data = resp.json()
    assert lesson_data["title"] == "Intro to Select"
    slug = lesson_data["slug"]

    resp = admin_client.get(f"/lessons/{slug}")
    assert resp.status_code == 200
    assert resp.json()["id"] == lesson_data["id"]

    resp = admin_client.put(
        f"/lessons/{slug}",
        json={"title": "Intro to Select Updated"},
        **admin_client.auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Intro to Select Updated"
