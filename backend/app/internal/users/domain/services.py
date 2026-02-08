from app.internal.users.db.models import User
import requests
from ninja_jwt.tokens import RefreshToken


class UserService:
    @staticmethod
    def get_user_dto(user: User) -> dict:
        return {
            "id": user.id,
            "name": user.name or f"{user.first_name} {user.last_name}".strip(),
            "email": user.email,
            "avatar": user.avatar.url if user.avatar else None,
            "is_admin": user.is_staff or user.is_superuser,
            "group_id": user.group_id
        }

    @staticmethod
    def google_login(token: str):
        try:
            response = requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {token}'}
            )
            data = response.json()
            
            if 'error' in data:
                response = requests.get(f'https://oauth2.googleapis.com/tokeninfo?id_token={token}')
                data = response.json()
            
            if 'email' not in data:
                raise ValueError("Invalid Google Token")
                
            email = data['email']
            
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email,
                    'name': data.get('name', ''),
                }
            )

            refresh = RefreshToken.for_user(user)
            
            return {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserService.get_user_dto(user)
            }
            
        except Exception as e:
            raise ValueError(f"Google Auth Failed: {str(e)}")
