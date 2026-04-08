import pytest


@pytest.mark.django_db
def test_groups_flow(admin_client, user_client):
    # Проверяет полный цикл работы с группами: создание, вступление, управление участниками
    resp = admin_client.post(
        "/groups/",
        json={"name": "ФТ-3-1"},
        **admin_client.auth_headers,
    )
    assert resp.status_code == 200
    group_data = resp.json()
    assert group_data["name"] == "ФТ-3-1"
    assert "invite_code" in group_data
    invite_code = group_data["invite_code"]
    group_id = group_data["id"]

    resp = user_client.post(
        "/groups/join",
        json={"invite_code": invite_code},
        **user_client.auth_headers,
    )
    assert resp.status_code == 200

    resp = admin_client.get("/groups/", **admin_client.auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

    resp = admin_client.get(f"/groups/{group_id}/members", **admin_client.auth_headers)
    assert resp.status_code == 200
    members = resp.json()
    assert len(members) == 1
    assert members[0]["telegram_username"] == "test_student"

    user_id = str(user_client.user.id)
    resp = admin_client.post(
        f"/groups/{group_id}/kick/{user_id}",
        **admin_client.auth_headers,
    )
    assert resp.status_code == 200

    resp = admin_client.get(f"/groups/{group_id}/members", **admin_client.auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 0
