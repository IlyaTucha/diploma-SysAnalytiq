from django.db import models
from app.internal.users.db.models import User
from app.internal.courses.db.models import Lesson

class Submission(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='submissions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_date = models.DateTimeField(auto_now_add=True)
    student_solution = models.TextField()
    execution_result = models.JSONField(blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.student.email} - {self.lesson.title}"
