from django.shortcuts import get_object_or_404
from app.internal.users.db.models import Group, User
import uuid


class GroupService:
    @staticmethod
    def get_all_groups():
        return Group.objects.all()

    @staticmethod
    def create_group(name: str):
        invite_code = uuid.uuid4().hex[:8]
        return Group.objects.create(name=name, invite_code=invite_code)

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
    def join_group(user, invite_code: str):
        group = get_object_or_404(Group, invite_code=invite_code)
        user.group = group
        user.save()
        return group
