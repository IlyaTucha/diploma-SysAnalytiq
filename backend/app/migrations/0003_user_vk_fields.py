from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0002_notification_inline_comments'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='vk_id',
            field=models.BigIntegerField(blank=True, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='user',
            name='vk_profile_url',
            field=models.URLField(blank=True, default='', max_length=500),
        ),
    ]
