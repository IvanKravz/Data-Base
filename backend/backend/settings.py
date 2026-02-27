"""
Настройки Django для работы в Docker-окружении.
Переменные окружения загружаются из системы (docker-compose или Kubernetes).
"""

import os
from pathlib import Path
from datetime import timedelta

# ========== БАЗОВЫЕ ПУТИ ==========
BASE_DIR = Path(__file__).resolve().parent.parent

# ========== ОСНОВНЫЕ НАСТРОЙКИ ==========
SECRET_KEY = os.environ['DJANGO_SECRET_KEY']  # Обязательно должна быть задана в окружении
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# ========== ПРИЛОЖЕНИЯ ==========
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Сторонние
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt',
    'django_filters',
    
    # Локальные
    'equipment',
    'facilities',
    'tasks',
    'users',
    'storage',
    'networks',
    'map',
    'employees',
]

# ========== MIDDLEWARE ==========
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'backend.middleware.CorsMediaMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'users.middleware.UserActionLoggingMiddleware',
    'users.threadlocals_middleware.ThreadLocalMiddleware',
]

# ========== КОНФИГУРАЦИЯ URL ==========
ROOT_URLCONF = 'backend.urls'
WSGI_APPLICATION = 'backend.wsgi.application'

# ========== TEMPLATES ==========
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ========== БАЗА ДАННЫХ (PostgreSQL) ==========
DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.postgresql'),
        'NAME': os.getenv('DB_NAME', 'postgres'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
        'HOST': os.getenv('DB_HOST', 'db'),          # В Docker сервис БД обычно называется 'db'
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# ========== ВАЛИДАЦИЯ ПАРОЛЕЙ ==========
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ========== МЕЖДУНАРОДНЫЕ НАСТРОЙКИ ==========
LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ========== СТАТИЧЕСКИЕ ФАЙЛЫ И МЕДИА ==========
STATIC_URL = '/static/'
STATIC_ROOT = '/app/static'          # Папка, куда collectstatic собирает файлы (должна быть в образе)

MEDIA_URL = '/media/'
MEDIA_ROOT = '/app/media'             # Папка для пользовательских загрузок (будет томом)

# ========== DEFAULT PRIMARY KEY ==========
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ========== REST FRAMEWORK ==========
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': None,
    'PAGE_SIZE': None,
}

# ========== JWT НАСТРОЙКИ ==========
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# ========== CORS НАСТРОЙКИ ==========
# В продакшене следует явно указать разрешённые источники через переменную окружения
CORS_ALLOW_ALL_ORIGINS = os.getenv('CORS_ALLOW_ALL_ORIGINS', 'False').lower() == 'true'
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',') if os.getenv('CORS_ALLOWED_ORIGINS') else []
CORS_ALLOW_CREDENTIALS = os.getenv('CORS_ALLOW_CREDENTIALS', 'False').lower() == 'true'

CORS_ALLOWED_METHODS = [
    'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'
]

CORS_ALLOWED_HEADERS = [
    'Accept', 'Authorization', 'Content-Type', 'Origin', 'X-Requested-With'
]

SECURE_CROSS_ORIGIN_OPENER_POLICY = None

# ========== МОДЕЛЬ ПОЛЬЗОВАТЕЛЯ ==========
AUTH_USER_MODEL = 'users.User'

# ========== СЕССИИ ==========
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = int(os.getenv('SESSION_COOKIE_AGE', 3600))
SESSION_EXPIRE_AT_BROWSER_CLOSE = os.getenv('SESSION_EXPIRE_AT_BROWSER_CLOSE', 'False').lower() == 'true'
SESSION_SAVE_EVERY_REQUEST = False

# ========== БЕЗОПАСНОСТЬ (HTTPS) ==========
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False').lower() == 'true'
SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'False').lower() == 'true'

# ========== ЛОГИРОВАНИЕ ==========
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': os.getenv('LOG_LEVEL', 'INFO'),
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.getenv('LOG_LEVEL', 'INFO'),
            'propagate': True,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'users': {
            'handlers': ['console'],
            'level': os.getenv('LOG_LEVEL', 'DEBUG'),
            'propagate': True,
        },
        'equipment': {
            'handlers': ['console'],
            'level': os.getenv('LOG_LEVEL', 'DEBUG'),
            'propagate': True,
        },
    },
}

# ========== РЕЖИМ РАЗРАБОТКИ (информационный вывод) ==========
if DEBUG:
    print("\n" + "="*60)
    print("🚀 РЕЖИМ РАЗРАБОТКИ АКТИВИРОВАН")
    print("="*60)
    print(f"DEBUG: {DEBUG}")
    print(f"ALLOWED_HOSTS: {ALLOWED_HOSTS}")
    print(f"CORS_ALLOW_ALL_ORIGINS: {CORS_ALLOW_ALL_ORIGINS}")
    print(f"CORS_ALLOWED_ORIGINS: {CORS_ALLOWED_ORIGINS}")
    print(f"База данных: {DATABASES['default']['ENGINE']} на {DATABASES['default']['HOST']}")
    print("="*60 + "\n")