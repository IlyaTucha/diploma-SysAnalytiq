from django.shortcuts import get_object_or_404
from app.internal.users.db.models import Group, User
from app.internal.telegram.service import TelegramService
import uuid


class GroupService:
    @staticmethod
    def get_all_groups():
        return Group.objects.all()

    @staticmethod
    def create_group(name: str, password: str = ""):
        invite_code = uuid.uuid4().hex[:8]
        group = Group(name=name, invite_code=invite_code)
        group.set_password(password)
        group.save()
        return group

    @staticmethod
    def update_group(group_id, password: str = None):
        group = get_object_or_404(Group, id=group_id)
        if password is not None:
            group.set_password(password)
            group.save(update_fields=["password"])
        return group

    @staticmethod
    def delete_group(group_id):
        group = get_object_or_404(Group, id=group_id)
        group.students.update(group=None)
        group.delete()

    @staticmethod
    def get_group_members(group_id):
        get_object_or_404(Group, id=group_id)
        return User.objects.filter(group_id=group_id)

    @staticmethod
    def kick_student(group_id, user_id):
        user = get_object_or_404(User, id=user_id, group_id=group_id)
        user.group = None
        user.save()

    @staticmethod
    def check_invite(invite_code: str):
        group = get_object_or_404(Group, invite_code=invite_code)
        return {"group_name": group.name, "requires_password": bool(group.password)}

    @staticmethod
    def join_group(user, invite_code: str, password: str = ""):
        group = get_object_or_404(Group, invite_code=invite_code)
        if group.password and not group.check_password(password):
            from ninja.errors import HttpError
            raise HttpError(403, "Неверный пароль группы")

        already_member = user.group_id == group.id
        user.group = group
        user.save()

        if not already_member:
            try:
                TelegramService.notify_admins_group_join(user, group)
            except Exception:
                pass

        return group
