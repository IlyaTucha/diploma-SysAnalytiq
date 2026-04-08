import pytest
import os
os.environ["NINJA_SKIP_REGISTRY"] = "True"
from app.internal.users.db.models import User
from ninja_jwt.tokens import RefreshToken

@pytest.fixture
def api_client():
    from ninja.testing import TestClient
    from app.internal.app import api
    return TestClient(api)

@pytest.fixture
def user_client(db):
    from ninja.testing import TestClient
    from app.internal.app import api
    
    user = User.objects.create_user(
        username="test_student",
        password="password123",
        telegram_id=100000001,
        telegram_username="test_student",
    )
    client = TestClient(api)
    
    # Generate Token
    token = str(RefreshToken.for_user(user).access_token)
    
    # In Django Ninja TestClient, we usually pass auth headers in the request method
    # But checking docs, we might need to wrap the client or just pass headers manually
    # Let's attach the token to the client object for valid usage
    client.auth_headers = {'headers': {'Authorization': f'Bearer {token}'}}
    client.user = user
    return client

@pytest.fixture
def test_user(user_client):
    """Returns the user object from user_client fixture"""
    return user_client.user

@pytest.fixture
def admin_client(db):
    from ninja.testing import TestClient
    from app.internal.app import api
    
    user = User.objects.create_superuser(
        username="test_admin",
        password="password123",
        telegram_id=100000002,
        telegram_username="test_admin",
    )
    client = TestClient(api)
    token = str(RefreshToken.for_user(user).access_token)
    client.auth_headers = {'headers': {'Authorization': f'Bearer {token}'}}
    client.user = user
    return client
