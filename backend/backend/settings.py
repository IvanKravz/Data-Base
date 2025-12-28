"""
Настройки Django для локальной разработки с грифом "Секретно"
Фронтенд: http://localhost:5173
Бэкенд: http://127.0.0.1:8000
"""

import os
import sys
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# ========== БАЗОВЫЕ ПУТИ ==========
BASE_DIR = Path(__file__).resolve().parent.parent

# ========== ЗАГРУЗКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ ==========
env_path = BASE_DIR / '.env'
if not env_path.exists():
    # Создаем минимальный .env для разработки
    with open(env_path, 'w') as f:
        f.write("""# ========== ДЛЯ ЛОКАЛЬНОЙ РАЗРАБОТКИ ==========
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_SECRET_KEY=django-insecure-dev-key-change-me-in-production
CORS_ALLOWED_ORIGINS=http://localhost:5173
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
""")
    print("✅ Создан файл .env для разработки")

load_dotenv(env_path)

# ========== ОСНОВНЫЕ НАСТРОЙКИ ==========
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-dev-key-change-me')
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
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
]

# ========== MIDDLEWARE ==========
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
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

# ========== БАЗА ДАННЫХ ==========
DB_ENGINE = os.getenv('DB_ENGINE', 'django.db.backends.sqlite3')
DB_NAME = os.getenv('DB_NAME', 'db.sqlite3')

DATABASES = {
    'default': {
        'ENGINE': DB_ENGINE,
        'NAME': BASE_DIR / DB_NAME if DB_ENGINE == 'django.db.backends.sqlite3' else DB_NAME,
    }
}

# Для PostgreSQL добавьте эти поля если нужно:
if DB_ENGINE != 'django.db.backends.sqlite3':
    DATABASES['default']['USER'] = os.getenv('DB_USER', '')
    DATABASES['default']['PASSWORD'] = os.getenv('DB_PASSWORD', '')
    DATABASES['default']['HOST'] = os.getenv('DB_HOST', 'localhost')
    DATABASES['default']['PORT'] = os.getenv('DB_PORT', '5432')

# ========== ВАЛИДАЦИЯ ПАРОЛЕЙ ==========
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# ========== МЕЖДУНАРОДНЫЕ НАСТРОЙКИ ==========
LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ========== СТАТИЧЕСКИЕ ФАЙЛЫ ==========
STATIC_URL = 'static/'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

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
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# ========== CORS НАСТРОЙКИ ==========
CORS_ALLOW_ALL_ORIGINS = True  # Для разработки разрешаем все
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
]

CORS_ALLOWED_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
]

CORS_ALLOWED_HEADERS = [
    'Accept', 'Authorization', 'Content-Type', 'Origin', 'X-Requested-With'
]

SECURE_CROSS_ORIGIN_OPENER_POLICY = None

# ========== МОДЕЛЬ ПОЛЬЗОВАТЕЛЯ ==========
AUTH_USER_MODEL = 'users.User'

# ========== СЕССИИ ==========
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 3600  # 1 час
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_SAVE_EVERY_REQUEST = False

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
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'users': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'equipment': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}

# ========== РЕЖИМ РАЗРАБОТКИ ==========
if DEBUG:
    print("\n" + "="*60)
    print("🚀 РЕЖИМ РАЗРАБОТКИ АКТИВИРОВАН")
    print("="*60)
    print(f"DEBUG: {DEBUG}")
    print(f"ALLOWED_HOSTS: {ALLOWED_HOSTS}")
    print(f"CORS: Разрешены все источники: {CORS_ALLOW_ALL_ORIGINS}")
    print(f"База данных: {DB_ENGINE}")
    print("="*60 + "\n")