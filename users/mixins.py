# mixins.py
from django.db.models import Q
from .permissions_config import ROLE_PERMISSIONS

class RoleBasedFilterMixin:
    """
    Миксин для фильтрации данных на основе ролей (ВЫСШИЙ ПРИОРИТЕТ) и подразделения (низший приоритет)
    """

    def get_queryset(self):
        queryset = super().get_queryset()
        
        if not hasattr(self, 'request') or not self.request.user.is_authenticated:
            return queryset.none()
            
        # Суперпользователи и администраторы видят все данные без фильтров
        if self.request.user.is_superuser or self.request.user.has_role('admin'):
            return queryset
            
        model_name = self.queryset.model.__name__
        
        # ПРИОРИТЕТ 1: Если пользователь имеет роли - используем ТОЛЬКО фильтры ролей
        if self._user_has_roles():
            role_filters = self._get_role_filters(model_name)
            if role_filters:
                queryset = queryset.filter(**role_filters)
            return queryset  # Роли имеют приоритет - игнорируем подразделение
            
        # ПРИОРИТЕТ 2: Если нет ролей - применяем фильтры по подразделению
        queryset = self._apply_division_filters(queryset, model_name)
        
        return queryset
    
    def _user_has_roles(self):
        """Проверяет, имеет ли пользователь системные роли"""
        return self.request.user.groups.filter(name__startswith='role_').exists()

    def _is_view_only_user(self):
        """Проверяет, имеет ли пользователь только права просмотра"""
        from .permissions import RoleBasedPermission
        return RoleBasedPermission.is_view_only_user(self.request.user)

    def _get_role_filters(self, model_name):
        """Получает фильтры из конфигурации ролей - ВЫСШИЙ ПРИОРИТЕТ"""
        from .permissions import RoleBasedPermission
        
        perm_checker = RoleBasedPermission()
        user_roles = perm_checker._get_user_roles(self.request.user)
        
        filters = {}
        for role in user_roles:
            if role in ROLE_PERMISSIONS and 'filters' in ROLE_PERMISSIONS[role]:
                role_filters = ROLE_PERMISSIONS[role]['filters']
                if model_name in role_filters:
                    # Объединяем фильтры из всех ролей пользователя
                    filters.update(role_filters[model_name])
                    
        return filters
    
    def _apply_division_filters(self, queryset, model_name):
        """Применяет фильтры по подразделению (только если нет ролей)"""
        user = self.request.user
        
        # Если у модели есть связь с подразделением и пользователь имеет подразделение
        if hasattr(queryset.model, 'division') and user.division:
            queryset = queryset.filter(division=user.division)
                
        return queryset


class UserAccessMixin:
    """
    Упрощенный миксин - роли имеют приоритет над подразделением
    """

    def get_queryset(self):
        queryset = super().get_queryset()
        
        if not hasattr(self, 'request') or not self.request.user.is_authenticated:
            return queryset.none()
            
        if self.request.user.is_superuser or self.request.user.has_role('admin'):
            return queryset

        user = self.request.user
        
        # ПРИОРИТЕТ 1: Если у пользователя есть роли - не применяем фильтры подразделения
        if user.groups.filter(name__startswith='role_').exists():
            return queryset  # Фильтрация будет в RoleBasedFilterMixin
            
        # ПРИОРИТЕТ 2: Если нет ролей - фильтруем по подразделению
        if user.division and hasattr(queryset.model, 'division'):
            return queryset.filter(division=user.division)
            
        # ПРИОРИТЕТ 3: Для обычных пользователей - только свои данные
        if hasattr(queryset.model, 'user'):
            return queryset.filter(user=user)
        elif hasattr(queryset.model, 'employee'):
            if hasattr(user, 'employee'):
                return queryset.filter(employee=user.employee)
                    
        return queryset.none()