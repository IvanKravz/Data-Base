"""
Вспомогательные фабрики для тестов модуля «Кандидаты».

Совместимо с Python 3.9 — используем Optional[...] вместо X | None.
"""

from typing import Optional

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

from employees.models import Employee
from facilities.models import Division


def make_role_group(role_name: str) -> Group:
    """Создаёт (или достаёт) группу `role_<name>`."""
    group, _ = Group.objects.get_or_create(name=f'role_{role_name}')
    return group


def make_user(
    username: str,
    role_name: str,
    division: Optional[Division] = None,
):
    """
    Создаёт пользователя с указанной ролью и (опционально) подразделением.
    Подразделение кладём в `user_division`, чтобы не требовался Employee.
    """
    User = get_user_model()
    user = User.objects.create_user(username=username, password='test-pass')
    user.groups.add(make_role_group(role_name))
    if division is not None:
        user.user_division = division
        user.save(update_fields=['user_division'])
    return user


def make_division(name: str = 'Test Division') -> Division:
    return Division.objects.create(name=name)


def make_employee(
    full_name: str = 'Иванов И.И.',
    division: Optional[Division] = None,
) -> Employee:
    """Минимальный сотрудник — только ФИО и должность (обязательные поля)."""
    return Employee.objects.create(
        full_name=full_name,
        position='Инженер',
        division=division,
    )