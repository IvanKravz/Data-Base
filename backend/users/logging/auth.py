"""
Функции для логирования действий аутентификации
"""

from .base import log_user_action
import logging

logger = logging.getLogger(__name__)


def log_login_action(user, request=None, **kwargs):
    """
    Логирование входа в систему
    """
    return log_user_action(
        user=user,
        action='login',
        module='auth',
        request=request,
        details={
            'login_type': kwargs.get('login_type', 'password'),
            'source_ip': request.META.get('REMOTE_ADDR') if request else None,
            'user_agent': request.META.get('HTTP_USER_AGENT') if request else None,
        }
    )


def log_logout_action(user, request=None, **kwargs):
    """
    Логирование выхода из системы
    """
    return log_user_action(
        user=user,
        action='logout',
        module='auth',
        request=request,
        details={
            'logout_type': kwargs.get('logout_type', 'manual'),
            'source': kwargs.get('source', 'web'),
            'session_duration': kwargs.get('session_duration'),
        }
    )


def log_token_refresh(user, request=None, **kwargs):
    """
    Логирование обновления токена
    """
    return log_user_action(
        user=user,
        action='update',
        module='auth',
        request=request,
        details={
            'action': 'token_refresh',
            'token_type': kwargs.get('token_type', 'jwt'),
        }
    )


def log_failed_login(username, request=None, **kwargs):
    """
    Логирование неудачной попытки входа
    """
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Пытаемся найти пользователя
        user = None
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            pass
        
        return log_user_action(
            user=user,
            action='login',
            module='auth',
            request=request,
            details={
                'login_type': 'failed',
                'username': username,
                'reason': kwargs.get('reason', 'invalid_credentials'),
                'source_ip': request.META.get('REMOTE_ADDR') if request else None,
                'attempt_number': kwargs.get('attempt_number'),
            }
        )
    except Exception as e:
        logger.error(f"Error logging failed login: {str(e)}")
        return False