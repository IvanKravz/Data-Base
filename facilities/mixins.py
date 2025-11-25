# facilities/mixins.py
from rest_framework.exceptions import PermissionDenied

class DivisionAccessMixin:
    """
    Миксин для автоматической фильтрации queryset по подразделению пользователя
    """
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Админы и суперпользователи видят все
        if user.is_superuser or (hasattr(user, 'has_role') and user.has_role('admin')):
            return queryset
            
        # Пользователи с глобальным просмотром видят все
        if getattr(user, 'is_global_view', False):
            return queryset
            
        # Руководители видят все подразделения
        if ((hasattr(user, 'has_role') and user.has_role('leader')) or 
            (hasattr(user, 'has_role') and user.has_role('deputy_director'))):
            return queryset
            
        # Роли эксплуатации видят только свое подразделение
        if ((hasattr(user, 'has_role') and user.has_role('exploitation_chief')) or
            (hasattr(user, 'has_role') and user.has_role('exploitation_employee'))):
            user_division = getattr(user, 'division', None)
            if user_division:
                return self._filter_by_division(queryset, user_division)
            return queryset.none()
            
        # Получаем подразделение пользователя
        user_division = getattr(user, 'division', None)
        if not user_division:
            return queryset.none()
            
        # Фильтруем по подразделению пользователя
        return self._filter_by_division(queryset, user_division)
    
    def _filter_by_division(self, queryset, user_division):
        """Фильтрует queryset по подразделению пользователя"""
        # Для моделей с прямым полем division
        if hasattr(queryset.model, 'division'):
            return queryset.filter(division=user_division)
            
        # Для моделей с division_id
        if hasattr(queryset.model, 'division_id'):
            return queryset.filter(division_id=user_division.id)
            
        return queryset.none()


class BaseViewSetMixin:
    """
    Базовый миксин с общей логикой для всех ViewSet'ов объектов
    """
    
    def check_view_only_restrictions(self):
        """Проверяет ограничения для пользователей с правами только на просмотр"""
        from users.permissions import RoleBasedPermission  # Исправлен импорт
        if RoleBasedPermission.is_view_only_user(self.request.user):
            if self.action in ['create', 'update', 'partial_update', 'destroy']:
                raise PermissionDenied('Ваши роли позволяют только просматривать данные без возможности изменений')

    def create(self, request, *args, **kwargs):
        self.check_view_only_restrictions()
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self.check_view_only_restrictions()
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self.check_view_only_restrictions()
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self.check_view_only_restrictions()
        return super().destroy(request, *args, **kwargs)