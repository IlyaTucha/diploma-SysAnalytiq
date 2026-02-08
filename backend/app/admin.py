from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from app.internal.users.db.models import User, Group
from app.internal.courses.db.models import Module, Lesson
from app.internal.submissions.db.models import Submission
from app.internal.notifications.db.models import Notification
from app.internal.progress.db.models import Progress

# Users
@admin.register(User)

class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {'fields': ('avatar', 'group', 'name')}),
    )
    list_display = ('email', 'username', 'is_staff', 'group')

    ordering = ('email',)

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'id')

# Courses
@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'color')
    prepopulated_fields = {'slug': ('title',)}

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'number', 'type')
    list_filter = ('module', 'type', 'published')
    prepopulated_fields = {'slug': ('title',)}

# Submissions
@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('student', 'lesson', 'status', 'submitted_date')
    list_filter = ('status', 'lesson')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'created_at', 'is_read')
    list_filter = ('type', 'is_read')

@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'lesson', 'completed_at')

