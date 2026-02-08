from ninja import Router
from ninja_jwt.authentication import JWTAuth
from ninja.errors import HttpError
from ..domain.entities import UserSchema, AuthResponse, GoogleLoginSchema
from ..domain.services import UserService

router = Router()

@router.get("/me", response=UserSchema, auth=JWTAuth())
def me(request):
    return UserService.get_user_dto(request.user)

@router.post("/google", response=AuthResponse)
def google_auth(request, data: GoogleLoginSchema):
    try:
        return UserService.google_login(data.token)
    except ValueError as e:
        raise HttpError(400, str(e))
