from ninja import Router
from ninja_jwt.authentication import JWTAuth
from ninja.errors import HttpError
from ..domain.services import GroupService
from ..domain.entities import GroupSchema, GroupCreateSchema, JoinGroupSchema, GroupMemberSchema, GroupUpdateSchema, GroupInviteInfoSchema
from typing import List

router = Router()


@router.get("/invite/{invite_code}", response=GroupInviteInfoSchema, auth=JWTAuth())
def check_invite(request, invite_code: str):
    info = GroupService.check_invite(invite_code)
    return info


@router.post("/join", response=GroupSchema, auth=JWTAuth())
def join_group(request, data: JoinGroupSchema):
    return GroupService.join_group(request.user, data.invite_code, data.password)


@router.get("/", response=List[GroupSchema], auth=JWTAuth())
def list_groups(request):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    return GroupService.get_all_groups()


@router.post("/", response=GroupSchema, auth=JWTAuth())
def create_group(request, data: GroupCreateSchema):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    return GroupService.create_group(data.name, data.password)


@router.put("/{group_id}", response=GroupSchema, auth=JWTAuth())
def update_group(request, group_id: str, data: GroupUpdateSchema):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    return GroupService.update_group(group_id, data.password)


@router.delete("/{group_id}", auth=JWTAuth())
def delete_group(request, group_id: str):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    GroupService.delete_group(group_id)
    return {"success": True}


@router.get("/{group_id}/members", response=List[GroupMemberSchema], auth=JWTAuth())
def group_members(request, group_id: str):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    return GroupService.get_group_members(group_id)


@router.post("/{group_id}/kick/{user_id}", auth=JWTAuth())
def kick_student(request, group_id: str, user_id: str):
    if not request.user.is_staff:
        raise HttpError(403, "Admin access required")
    GroupService.kick_student(group_id, user_id)
    return {"success": True}
