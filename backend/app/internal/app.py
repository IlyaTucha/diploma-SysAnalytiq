from ninja_extra import NinjaExtraAPI
from ninja_jwt.controller import NinjaJWTDefaultController
from app.internal.users.presentation.handlers import router as users_router
from app.internal.courses.presentation.handlers import router as courses_router
from app.internal.submissions.presentation.handlers import router as submissions_router
from app.internal.admin.presentation.handlers import router as admin_router
from app.internal.notifications.presentation.handlers import router as notifications_router
from app.internal.progress.presentation.handlers import router as progress_router
from app.internal.groups.presentation.handlers import router as groups_router

api = NinjaExtraAPI()
api.register_controllers(NinjaJWTDefaultController)

api.add_router("/auth", users_router)
api.add_router("", courses_router)
api.add_router("/submissions", submissions_router)
api.add_router("/admin", admin_router)
api.add_router("/notifications", notifications_router)
api.add_router("/progress", progress_router)
api.add_router("/groups", groups_router)

