from django.db import models
from app.internal.submissions.db.models import Submission
import uuid

class SubmissionComment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='comments')
    line_start = models.IntegerField()
    line_end = models.IntegerField()
    text = models.TextField()
    highlighted_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment on {self.submission.id}"
