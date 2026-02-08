import pytest
from app.internal.notifications.db.models import Notification

@pytest.mark.django_db
def test_notification_flow(user_client, test_user):
    # Проверяет получение, отметку прочитанным и массовую отметку уведомлений
    notif = Notification.objects.create(
        user=test_user,
        type="info",
        message="Welcome!",
        module_name="Intro",
        lesson_title="Lesson 1"
    )

    resp = user_client.get("/notifications/", **user_client.auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["id"] == str(notif.id)
    assert data[0]["is_read"] is False

    resp = user_client.post(
        f"/notifications/{notif.id}/read",
        **user_client.auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["is_read"] is True

    notif.refresh_from_db()
    assert notif.is_read is True

    Notification.objects.create(
        user=test_user,
        type="rejected",
        message="Try again"
    )

    resp = user_client.post(
        "/notifications/read-all",
        **user_client.auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True

    assert Notification.objects.filter(user=test_user, is_read=False).count() == 0
