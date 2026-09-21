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
        """
        from .permissions_config import (
            ROLE_PERMISSIONS,
            USER_DIVISION_MARKER,
            USER_SUBDIVISION_MARKER,
        )

        user_roles = self._get_user_roles(user)
        model_name = obj.__class__.__name__

        # Если хотя бы одна роль без ограничений по подразделениям
        # и без фильтров — доступ разрешён.
        for role in user_roles:
            cfg = ROLE_PERMISSIONS.get(role)
            if not cfg:
                continue
            if model_name not in cfg.get('models', {}):
                continue
            if 'view' not in cfg['models'][model_name]:
                continue

            role_filters = cfg.get('filters', {}).get(model_name)

            if not role_filters:
                if cfg.get('can_see_all_divisions', False):
                    return True
                # Фолбэк: только своё подразделение
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

            # У роли есть фильтры — проверяем их вручную
            match = True
            for key, value in role_filters.items():
                if value == USER_DIVISION_MARKER:
                    value = user.division.id if user.division else None
                elif value == USER_SUBDIVISION_MARKER:
                    value = user.subdivision.id if user.subdivision else None

                # Разбираем lookup (например, "category__value__in")
                parts = key.split('__')
                attr = obj
                for p in parts[:-1]:
                    attr = getattr(attr, p, None)
                    if attr is None:
                        break
                last = parts[-1]

                if attr is None:
                    match = False
                    break

                # Обрабатываем __in, __contains и т.п.
                if last == 'in':
                    if not isinstance(value, (list, tuple, set)):
                        match = False
                        break
                    if getattr(obj, parts[-2], None) not in value:
                        match = False
                        break
                elif last == 'icontains':
                    if value.lower() not in str(attr).lower():
                        match = False
                        break
                else:
                    if getattr(attr, last, None) != value:
                        match = False
                        break

            if match:
                return True

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