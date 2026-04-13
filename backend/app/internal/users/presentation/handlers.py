from ninja import Router
from ninja_jwt.authentication import JWTAuth
from ninja.errors import HttpError
from ..domain.entities import UserSchema, AuthResponse, VKLoginSchema, UpdateProfileSchema, ToggleNotificationsSchema, TelegramBindSchema
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

@router.post("/vk", response=AuthResponse)
def vk_auth(request, data: VKLoginSchema):
    try:
        return UserService.vk_login(data.access_token)
    except ValueError as e:
        raise HttpError(400, str(e))

@router.post("/telegram-bind", response=UserSchema, auth=JWTAuth())
def telegram_bind(request, data: TelegramBindSchema):
    try:
        return UserService.bind_telegram(request.user, data.dict())
    except ValueError as e:
        raise HttpError(400, str(e))

@router.delete("/telegram-bind", response=UserSchema, auth=JWTAuth())
def telegram_unbind(request):
    return UserService.unbind_telegram(request.user)

@router.post("/telegram-notifications", response=UserSchema, auth=JWTAuth())
def toggle_telegram_notifications(request, data: ToggleNotificationsSchema):
    user = request.user
    if not user.telegram_id:
        raise HttpError(400, "Telegram аккаунт не привязан")
    user.telegram_notifications = data.enabled
    user.save(update_fields=['telegram_notifications'])
    TelegramService.send_toggle_confirmation(user, data.enabled)
    return UserService.get_user_dto(user)
