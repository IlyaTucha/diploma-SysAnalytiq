from ninja import Router
from ninja_jwt.authentication import JWTAuth
from ninja.errors import HttpError
from ..domain.entities import UserSchema, AuthResponse, TelegramLoginSchema, UpdateProfileSchema, ToggleNotificationsSchema
from ..domain.services import UserService
from app.internal.telegram.service import TelegramService

router = Router()

@router.get("/me", response=UserSchema, auth=JWTAuth())
def me(request):
    return UserService.get_user_dto(request.user)

@router.put("/me", response=UserSchema, auth=JWTAuth())
def update_profile(request, data: UpdateProfileSchema):
    return UserService.update_profile(request.user, data.first_name, data.last_name)

@router.delete("/me", auth=JWTAuth())
def delete_account(request):
    UserService.delete_account(request.user)
    return {"success": True}

@router.post("/telegram-notifications", response=UserSchema, auth=JWTAuth())
def toggle_telegram_notifications(request, data: ToggleNotificationsSchema):
    user = request.user
    if not user.telegram_id:
        raise HttpError(400, "Telegram аккаунт не привязан")
    user.telegram_notifications = data.enabled
    user.save(update_fields=['telegram_notifications'])
    TelegramService.send_toggle_confirmation(user, data.enabled)
    return UserService.get_user_dto(user)

@router.post("/telegram", response=AuthResponse)
def telegram_auth(request, data: TelegramLoginSchema):
    try:
        return UserService.telegram_login(data.dict())
    except ValueError as e:
        raise HttpError(400, str(e))
