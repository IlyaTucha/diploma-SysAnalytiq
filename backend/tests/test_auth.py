import pytest
from unittest.mock import patch, MagicMock

@pytest.mark.django_db
def test_telegram_login_success(api_client):
    # Проверяет успешный вход через Telegram
    response = api_client.post(
        "/auth/telegram",
        json={
            "id": 123456789,
            "first_name": "Иван",
            "last_name": "Петров",
            "username": "ivan_petrov",
            "photo_url": "https://t.me/i/userpic/123.jpg",
            "auth_date": 1700000000,
            "hash": "fakehash"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert "access" in data
    assert "refresh" in data
    assert data["user"]["telegram_username"] == "ivan_petrov"
    assert data["user"]["first_name"] == "Иван"

@pytest.mark.django_db
def test_telegram_login_updates_existing_user(api_client):
    # Проверяет, что повторный вход обновляет данные
    # Первый вход
    api_client.post(
        "/auth/telegram",
        json={
            "id": 111222333,
            "first_name": "Алексей",
            "last_name": "",
            "username": "alex",
            "photo_url": "",
            "auth_date": 1700000000,
            "hash": "fakehash"
        }
    )
    # Повторный вход с обновлёнными данными
    response = api_client.post(
        "/auth/telegram",
        json={
            "id": 111222333,
            "first_name": "Алексей",
            "last_name": "Сидоров",
            "username": "alex_new",
            "photo_url": "https://t.me/photo.jpg",
            "auth_date": 1700000001,
            "hash": "fakehash"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user"]["telegram_username"] == "alex_new"
    assert data["user"]["last_name"] == "Сидоров"

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
