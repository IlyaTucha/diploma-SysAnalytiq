from ninja import Router
from typing import List
from ninja_jwt.authentication import JWTAuth
from .schemas import NotificationSchema
from ..domain.services import NotificationService

router = Router()

@router.get("/", response=List[NotificationSchema], auth=JWTAuth())
def list_notifications(request):
    return NotificationService.get_user_notifications(request.user)

@router.post("/{notification_id}/read", response=NotificationSchema, auth=JWTAuth())
def mark_read(request, notification_id: str):
    return NotificationService.mark_as_read(request.user, notification_id)

@router.post("/read-all", auth=JWTAuth())
def mark_all_read(request):
    NotificationService.mark_all_as_read(request.user)
    return {"success": True}
