from typing import List
from django.shortcuts import get_object_or_404
from ..db.models import Notification


class NotificationService:
    @staticmethod
    def get_user_notifications(user) -> List[Notification]:
        return Notification.objects.filter(user=user).order_by('-created_at')

    @staticmethod
    def mark_as_read(user, notification_id: str):
        notification = get_object_or_404(Notification, id=notification_id, user=user)
        notification.is_read = True
        notification.save()
        return notification

    @staticmethod
    def mark_all_as_read(user):
        Notification.objects.filter(user=user, is_read=False).update(is_read=True)
