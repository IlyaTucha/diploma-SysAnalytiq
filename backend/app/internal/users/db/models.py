from django.contrib.auth.models import AbstractUser
from django.contrib.auth.hashers import make_password, check_password
from django.db import models
import uuid

class Group(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    invite_code = models.CharField(max_length=20, unique=True, blank=True)
    password = models.CharField(max_length=128, blank=True, default='')

    def set_password(self, raw_password: str):
        """Хеширует и сохраняет пароль группы."""
        if raw_password:
            self.password = make_password(raw_password)
        else:
            self.password = ''

    def check_password(self, raw_password: str) -> bool:
        """Проверяет пароль группы."""
        if not self.password:
            return True
        return check_password(raw_password, self.password)

    def save(self, *args, **kwargs):
        if not self.invite_code:
            self.invite_code = uuid.uuid4().hex[:8]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, blank=True)
    avatar_url = models.URLField(max_length=500, blank=True, default='')
    group = models.ForeignKey(Group, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')

    # Telegram fields
    telegram_id = models.BigIntegerField(unique=True, null=True, blank=True)
    telegram_username = models.CharField(max_length=255, blank=True, default='')
    telegram_notifications = models.BooleanField(default=False)
    first_name = models.CharField(max_length=150, blank=True, default='')
    last_name = models.CharField(max_length=150, blank=True, default='')

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['name']

    @property
    def display_name(self):
        """ФИО или имя из Telegram, или username"""
        full = f"{self.first_name} {self.last_name}".strip()
        return full or self.name or self.telegram_username or self.username

    def __str__(self):
        if self.telegram_username:
            return f"@{self.telegram_username}"
        return self.username
