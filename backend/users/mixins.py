# users/mixins.py
from django.db.models import Q

from .permissions_config import (
    ROLE_PERMISSIONS,
    USER_DIVISION_MARKER,
    USER_SUBDIVISION_MARKER,
)


# Сентинел: «доступ без ограничений»
ALL_ACCESS = object()


class RoleBasedFilterMixin:
    """
    Фильтрация данных на основе ролей пользователя.

    Логика мультиролей:
    - Если хотя бы одна роль даёт «без ограничений» (can_see_all_divisions=True
      и для модели нет явных фильтров) — итог = ALL_ACCESS.
    - Иначе фильтры всех ролей объединяются через OR.
    - Если у роли есть фильтр с маркером (USER_DIVISION_MARKER и т.п.), но у
      пользователя соответствующее поле = None, то роль не даёт вклада.
    - Если ни одна роль не даёт доступа — queryset.none().

    Разделение read/write:
    - Для безопасных действий (list, retrieve) применяется `filters[model]`.
    - Для изменяющих (create, update, partial_update, destroy) применяется
      `write_filters[model]`; если он для модели не задан — берётся
      `filters[model]` (обратная совместимость).
    """

    # Действия, для которых применяется write-фильтр
    WRITE_ACTIONS = {'create', 'update', 'partial_update', 'destroy'}

    def get_queryset(self):
        queryset = super().get_queryset()

        if not hasattr(self, 'request') or not self.request.user.is_authenticated:
            return queryset.none()

        if self.request.user.is_superuser or self._user_has_role('admin'):
            return queryset

        mode = 'write' if self.action in self.WRITE_ACTIONS else 'read'
        model_name = self.queryset.model.__name__
        result = self._build_role_q(model_name, mode=mode)

        if result is None:
            return queryset.none()
        if result is ALL_ACCESS:
            return queryset
        return queryset.filter(result)

    # ------------------------------------------------------------------ #
    # Внутренние методы                                                  #
    # ------------------------------------------------------------------ #

    def _build_role_q(self, model_name, mode='read'):
        """
        Возвращает:
          - None         — доступа нет;
          - ALL_ACCESS   — доступ без ограничений;
          - Q(...)       — доступ с ограничением.

        mode:
          - 'read'  — использовать cfg['filters'][model_name]
          - 'write' — использовать cfg['write_filters'][model_name] (если нет —
                      fallback на cfg['filters'][model_name])
        """
        user = self.request.user
        user_roles = self._get_user_roles()
        user_division_id = user.division.id if user.division else None
        user_subdivision_id = user.subdivision.id if user.subdivision else None

        final_q = None

        for role in user_roles:
            cfg = ROLE_PERMISSIONS.get(role)
            if not cfg:
                continue

            models = cfg.get('models', {})
            if model_name not in models or 'view' not in models[model_name]:
                continue

            if mode == 'write':
                write_filters = cfg.get('write_filters', {})
                if model_name in write_filters:
                    filters = write_filters[model_name]
                else:
                    filters = cfg.get('filters', {}).get(model_name)
            else:
                filters = cfg.get('filters', {}).get(model_name)

            if filters:
                role_q = Q()
                skip = False
                for key, value in filters.items():
                    if value == USER_DIVISION_MARKER:
                        if user_division_id is None:
                            skip = True
                            break
                        role_q &= Q(**{key: user_division_id})
                    elif value == USER_SUBDIVISION_MARKER:
                        if user_subdivision_id is None:
                            skip = True
                            break
                        role_q &= Q(**{key: user_subdivision_id})
                    else:
                        role_q &= Q(**{key: value})
                if skip:
                    continue
                final_q = role_q if final_q is None else (final_q | role_q)
                continue

            # Явных фильтров для модели нет
            if cfg.get('can_see_all_divisions'):
                return ALL_ACCESS

            # Фолбэк по division пользователя
            if user_division_id is None:
                continue
            if model_name == 'Division':
                fallback_q = Q(id=user_division_id)
            elif hasattr(self.queryset.model, 'division'):
                fallback_q = Q(division_id=user_division_id)
            else:
                continue
            final_q = fallback_q if final_q is None else (final_q | fallback_q)

        return final_q

    # ------------------------------------------------------------------ #
    # Хелперы для RoleBasedPermission                                    #
    # ------------------------------------------------------------------ #

    def _user_has_role(self, role_name):
        from .permissions import RoleBasedPermission
        return RoleBasedPermission()._user_has_role(self.request.user, role_name)

    def _get_user_roles(self):
        from .permissions import RoleBasedPermission
        return RoleBasedPermission()._get_user_roles(self.request.user)

    # ------------------------------------------------------------------ #
    # Legacy-методы (обратная совместимость)                             #
    # ------------------------------------------------------------------ #

    def _can_see_all_divisions(self):
        """DEPRECATED. Оставлено для обратной совместимости."""
        user_roles = self._get_user_roles()
        return any(
            ROLE_PERMISSIONS.get(role, {}).get('can_see_all_divisions', False)
            for role in user_roles
        )

    def _user_has_roles(self):
        """DEPRECATED. Есть ли у пользователя системные роли."""
        return self.request.user.groups.filter(name__startswith='role_').exists()

    def _get_role_filters(self, model_name):
        """DEPRECATED. Плоский dict-фильтр (объединение ключей всех ролей)."""
        user = self.request.user
        user_division_id = user.division.id if user.division else None
        user_subdivision_id = user.subdivision.id if user.subdivision else None

        filters = {}
        for role in self._get_user_roles():
            cfg = ROLE_PERMISSIONS.get(role)
            if not cfg:
                continue
            role_filters = cfg.get('filters', {}).get(model_name)
            if not role_filters:
                continue
            for key, value in role_filters.items():
                if value == USER_DIVISION_MARKER:
                    if user_division_id is not None:
                        filters[key] = user_division_id
                elif value == USER_SUBDIVISION_MARKER:
                    if user_subdivision_id is not None:
                        filters[key] = user_subdivision_id
                else:
                    filters[key] = value
        return filters


class UserAccessMixin:
    """Упрощённый миксин: не-админ видит только себя."""

    def get_queryset(self):
        queryset = super().get_queryset()
        if not hasattr(self, 'request') or not self.request.user.is_authenticated:
            return queryset.none()
        if self.request.user.is_superuser or self._user_has_role('admin'):
            return queryset
        return queryset.filter(id=self.request.user.id)

    def _user_has_role(self, role_name):
        from .permissions import RoleBasedPermission
        return RoleBasedPermission()._user_has_role(self.request.user, role_name)