from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0003_user_vk_fields'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='notification',
            name='highlighted_code',
        ),
        migrations.RemoveField(
            model_name='notification',
            name='inline_comment',
        ),
        migrations.RemoveField(
            model_name='notification',
            name='start_line',
        ),
        migrations.RemoveField(
            model_name='notification',
            name='end_line',
        ),
        migrations.RemoveField(
            model_name='submission',
            name='attempt_count',
        ),
    ]
