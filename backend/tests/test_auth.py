import pytest
from unittest.mock import patch, MagicMock

@pytest.mark.django_db
def test_google_login_success(api_client):
    # Проверяет успешный вход через Google OAuth
    with patch('app.internal.users.domain.services.requests.get') as mock_get:
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "email": "newuser@example.com",
            "name": "New User",
            "picture": "http://img.com/a.jpg"
        }
        mock_get.return_value = mock_response

        response = api_client.post(
            "/auth/google",
            json={"token": "valid_google_token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "access" in data
        assert "refresh" in data
        assert data["user"]["email"] == "newuser@example.com"

@pytest.mark.django_db
def test_me_endpoint(user_client):
    # Проверяет получение данных текущего пользователя
    response = user_client.get(
        "/auth/me",
        **user_client.auth_headers
    )
    assert response.status_code == 200
    assert response.json()["email"] == "student@example.com"

@pytest.mark.django_db
def test_me_unauthorized(api_client):
    # Проверяет отказ в доступе без авторизации
    response = api_client.get("/auth/me")
    assert response.status_code == 401
