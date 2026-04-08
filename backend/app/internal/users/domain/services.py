import hashlib
import hmac
import logging
import time

from django.conf import settings
from ninja_jwt.tokens import RefreshToken

from app.internal.users.db.models import User
from app.internal.submissions.db.models import Submission

logger = logging.getLogger(__name__)

TELEGRAM_AUTH_EXPIRY_SECONDS = 86400


class UserService:
    @staticmethod
    def get_user_dto(user: User) -> dict:
        return {
            "id": user.id,
            "name": user.display_name,
            "first_name": user.first_name or "",
            "last_name": user.last_name or "",
            "telegram_username": user.telegram_username or "",
            "telegram_notifications": user.telegram_notifications,
            "avatar": user.avatar_url or None,
            "is_admin": user.is_staff or user.is_superuser,
            "group_id": user.group_id,
            "group_name": user.group.name if user.group_id else None
        }

    @staticmethod
    def verify_telegram_data(data: dict) -> bool:
        """Проверяет подпись данных от Telegram Login Widget"""
        bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
        if not bot_token:
            return False

        auth_date = data.get('auth_date')
        if auth_date and (time.time() - int(auth_date)) > TELEGRAM_AUTH_EXPIRY_SECONDS:
            return False

        check_hash = data.pop('hash', '')
        # Формируем строку для проверки
        items = sorted(data.items())
        data_check_string = '\n'.join(f'{k}={v}' for k, v in items if v != '')

        secret_key = hashlib.sha256(bot_token.encode()).digest()
        computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        data['hash'] = check_hash
        return hmac.compare_digest(computed_hash, check_hash)

    @staticmethod
    def telegram_login(data: dict):
        """Авторизация через Telegram Login Widget"""
        try:
            # Проверяем подпись (если бот-токен задан)
            bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
            if bot_token:
                data_copy = dict(data)
                if not UserService.verify_telegram_data(data_copy):
                    raise ValueError("Invalid Telegram auth data")

            telegram_id = data['id']
            first_name = data.get('first_name', '')
            last_name = data.get('last_name', '')
            username = data.get('username', '')
            photo_url = data.get('photo_url', '')

            # Ищем пользователя по telegram_id
            try:
                user = User.objects.get(telegram_id=telegram_id)
                # Обновляем данные из Telegram
                updated = False
                if username and user.telegram_username != username:
                    user.telegram_username = username
                    updated = True
                if photo_url and user.avatar_url != photo_url:
                    user.avatar_url = photo_url
                    updated = True
                # Имя и фамилию обновляем только при первом входе
                if not user.first_name and first_name:
                    user.first_name = first_name
                    updated = True
                if not user.last_name and last_name:
                    user.last_name = last_name
                    updated = True
                if updated:
                    if not user.name:
                        user.name = f"{user.first_name} {user.last_name}".strip()
                    user.save()
            except User.DoesNotExist:
                # Создаём нового пользователя
                user = User.objects.create_user(
                    username=f"tg_{telegram_id}",
                    telegram_id=telegram_id,
                    telegram_username=username,
                    first_name=first_name,
                    last_name=last_name,
                    avatar_url=photo_url,
                    name=f"{first_name} {last_name}".strip(),
                )

            refresh = RefreshToken.for_user(user)

            return {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserService.get_user_dto(user)
            }

        except Exception as e:
            logger.error("Telegram Auth Failed: %s", e)
            raise ValueError("Telegram Auth Failed")

    @staticmethod
    def update_profile(user: User, first_name: str, last_name: str) -> dict:
        """Обновление профиля (ФИО)"""
        user.first_name = first_name
        user.last_name = last_name
        user.name = f"{first_name} {last_name}".strip()
        user.save(update_fields=['first_name', 'last_name', 'name'])
        return UserService.get_user_dto(user)

    @staticmethod
    def delete_account(user: User):
        """Удаление аккаунта: удаляем submissions, затем пользователя (каскадно notifications, progress)"""
        # Удаляем все отправленные работы студента
        Submission.objects.filter(student=user).delete()
        # Удаление пользователя — каскадно удалит notifications, progress
        user.delete()
