#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Если переменная INITIAL_DATA установлена в "true", выполняем команды инициализации
if [ "$INITIAL_DATA" = "true" ]; then
    echo "🚀 Running initial data setup..."
    python manage.py setup_roles
    python manage.py import_fsb_offices
    python manage.py add_facility_types
    python manage.py add_equipment_categories
    python manage.py add_divisions
    echo "✅ Initial data setup completed."
fi

if [ "$DJANGO_SUPERUSER_USERNAME" ] && [ "$DJANGO_SUPERUSER_PASSWORD" ] && [ "$DJANGO_SUPERUSER_EMAIL" ]; then
    python manage.py createsuperuser \
        --noinput \
        --username "$DJANGO_SUPERUSER_USERNAME" \
        --email "$DJANGO_SUPERUSER_EMAIL" || true
fi

if [ "$DJANGO_SUPERUSER_USERNAME" ]; then
    python manage.py shell <<EOF
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

User = get_user_model()
group_name = 'role_admin'
group, created = Group.objects.get_or_create(name=group_name)
try:
    user = User.objects.get(username='$DJANGO_SUPERUSER_USERNAME')
    user.groups.add(group)
    print(f"Superuser {user.username} added to group {group_name}")
except User.DoesNotExist:
    pass
EOF
fi

if [ "$DJANGO_ENV" = "development" ]; then
    exec python manage.py runserver 0.0.0.0:8000
else
    exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000
fi