import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)

class RoleAccessLoggingMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.user.is_authenticated and hasattr(request, 'user'):
            user_roles = request.user.get_roles()
            if user_roles:
                logger.info(
                    f"User {request.user.username} with roles {user_roles} "
                    f"accessed {request.path}"
                )