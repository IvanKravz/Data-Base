# users/permissions.py
from rest_framework import permissions
from django.contrib.auth.models import Group

class RoleBasedPermission(permissions.BasePermission):
    """
    Разрешения на основе ролей пользователя
    """
    
    @staticmethod
    def is_view_only_user(user):
        """Статический метод для проверки прав только на просмотр"""
        from .permissions_config import get_role_from_group
        
        user_roles = []
        for group in user.groups.all():
            role = get_role_from_group(group.name)
            if role:
                user_roles.append(role)
                
        view_only_roles = ['leader']
        
        # Если пользователь является админом или суперпользователем, то он не view_only
        if 'admin' in user_roles or user.is_superuser:
            return False
        
        # Если у пользователя есть хотя бы одна роль не из view_only_roles - не view_only
        for role in user_roles:
            if role not in view_only_roles:
                return False
                
        # Если дошли сюда, значит все роли пользователя в view_only_roles
        return bool(user_roles)

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # Суперпользователи и администраторы имеют все права
        if request.user.is_superuser or self._user_has_role(request.user, 'admin'):
            return True
        
        # Кастомные административные действия – разрешаем только админам
        if hasattr(view, 'action') and view.action in ['set_2fa', 'disable_2fa']:
            return request.user.is_superuser or self._user_has_role(request.user, 'admin')
            
        # Получаем модель и действие
        model_name = self._get_model_name(view)
        action = self._get_action(view)
        
        if not model_name:
            return True
            
        # Проверяем права пользователя
        return self._check_permission(request.user, model_name, action)
    
    def has_object_permission(self, request, view, obj):
        # Суперпользователи и администраторы имеют все права к объектам
        if request.user.is_superuser or self._user_has_role(request.user, 'admin'):
            return True
            
        model_name = obj.__class__.__name__
        action = self._get_action(view)
        
        # Проверяем наличие прав на модель
        has_perm = self._check_permission(request.user, model_name, action)
        if not has_perm:
            return False
        
        # Для ролей только с просмотром - всегда разрешаем доступ к объекту
        if self.is_view_only_user(request.user):
            return True
            
        # Проверяем доступ на основе подразделения для всех моделей,
        # которые имеют отношение к подразделению (включая саму Division)
        return self._check_division_access(request.user, obj)
    
    def _check_permission(self, user, model_name, action):
        """Проверяет разрешение для модели и действия"""
        from .permissions_config import ROLE_PERMISSIONS
        
        user_roles = self._get_user_roles(user)
        
        # Если пользователь имеет только роли с правами просмотра - ограничиваем действия
        if self.is_view_only_user(user) and action not in ['list', 'retrieve', 'view']:
            return False
        
        for role in user_roles:
            if role in ROLE_PERMISSIONS:
                role_config = ROLE_PERMISSIONS[role]
                if model_name in role_config['models']:
                    required_permission = self._map_action_to_permission(action)
                    if required_permission in role_config['models'][model_name]:
                        return True
        return False

    def _check_division_access(self, user, obj):
        """
        Проверяет доступ к объекту на основе подразделения и фильтров роли.

        Фильтры для модели могут быть заданы:
          - как dict        — все условия AND;
          - как list[dict]  — OR альтернатив, внутри каждой — AND.

        Для каждой альтернативы строится Q и прогоняется через ORM —
        тот же Q, что применяется в queryset. Это гарантирует согласованность:
        если объект виден в списке, он доступен и при retrieve.
        """
        from django.db.models import Q
        from .permissions_config import (
            ROLE_PERMISSIONS,
            USER_DIVISION_MARKER,
            USER_SUBDIVISION_MARKER,
        )

        user_roles = self._get_user_roles(user)
        model_name = obj.__class__.__name__

        for role in user_roles:
            cfg = ROLE_PERMISSIONS.get(role)
            if not cfg:
                continue
            if model_name not in cfg.get('models', {}):
                continue
            if 'view' not in cfg['models'][model_name]:
                continue

            role_filters = cfg.get('filters', {}).get(model_name)

            # Роль без явных фильтров
            if not role_filters:
                if cfg.get('can_see_all_divisions', False):
                    return True
                if not user.division:
                    continue
                if model_name == 'Division':
                    if obj.id == user.division.id:
                        return True
                else:
                    obj_div = getattr(obj, 'division', None)
                    if obj_div is None or obj_div.id == user.division.id:
                        return True
                continue

            # Приводим фильтры к списку альтернатив
            if isinstance(role_filters, dict):
                alternatives = [role_filters]
            else:
                alternatives = list(role_filters)

            for alt in alternatives:
                if not isinstance(alt, dict):
                    continue

                q = Q()
                valid = True
                for key, value in alt.items():
                    if value == USER_DIVISION_MARKER:
                        if user.division is None:
                            valid = False
                            break
                        q &= Q(**{key: user.division.id})
                    elif value == USER_SUBDIVISION_MARKER:
                        if user.subdivision is None:
                            valid = False
                            break
                        q &= Q(**{key: user.subdivision.id})
                    else:
                        q &= Q(**{key: value})

                if not valid:
                    continue

                try:
                    if obj.__class__.objects.filter(q, pk=obj.pk).exists():
                        return True
                except Exception:
                    # Если фильтр содержит нестандартные lookup'ы — пропускаем
                    continue

        # Дополнительная защита для ролей только-просмотр
        if self.is_view_only_user(user):
            return True

        return False
        
    def _get_user_roles(self, user):
        """Получает роли пользователя"""
        from .permissions_config import get_role_from_group
        
        roles = []
        for group in user.groups.all():
            role = get_role_from_group(group.name)
            if role:
                roles.append(role)
        return roles
    
    def _user_has_role(self, user, role_name):
        """Проверяет, есть ли у пользователя конкретная роль"""
        user_roles = self._get_user_roles(user)
        return role_name in user_roles
    
    def _get_model_name(self, view):
        """Получает имя модели из view"""
        if hasattr(view, 'queryset') and view.queryset is not None:
            return view.queryset.model.__name__
        elif hasattr(view, 'model'):
            return view.model.__name__
        return None
    
    def _get_action(self, view):
        if hasattr(view, 'action'):
            action = view.action
            # Стандартные действия DRF
            if action in ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy']:
                return action
            # Для кастомных действий определяем по методу запроса
            if hasattr(view, 'request'):
                method = view.request.method.lower()
                if method == 'get':
                    return 'view'
                elif method == 'post':
                    return 'add'          # или 'change' – зависит от логики
                elif method in ['put', 'patch']:
                    return 'change'
                elif method == 'delete':
                    return 'delete'
            # fallback
            return action
        # Для APIView без action
        if hasattr(view, 'request'):
            return view.request.method.lower()
        return 'view'
    
    def _map_action_to_permission(self, action):
        """Сопоставляет действие DRF с разрешением"""
        action_map = {
            'list': 'view',
            'retrieve': 'view',
            'create': 'add',
            'update': 'change',
            'partial_update': 'change',
            'destroy': 'delete'
        }
        return action_map.get(action, action)


class IsAdmin(permissions.BasePermission):
    """Только для администраторов (superuser или роль admin)"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        from .permissions_config import get_role_from_group
        for group in request.user.groups.all():
            role = get_role_from_group(group.name)
            if role == 'admin':
                return True
        return False