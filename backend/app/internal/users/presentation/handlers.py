from django.conf import settings
from django.http import HttpResponse
from ninja import Router
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.tokens import RefreshToken
from ninja_jwt.exceptions import TokenError
from ninja.errors import HttpError
from ..domain.entities import UserSchema, AuthResponse, TokenResponse, VKLoginSchema, UpdateProfileSchema, ToggleNotificationsSchema, TelegramBindSchema
from ..domain.services import UserService
from app.internal.telegram.service import TelegramService

router = Router()

REFRESH_COOKIE_NAME = 'refresh_token'
REFRESH_COOKIE_PATH = '/api'


def _set_refresh_cookie(response: HttpResponse, refresh_token: str):
    max_age = int(settings.NINJA_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
    response.set_cookie(
        REFRESH_COOKIE_NAME,
        refresh_token,
        max_age=max_age,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite='Lax',
        path=REFRESH_COOKIE_PATH,
    )

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
def vk_auth(request, data: VKLoginSchema, response: HttpResponse):
    try:
        result = UserService.vk_login(data.access_token)
    except ValueError as e:
        raise HttpError(400, str(e))
    _set_refresh_cookie(response, result['refresh'])
    return {'access': result['access'], 'user': result['user']}


@router.post("/refresh", response=TokenResponse, auth=None)
def refresh_token(request, response: HttpResponse):
    raw = request.COOKIES.get(REFRESH_COOKIE_NAME)
    if not raw:
        raise HttpError(401, "No refresh token")
    try:
        refresh = RefreshToken(raw)
    except TokenError:
        response.delete_cookie(REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)
        raise HttpError(401, "Invalid refresh token")
    return {'access': str(refresh.access_token)}


@router.post("/logout", auth=None)
def logout(request, response: HttpResponse):
    raw = request.COOKIES.get(REFRESH_COOKIE_NAME)
    if raw:
        try:
            RefreshToken(raw).blacklist()
        except TokenError:
            pass
    response.delete_cookie(REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)
    return {"success": True}

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
    delivered = TelegramService.send_toggle_confirmation(user, data.enabled)
    dto = UserService.get_user_dto(user)
    # Поле важно только при включении: если бот не смог написать,
    # фронт подскажет пользователю открыть бота и нажать Start.
    if data.enabled:
        dto['telegram_can_receive'] = delivered
    return dto
