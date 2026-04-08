import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

TELEGRAM_API = "https://api.telegram.org/bot{token}"


class TelegramService:
    """Сервис отправки уведомлений через Telegram Bot API."""

    @staticmethod
    def _get_token():
        return getattr(settings, 'TELEGRAM_BOT_TOKEN', '')

    @staticmethod
    def _get_site_url():
        return getattr(settings, 'SITE_URL', 'http://127.0.0.1')

    @staticmethod
    def _is_public_url(url):
        """Проверяет, является ли URL валидным для Telegram inline keyboard (не localhost)."""
        return url and not any(x in url for x in ('localhost', '127.0.0.1', '0.0.0.0'))

    @staticmethod
    def send_message(chat_id, text, parse_mode='HTML', reply_markup=None):
        """Отправляет сообщение через Telegram Bot API."""
        token = TelegramService._get_token()
        if not token:
            logger.warning("TELEGRAM_BOT_TOKEN not set, skipping notification")
            return None

        url = f"{TELEGRAM_API.format(token=token)}/sendMessage"
        payload = {
            'chat_id': chat_id,
            'text': text,
            'parse_mode': parse_mode,
        }
        if reply_markup:
            payload['reply_markup'] = reply_markup

        try:
            resp = requests.post(url, json=payload, timeout=10)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"Telegram send_message error: {e}")
            return None

    @staticmethod
    def notify_student_review(submission, status, feedback, inline_comments, reviewer):
        """
        Уведомление студенту о результате проверки.
        """
        student = submission.student
        if not student or not student.telegram_id or not student.telegram_notifications:
            return

        lesson = submission.lesson
        module = lesson.module

        reviewer_name = _user_link(reviewer)

        if status == 'approved':
            status_line = "Задание принято ✅"
        else:
            status_line = "❌ На доработке"

        lines = []
        lines.append(f"{reviewer_name} проверил ваше решение")
        lines.append(f"Модуль: <b>{_escape_html(module.title)}</b>")
        lines.append(f"Задание: <b>«{_escape_html(lesson.title)}»</b>")
        lines.append("")
        lines.append(f"<b>{status_line}</b>")

        if feedback:
            lines.append("")
            lines.append("<b>Общий комментарий:</b>")
            lines.append(_escape_html(feedback))

        if inline_comments:
            for i, comment in enumerate(inline_comments, 1):
                line_num = comment.get('line_start', '')
                line_end = comment.get('line_end', '')
                highlighted = comment.get('highlighted_text', '')
                text = comment.get('text', '')

                line_info = f"Строка {line_num}"
                if line_end and line_end != line_num:
                    line_info = f"Строки {line_num}–{line_end}"

                lines.append("")
                lines.append(f"<b>{i}. {line_info}</b>")
                lines.append("")
                if highlighted:
                    lines.append(f"<code>{_escape_html(highlighted[:200])}</code>")
                    lines.append("")
                if text:
                    lines.append("<b>Комментарий:</b>")
                    lines.append(_escape_html(text))

        message = "\n".join(lines).strip()

        site_url = TelegramService._get_site_url()
        lesson_url = f"{site_url}/modules/{module.slug}/{lesson.id}"

        reply_markup = None
        if TelegramService._is_public_url(site_url):
            reply_markup = {
                "inline_keyboard": [[
                    {"text": "Перейти к странице с заданием", "url": lesson_url}
                ]]
            }
        else:
            message += f"\n\n{lesson_url}"

        TelegramService.send_message(student.telegram_id, message, reply_markup=reply_markup)

    @staticmethod
    def notify_admins_new_submission(submission, is_resubmission=False):
        """
        Уведомление администраторам о новой работе / повторной отправке.
        Попытка = количество записей в review_history + 1.
        Уведомление отправляется только если студент состоит в группе.
        """
        from app.internal.users.db.models import User

        student = submission.student
        if not student or not student.group:
            return

        admins = User.objects.filter(
            is_staff=True,
            telegram_notifications=True,
            telegram_id__isnull=False,
        )
        if not admins.exists():
            return

        student = submission.student
        lesson = submission.lesson
        module = lesson.module
        student_link = _user_link(student) if student else 'Неизвестный студент'
        group_name = student.group.name if student and student.group else None

        if is_resubmission:
            action = "повторно отправил решение"
        else:
            action = "отправил решение"

        lines = [
            f"{student_link} {action}",
        ]
        if group_name:
            lines.append(f"Группа: <b>«{_escape_html(group_name)}»</b>")
        lines.append(f"Модуль: <b>{_escape_html(module.title)}</b>")
        lines.append(f"Задание: <b>«{_escape_html(lesson.title)}»</b>")

        if is_resubmission:
            review_count = len(submission.review_history or [])
            attempt_num = review_count + 1
            lines.append(f"Попытка №{attempt_num}")

        message = "\n".join(lines)

        site_url = TelegramService._get_site_url()
        review_url = f"{site_url}/admin/reviews"

        reply_markup = None
        if TelegramService._is_public_url(site_url):
            reply_markup = {
                "inline_keyboard": [[
                    {"text": "Перейти к странице с проверкой задания", "url": review_url}
                ]]
            }
        else:
            message += f"\n\n{review_url}"

        for admin in admins:
            TelegramService.send_message(admin.telegram_id, message, reply_markup=reply_markup)

    @staticmethod
    def notify_admins_group_join(user, group):
        """
        Уведомление администраторам о вступлении студента в группу.
        Включает информацию о непроверенных работах студента.
        """
        from app.internal.users.db.models import User
        from app.internal.submissions.db.models import Submission

        admins = User.objects.filter(
            is_staff=True,
            telegram_notifications=True,
            telegram_id__isnull=False,
        )
        if not admins.exists():
            return

        student_link = _user_link(user)
        lines = [
            f"{student_link} вступил в группу <b>«{_escape_html(group.name)}»</b>",
        ]

        pending_count = Submission.objects.filter(student=user, status='pending').count()
        if pending_count > 0:
            lines.append(f"Непроверенных работ: <b>{pending_count}</b>")

        message = "\n".join(lines)

        site_url = TelegramService._get_site_url()
        review_url = f"{site_url}/admin/reviews"

        reply_markup = None
        if TelegramService._is_public_url(site_url):
            reply_markup = {
                "inline_keyboard": [[
                    {"text": "Перейти к проверке", "url": review_url}
                ]]
            }
        else:
            message += f"\n\n{review_url}"

        for admin in admins:
            TelegramService.send_message(admin.telegram_id, message, reply_markup=reply_markup)

    @staticmethod
    def send_toggle_confirmation(user, enabled):
        """Подтверждение включения/выключения уведомлений."""
        if not user.telegram_id:
            return

        if enabled:
            text = "🔔 Уведомления включены! Теперь вы будете получать уведомления о проверке заданий."
        else:
            text = "🔕 Уведомления отключены. Вы больше не будете получать уведомления."

        TelegramService.send_message(user.telegram_id, text)


def _user_link(user):
    """Формирует кликабельную ссылку на пользователя в Telegram.
    
    Просто кликабельное имя, ведёт на профиль Telegram.
    """
    name = _escape_html(user.display_name)
    if user.telegram_username:
        tg = _escape_html(user.telegram_username)
        return f'<a href="https://t.me/{tg}">{name}</a>'
    if user.telegram_id:
        return f'<a href="tg://user?id={user.telegram_id}">{name}</a>'
    return f'<b>{name}</b>'


def _escape_html(text):
    """Экранирование HTML-спецсимволов для Telegram."""
    if not text:
        return ''
    return (
        str(text)
        .replace('&', '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
    )
