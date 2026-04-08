from django.db import models
from app.internal.users.db.models import User
from app.internal.courses.db.models import Lesson

class Submission(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    student = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='submissions')
    student_display_name = models.CharField(max_length=255, blank=True, default='')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='submissions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_date = models.DateTimeField(auto_now_add=True)
    student_solution = models.TextField()
    execution_result = models.JSONField(blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)
    attempt_count = models.IntegerField(default=1)
    review_history = models.JSONField(default=list, blank=True)

    def __str__(self):
        name = str(self.student) if self.student else (self.student_display_name or 'Удалённый студент')
        return f"{name} - {self.lesson.title}"
