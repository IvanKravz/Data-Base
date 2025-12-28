"""
Скрипт быстрой настройки для локальной разработки
"""
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def setup_development_environment():
    """Настройка среды разработки"""
    print("🚀 Настройка локальной среды разработки...")
    
    # Создаем .env файл если его нет
    env_path = BASE_DIR / '.env'
    
    if env_path.exists():
        print("⚠️  Файл .env уже существует")
        replace = input("Заменить? (y/N): ")
        if replace.lower() != 'y':
            print("Настройка отменена.")
            return
    
    # Генерируем безопасные ключи
    import secrets
    
    django_secret = secrets.token_urlsafe(50)
    encryption_key = "dev-encryption-" + secrets.token_hex(16)
    jwt_secret = "dev-jwt-" + secrets.token_hex(16)
    
    # Создаем .env файл
    env_content = f"""# ========== ДЛЯ ЛОКАЛЬНОЙ РАЗРАБОТКИ ==========
# ⚠️ НЕ ИСПОЛЬЗОВАТЬ В ПРОДАКШЕНЕ!

DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_SECRET_KEY={django_secret}
ENCRYPTION_KEY={encryption_key}
JWT_SECRET_KEY={jwt_secret}

# База данных
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173
CORS_ALLOW_CREDENTIALS=True

# Безопасность (отключена для разработки)
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False

# Логирование
LOG_LEVEL=DEBUG

# 2FA
TOTP_ISSUER=SecretSystemDev

# Сессии
SESSION_COOKIE_AGE=3600

# Режим разработки
DEVELOPMENT_MODE=True
"""
    
    with open(env_path, 'w') as f:
        f.write(env_content)
    
    print("✅ Файл .env создан")
    
    # Создаем папку для медиа файлов
    media_dir = BASE_DIR / 'media'
    if not media_dir.exists():
        media_dir.mkdir(parents=True)
        print("✅ Папка media создана")
    
    # Создаем папку для статики
    static_dir = BASE_DIR / 'static'
    if not static_dir.exists():
        static_dir.mkdir(parents=True)
        print("✅ Папка static создана")
    
    print("\n🎯 Настройка завершена!")
    print("\nСледующие шаги:")
    print("1. Установите зависимости: pip install -r requirements-dev.txt")
    print("2. Запустите миграции: python manage.py migrate")
    print("3. Создайте суперпользователя: python manage.py createsuperuser")
    print("4. Запустите сервер: python manage.py runserver 127.0.0.1:8000")
    print("\nФронтенд должен быть доступен на http://localhost:5173")

if __name__ == "__main__":
    setup_development_environment()