import pytest
from unittest.mock import patch

from app.internal.users.db.models import User

@pytest.mark.django_db
@patch("app.internal.users.domain.services.UserService._vk_get_user_info")
def test_vk_login_success(mock_vk_user_info, api_client):
    # Проверяет успешный вход через VK
    mock_vk_user_info.return_value = {
        "user_id": "123456789",
        "first_name": "Иван",
        "last_name": "Петров",
        "avatar": "https://vk.com/images/ava.jpg",
    }

    response = api_client.post(
        "/auth/vk",
        json={"access_token": "fake_vk_token"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access" in data
    assert "refresh" in data
    assert data["user"]["first_name"] == "Иван"
    assert data["user"]["last_name"] == "Петров"
    assert data["user"]["vk_profile_url"] == "https://vk.com/id123456789"

@pytest.mark.django_db
@patch("app.internal.users.domain.services.UserService._vk_get_user_info")
def test_vk_login_updates_existing_user(mock_vk_user_info, api_client):
    # Проверяет, что повторный вход обновляет данные существующего VK-пользователя
    existing_user = User.objects.create_user(
        username="vk_111222333",
        password="password123",
        vk_id=111222333,
        first_name="",
        last_name="",
        avatar_url="https://vk.com/old_avatar.jpg",
        vk_profile_url="https://vk.com/id111222333",
        name="",
    )

    mock_vk_user_info.return_value = {
        "user_id": "111222333",
        "first_name": "Алексей",
        "last_name": "Сидоров",
        "avatar": "https://vk.com/new_avatar.jpg",
    }

    response = api_client.post(
        "/auth/vk",
        json={"access_token": "fake_vk_token"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user"]["id"] == str(existing_user.id)
    assert data["user"]["first_name"] == "Алексей"
    assert data["user"]["last_name"] == "Сидоров"
    assert data["user"]["avatar"] == "https://vk.com/new_avatar.jpg"
    assert User.objects.filter(vk_id=111222333).count() == 1

@pytest.mark.django_db
def test_me_endpoint(user_client):
    # Проверяет получение данных текущего пользователя
    response = user_client.get(
        "/auth/me",
        **user_client.auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "telegram_username" in data

@pytest.mark.django_db
def test_me_unauthorized(api_client):
    # Проверяет отказ в доступе без авторизации
    response = api_client.get("/auth/me")
    assert response.status_code == 401

@pytest.mark.django_db
def test_update_profile(user_client):
    # Проверяет обновление ФИО
    response = user_client.put(
        "/auth/me",
        json={"first_name": "Новое Имя", "last_name": "Новая Фамилия"},
        **user_client.auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Новое Имя"
    assert data["last_name"] == "Новая Фамилия"
