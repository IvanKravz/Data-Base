"""
Пакет для модульного логирования действий пользователей
"""

from .facilities import *
from .tasks import *
from .storage import *

# Основные функции
from .base import (
    log_user_action,
    get_user_action_logs,
    get_user_statistics
)

# Модуль аутентификации
from .auth import (
    log_login_action,
    log_logout_action,
    log_token_refresh
)

# Модуль техники
from .equipment import (
    log_equipment_action,
    log_equipment_disposal,
    log_equipment_assignment,
    log_equipment_move,
    get_equipment_statistics
)

# Вспомогательные функции
from .utils import (
    format_file_size,
    extract_file_extension,
    validate_log_data
)

__all__ = [
    # Базовые
    'log_user_action',
    'get_user_action_logs',
    'get_user_statistics',
    
    # Аутентификация
    'log_login_action',
    'log_logout_action',
    'log_token_refresh',
    
    # Техника
    'log_equipment_action',
    'log_equipment_disposal',
    'log_equipment_assignment',
    'log_equipment_move',
    'get_equipment_statistics',
    
    # Утилиты
    'format_file_size',
    'extract_file_extension',
    'validate_log_data',
]