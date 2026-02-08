from django.db import models
import uuid

class Module(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=50, blank=True)
    icon = models.CharField(max_length=100, blank=True, help_text="Icon name or URL")
    
    def __str__(self):
        return self.title

class Lesson(models.Model):
    TYPE_CHOICES = [
        ('theory', 'Theory'),
        ('practice', 'Practice'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='lessons')
    number = models.IntegerField(help_text="Order number")
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    content = models.TextField(help_text="Markdown content")
    initial_code = models.TextField(blank=True, null=True)
    correct_answer = models.TextField(blank=True, null=True)
    hint = models.TextField(blank=True, null=True)
    published = models.BooleanField(default=False)

    class Meta:
        ordering = ['number']

    def __str__(self):
        return f"{self.module.title} - {self.title}"
