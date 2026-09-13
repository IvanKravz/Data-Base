# users/mixins.py
from django.db.models import Q
from .permissions_config import ROLE_PERMISSIONS, USER_DIVISION_MARKER, USER_SUBDIVISION_MARKER

class RoleBasedFilterMixin:
    """
    Миксин для фильтрации данных на основе ролей пользователя.
    Фильтрация применяется только для списков (list).
    Для операций с конкретным объектом (retrieve, update, delete) фильтрация не применяется,
    чтобы объект был найден, а затем проверялись права через permission.
    """

    def get_queryset(self):
        queryset = super().get_queryset()
        
        if not hasattr(self, 'request') or not self.request.user.is_authenticated:
            return queryset.none()
            
        # Для retrieve, update, partial_update, destroy – не применяем фильтрацию
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return queryset
            
        # Суперпользователи и администраторы видят все данные
        if self.request.user.is_superuser or self._user_has_role('admin'):
            return queryset
            
        model_name = self.queryset.model.__name__
        user_roles = self._get_user_roles()
        
        # Проверяем, может ли пользователь видеть все подразделения
        can_see_all = self._can_see_all_divisions()
        
        # Если может видеть все – применяем только фильтры из ролей (если есть)
        if can_see_all:
            role_filters = self._get_role_filters(model_name)
            if role_filters:
                queryset = queryset.filter(**role_filters)
            return queryset
        
        # Если есть роли с явными фильтрами – применяем их (приоритет)
        if self._user_has_roles():
            role_filters = self._get_role_filters(model_name)
            if role_filters:
                queryset = queryset.filter(**role_filters)
                return queryset
        
        # Иначе – фильтруем по подразделению пользователя
        user_division = self.request.user.division
        
        # Если модель имеет поле 'division' – фильтруем по нему
        if user_division and hasattr(queryset.model, 'division'):
            queryset = queryset.filter(division=user_division)
        # Для модели Division (нет поля division) – фильтруем по id
        elif user_division and model_name == 'Division':
            queryset = queryset.filter(id=user_division.id)
        else:
            # Если у пользователя нет подразделения и он не видит все – возвращаем пустой queryset
            return queryset.none()
        
        return queryset

    def _can_see_all_divisions(self):
        """Возвращает True, если пользователь может видеть все подразделения."""
        user_roles = self._get_user_roles()
        return any(
            ROLE_PERMISSIONS.get(role, {}).get('can_see_all_divisions', False)
            for role in user_roles
        )
    
    def _user_has_roles(self):
        """Проверяет, имеет ли пользователь системные роли (группы)"""
        return self.request.user.groups.filter(name__startswith='role_').exists()

    def _user_has_role(self, role_name):
        """Проверяет наличие конкретной роли у пользователя"""
        from .permissions import RoleBasedPermission
        perm_checker = RoleBasedPermission()
        return perm_checker._user_has_role(self.request.user, role_name)

    def _get_user_roles(self):
        """Возвращает список ролей пользователя"""
        from .permissions import RoleBasedPermission
        perm_checker = RoleBasedPermission()
        return perm_checker._get_user_roles(self.request.user)

    def _get_role_filters(self, model_name):
        """
        Собирает фильтры из всех ролей пользователя для указанной модели.
        Подставляет динамические маркеры (USER_DIVISION_MARKER, USER_SUBDIVISION_MARKER)
        реальными ID из профиля пользователя.
        Если у пользователя нет соответствующего подразделения, фильтр с маркером не применяется.
        """
        from .permissions import RoleBasedPermission
        perm_checker = RoleBasedPermission()
        user_roles = perm_checker._get_user_roles(self.request.user)
        
        # Получаем ID подразделений пользователя (могут быть None)
        user = self.request.user
        user_division_id = user.division.id if user.division else None
        user_subdivision_id = user.subdivision.id if user.subdivision else None

        filters = {}
        for role in user_roles:
            if role in ROLE_PERMISSIONS and 'filters' in ROLE_PERMISSIONS[role]:
                role_filters = ROLE_PERMISSIONS[role]['filters']
                if model_name in role_filters:
                    for key, value in role_filters[model_name].items():
                        if value == USER_DIVISION_MARKER:
                            if user_division_id is not None:
                                filters[key] = user_division_id
                            # Если None – пропускаем
                        elif value == USER_SUBDIVISION_MARKER:
                            if user_subdivision_id is not None:
                                filters[key] = user_subdivision_id
                            # Если None – пропускаем
                        else:
                            # Статическое значение – просто копируем
                            filters[key] = value
        return filters


class UserAccessMixin:
    """
    Упрощённый миксин для доступа к пользователям (только свои данные для не-админов)
    """
    def get_queryset(self):
        queryset = super().get_queryset()
        if not hasattr(self, 'request') or not self.request.user.is_authenticated:
            return queryset.none()
        if self.request.user.is_superuser or self._user_has_role('admin'):
            return queryset
        
        user = self.request.user
        # Ограничиваем только текущим пользователем
        return queryset.filter(id=user.id)
    
    def _user_has_role(self, role_name):
        from .permissions import RoleBasedPermission
        perm_checker = RoleBasedPermission()
        return perm_checker._user_has_role(self.request.user, role_name)