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
                
        view_only_roles = ['leader', 'head_of_section_1_1']
        
        # Если пользователь является админом или суперпользователем, то он не view_only
        if 'admin' in user_roles or user.is_superuser:
            return False
        
        # Если у пользователя есть хотя бы одна роль не из view_only_roles - не view_only
        for role in user_roles:
            if role not in view_only_roles:
                return False
                
        # Если дошли сюда, значит все роли пользователя в view_only_roles
        return bool(user_roles)  # если есть хотя бы одна view_only роль, то True
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # Суперпользователи и администраторы имеют все права
        if request.user.is_superuser or request.user.has_role('admin'):
            return True
            
        # Получаем модель и действие
        model_name = self._get_model_name(view)
        action = self._get_action(view)
        
        if not model_name:
            return True
            
        # Проверяем права пользователя
        return self._check_permission(request.user, model_name, action)
    
    def has_object_permission(self, request, view, obj):
        # Суперпользователи и администраторы имеют все права к объектам
        if request.user.is_superuser or request.user.has_role('admin'):
            return True
            
        # Дополнительные проверки на уровне объекта
        model_name = obj.__class__.__name__
        action = self._get_action(view)
        
        has_perm = self._check_permission(request.user, model_name, action)
        
        # Для ролей только с просмотром - всегда разрешаем доступ к объекту
        if has_perm and self.is_view_only_user(request.user):
            return True
            
        # Применяем специфичные проверки для объектов
        if has_perm and hasattr(obj, 'division'):
            return self._check_division_access(request.user, obj)
            
        return has_perm
    
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
        """Проверяет доступ к объекту на основе подразделения"""
        # Для пользователей с правами только на просмотр - разрешаем доступ ко всем подразделениям
        if self.is_view_only_user(user):
            return True
            
        # Используем свойство division, которое возвращает актуальное подразделение
        user_division = user.division
        if user_division and obj.division:
            return user_division.id == obj.division.id
        return True
    
    def _get_user_roles(self, user):
        """Получает роли пользователя"""
        from .permissions_config import get_role_from_group
        
        roles = []
        for group in user.groups.all():
            role = get_role_from_group(group.name)
            if role:
                roles.append(role)
        return roles
    
    def _get_model_name(self, view):
        """Получает имя модели из view"""
        if hasattr(view, 'queryset'):
            return view.queryset.model.__name__
        elif hasattr(view, 'model'):
            return view.model.__name__
        return None
    
    def _get_action(self, view):
        """Получает действие из view"""
        if hasattr(view, 'action'):
            return view.action
        method = getattr(view, 'request', None)
        if method:
            return method.method.lower()
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
    """Только для администраторов"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_superuser or 
            request.user.has_role('admin')
        )