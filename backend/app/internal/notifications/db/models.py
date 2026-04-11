from django.db import models
from app.internal.users.db.models import User
from app.internal.submissions.db.models import Submission
import uuid

class Notification(models.Model):
    TYPE_CHOICES = [
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('pending', 'Pending Review'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', help_text="User receiving the notification")
    reviewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='reviewed_notifications')
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, null=True, blank=True)
    
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    message = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    module_name = models.CharField(max_length=255, blank=True)
    lesson_title = models.CharField(max_length=255, blank=True)
    lesson_path = models.CharField(max_length=255, blank=True)

    highlighted_code = models.TextField(blank=True, default='')
    inline_comment = models.TextField(blank=True, default='')
    start_line = models.IntegerField(null=True, blank=True)
    end_line = models.IntegerField(null=True, blank=True)
    inline_comments = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.user} - {self.type}"
