"""
Файл для обратной совместимости
Новый код должен использовать модули в папке logging
"""

import warnings
warnings.warn(
    "users.logging_utils is deprecated. Use users.logging module instead.",
    DeprecationWarning,
    stacklevel=2
)

# Реэкспортируем все функции из нового модуля
from .logging import *
from .logging.base import *
from .logging.auth import *
from .logging.equipment import *
from .logging.storage import *
from .logging.utils import *