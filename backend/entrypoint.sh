#!/bin/sh
set -e

# ------------------------------------------------------------------ #
# 1. Ждём готовности БД (страховка поверх healthcheck в compose).
#    Если pg_isready не установлен в образе — шаг пропускается.
# ------------------------------------------------------------------ #
if command -v pg_isready >/dev/null 2>&1; then
    echo "⏳ Waiting for postgres at ${DB_HOST:-db}:${DB_PORT:-5432}..."
    until pg_isready -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" >/dev/null 2>&1; do
        sleep 1
    done
    echo "✅ Postgres is ready."
fi

# ------------------------------------------------------------------ #
# 2. Миграции — обязательны в любом окружении.
# ------------------------------------------------------------------ #
echo "🔄 Applying migrations..."
python manage.py migrate --noinput

# ------------------------------------------------------------------ #
# 3. collectstatic — только для production.
#    В dev статика отдаётся Django-сервером, и volume ./backend:/app
#    перекрывает /app/static; сборка там бессмысленна.
# ------------------------------------------------------------------ #
if [ "$DJANGO_ENV" = "production" ]; then
    echo "🎨 Collecting static files..."
    python manage.py collectstatic --noinput
fi

# ------------------------------------------------------------------ #
# 4. Инициализация демо/стартовых данных.
#    Запускается только если INITIAL_DATA=true.
#    Все команды должны быть идемпотентны (get_or_create внутри).
# ------------------------------------------------------------------ #
if [ "$INITIAL_DATA" = "true" ]; then
    echo "🚀 Running initial data setup..."
    python manage.py setup_roles
    python manage.py import_fsb_offices
    python manage.py add_facility_types
    python manage.py add_equipment_categories
    python manage.py add_divisions
    echo "✅ Initial data setup completed."
fi

# ------------------------------------------------------------------ #
# 5. Суперпользователь — создаётся один раз, повторный вызов
#    безопасен благодаря `|| true`.
# ------------------------------------------------------------------ #
if [ "$DJANGO_SUPERUSER_USERNAME" ] && [ "$DJANGO_SUPERUSER_PASSWORD" ] && [ "$DJANGO_SUPERUSER_EMAIL" ]; then
    echo "👤 Ensuring superuser exists..."
    python manage.py createsuperuser \
        --noinput \
        --username "$DJANGO_SUPERUSER_USERNAME" \
        --email "$DJANGO_SUPERUSER_EMAIL" || true

    # Назначаем суперпользователя в роль admin.
    python manage.py shell <<EOF
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

User = get_user_model()
group_name = 'role_admin'
group, _ = Group.objects.get_or_create(name=group_name)
try:
    user = User.objects.get(username='$DJANGO_SUPERUSER_USERNAME')
    user.groups.add(group)
    print(f"✅ Superuser {user.username} added to group {group_name}")
except User.DoesNotExist:
    pass
EOF
fi

# ------------------------------------------------------------------ #
# 6. Запуск приложения: dev — runserver, prod — gunicorn.
#    `exec` заменяет PID 1, чтобы сигналы (Ctrl+C, docker stop)
#    доходили до сервера корректно.
# ------------------------------------------------------------------ #
if [ "$DJANGO_ENV" = "development" ]; then
    echo "🛠  Starting Django dev server..."
    exec python manage.py runserver 0.0.0.0:8000
else
    echo "🚀 Starting gunicorn..."
    exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 3
fi