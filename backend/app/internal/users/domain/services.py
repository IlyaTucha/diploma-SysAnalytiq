import hashlib
import hmac
import logging
import time

import requests as http_requests
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
            "vk_profile_url": user.vk_profile_url or "",
            "telegram_username": user.telegram_username or "",
            "telegram_notifications": user.telegram_notifications,
            "avatar": user.avatar_url or None,
            "is_admin": user.is_staff or user.is_superuser,
            "group_id": user.group_id,
            "group_name": user.group.name if user.group_id else None
        }

    # ── VK OAuth ──────────────────────────────────────────────

    @staticmethod
    def _vk_get_user_info(access_token: str) -> dict:
        """Получает профиль пользователя через VK ID API."""
        resp = http_requests.post(
            'https://id.vk.com/oauth2/user_info',
            data={'access_token': access_token, 'client_id': getattr(settings, 'VK_APP_ID', '')},
            timeout=10,
        )
        data = resp.json()
        if 'user' not in data:
            logger.error("VK user_info failed: %s", data)
            raise ValueError("VK user_info failed")
        return data['user']

    @staticmethod
    def vk_login(access_token: str):
        """Авторизация через VK ID — принимает access_token от SDK."""
        try:
            vk_user = UserService._vk_get_user_info(access_token)
            vk_id = int(vk_user['user_id'])
            first_name = vk_user.get('first_name', '')
            last_name = vk_user.get('last_name', '')
            avatar = vk_user.get('avatar', '')
            # Формируем ссылку на профиль VK
            vk_profile_url = f"https://vk.com/id{vk_id}"

            try:
                user = User.objects.get(vk_id=vk_id)
                updated = False
                if avatar and user.avatar_url != avatar:
                    user.avatar_url = avatar
                    updated = True
                if vk_profile_url and user.vk_profile_url != vk_profile_url:
                    user.vk_profile_url = vk_profile_url
                    updated = True
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
                user = User.objects.create_user(
                    username=f"vk_{vk_id}",
                    vk_id=vk_id,
                    vk_profile_url=vk_profile_url,
                    first_name=first_name,
                    last_name=last_name,
                    avatar_url=avatar,
                    name=f"{first_name} {last_name}".strip(),
                )

            refresh = RefreshToken.for_user(user)
            return {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserService.get_user_dto(user)
            }

        except Exception as e:
            logger.error("VK Auth Failed: %s", e)
            raise ValueError("VK Auth Failed")

    # ── Telegram bind (для уведомлений) ──────────────────────

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
        items = sorted(data.items())
        data_check_string = '\n'.join(f'{k}={v}' for k, v in items if v != '')

        secret_key = hashlib.sha256(bot_token.encode()).digest()
        computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        data['hash'] = check_hash
        return hmac.compare_digest(computed_hash, check_hash)

    @staticmethod
    def bind_telegram(user: User, data: dict) -> dict:
        """Привязка Telegram аккаунта к существующему пользователю (для уведомлений)."""
        bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
        if bot_token:
            data_copy = dict(data)
            if not UserService.verify_telegram_data(data_copy):
                raise ValueError("Invalid Telegram auth data")

        telegram_id = data['id']
        username = data.get('username', '')

        existing = User.objects.filter(telegram_id=telegram_id).exclude(pk=user.pk).first()
        if existing:
            raise ValueError("Этот Telegram аккаунт уже привязан к другому пользователю")

        user.telegram_id = telegram_id
        user.telegram_username = username
        user.save(update_fields=['telegram_id', 'telegram_username'])
        return UserService.get_user_dto(user)

    @staticmethod
    def unbind_telegram(user: User) -> dict:
        """Отвязка Telegram аккаунта."""
        user.telegram_id = None
        user.telegram_username = ''
        user.telegram_notifications = False
        user.save(update_fields=['telegram_id', 'telegram_username', 'telegram_notifications'])
        return UserService.get_user_dto(user)

    # ── Профиль ──────────────────────────────────────────────

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
        Submission.objects.filter(student=user).delete()
        user.delete()
