# storage/permissions.py
from rest_framework import permissions
from django.db.models import Q
# Импортируем из users.permissions, а не из текущего модуля
from users.permissions import RoleBasedPermission


class StoragePermission(RoleBasedPermission):
    """Разрешения для системы хранилища с учетом ролевой модели"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        # Суперпользователи и администраторы имеют все права
        if request.user.is_superuser or self._user_has_role(request.user, 'admin'):
            return True
            
        # Получаем модель и действие
        model_name = self._get_model_name(view)
        action = self._get_action(view)
        
        if not model_name:
            return True
            
        # Проверяем права пользователя
        return self._check_permission(request.user, model_name, action)
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Суперпользователи и администраторы имеют все права к объектам
        if user.is_superuser or self._user_has_role(user, 'admin'):
            return True
            
        # Получаем модель и действие
        model_name = obj.__class__.__name__
        action = self._get_action(view)
        
        # Проверяем базовые права
        has_perm = self._check_permission(user, model_name, action)
        if not has_perm:
            return False
        
        # Проверяем доступ на основе типа (личное/рабочее)
        if hasattr(obj, 'folder_type'):
            # Папка
            if obj.folder_type == 'personal':
                # Личные папки - только владелец
                return obj.created_by == user
            elif obj.folder_type == 'work':
                # Рабочие папки - проверяем доступ к подразделению
                return self._check_division_access(user, obj)
                
        elif hasattr(obj, 'file_type'):
            # Файл
            if obj.file_type == 'personal':
                # Личные файлы - только владелец
                return obj.uploaded_by == user
            elif obj.file_type == 'work':
                # Рабочие файлы - проверяем доступ к подразделению
                return self._check_division_access(user, obj)
        
        return False
    
    def _check_division_access(self, user, obj):
        """Проверяет доступ к объекту на основе подразделения"""
        from users.permissions_config import ROLE_PERMISSIONS
        
        user_roles = self._get_user_roles(user)
        
        # Проверяем, есть ли у пользователя роль, которая может видеть все подразделения
        for role in user_roles:
            if role in ROLE_PERMISSIONS and ROLE_PERMISSIONS[role].get('can_see_all_divisions', False):
                return True
            if role in ROLE_PERMISSIONS and ROLE_PERMISSIONS[role].get('can_see_all_storage', False):
                return True
        
        # Получаем подразделение пользователя
        user_division = getattr(user, 'division', None)
        if not user_division and hasattr(user, 'employee') and user.employee:
            user_division = getattr(user.employee, 'division', None)
        
        # Если у пользователя нет подразделения - проверяем личный доступ
        if not user_division:
            if hasattr(obj, 'folder_type') and obj.folder_type == 'personal':
                return obj.created_by == user
            elif hasattr(obj, 'file_type') and obj.file_type == 'personal':
                return obj.uploaded_by == user
            return False
            
        # Проверяем подразделение объекта
        obj_division = getattr(obj, 'division', None)
        if not obj_division:
            return False
            
        return user_division.id == obj_division.id
    
    def _get_action(self, view):
        """Получает действие из view с маппингом кастомных действий"""
        if hasattr(view, 'action'):
            # Маппинг кастомных действий на стандартные разрешения
            custom_action_map = {
                # Папки
                'pin': 'change',
                'contents': 'view',
                'move': 'change',
                'rename': 'change',
                'soft_delete': 'delete',
                'restore': 'change',
                'trash': 'view',
                'empty_trash': 'delete',
                'pinned': 'view',
                
                # Файлы
                'download': 'view',
                'upload_multiple': 'add',
                'hard_delete': 'delete',
                'recent': 'view',
                'statistics': 'view',
                
                # Общие ссылки
                'toggle': 'change',
                'download_shared': 'view',
                
                # Избранное
                'all': 'view',
                'toggle': 'change',
            }
            
            action = view.action
            return custom_action_map.get(action, action)
        
        # Используем родительский метод, если action нет в маппинге
        return super()._get_action(view)


class HasFolderAccess(StoragePermission):
    """Проверка доступа к папкам"""
    
    def has_object_permission(self, request, view, obj):
        # Используем базовую проверку StoragePermission
        return super().has_object_permission(request, view, obj)


class HasFileAccess(StoragePermission):
    """Проверка доступа к файлам"""
    
    def has_object_permission(self, request, view, obj):
        # Используем базовую проверку StoragePermission
        return super().has_object_permission(request, view, obj)


class CanShareFiles(permissions.BasePermission):
    """Проверка, может ли пользователь делиться файлами"""
    
    def has_permission(self, request, view):
        from users.permissions_config import ROLE_PERMISSIONS
        
        if not request.user.is_authenticated:
            return False
        
        user_roles = self._get_user_roles(request.user)
        
        # Администраторы и руководители могут делиться файлами
        allowed_roles = ['admin', 'leader', 'deputy_director']
        for role in user_roles:
            if role in allowed_roles:
                return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        # Проверяем, что файл рабочий (не личный)
        if hasattr(obj, 'file_type') and obj.file_type != 'work':
            return False
        
        # Проверяем, что пользователь может редактировать файл
        file_perm = HasFileAccess()
        return file_perm.has_object_permission(request, view, obj)
    
    def _get_user_roles(self, user):
        from users.permissions_config import get_role_from_group
        
        roles = []
        for group in user.groups.all():
            role = get_role_from_group(group.name)
            if role:
                roles.append(role)
        return roles


class CanViewAllStorage(permissions.BasePermission):
    """Проверка, может ли пользователь видеть все хранилище"""
    
    def has_permission(self, request, view):
        from users.permissions_config import ROLE_PERMISSIONS
        
        if not request.user.is_authenticated:
            return False
        
        user_roles = self._get_user_roles(request.user)
        
        # Проверяем, есть ли у пользователя роль с доступом ко всему хранилищу
        for role in user_roles:
            if role in ROLE_PERMISSIONS and ROLE_PERMISSIONS[role].get('can_see_all_storage', False):
                return True
        
        return False
    
    def _get_user_roles(self, user):
        from users.permissions_config import get_role_from_group
        
        roles = []
        for group in user.groups.all():
            role = get_role_from_group(group.name)
            if role:
                roles.append(role)
        return roles


class CanEmptyTrash(permissions.BasePermission):
    """Проверка, может ли пользователь очищать корзину"""
    
    def has_permission(self, request, view):
        from users.permissions_config import ROLE_PERMISSIONS
        
        if not request.user.is_authenticated:
            return False
        
        user_roles = self._get_user_roles(request.user)
        
        # Администраторы и руководители могут очищать корзину
        allowed_roles = ['admin', 'leader']
        for role in user_roles:
            if role in allowed_roles:
                return True
        
        return False
    
    def _get_user_roles(self, user):
        from users.permissions_config import get_role_from_group
        
        roles = []
        for group in user.groups.all():
            role = get_role_from_group(group.name)
            if role:
                roles.append(role)
        return roles


# Дополнительные классы разрешений для конкретных действий
class CanUploadFiles(StoragePermission):
    """Проверка возможности загрузки файлов"""
    
    def has_permission(self, request, view):
        if request.method == 'POST' and hasattr(view, 'action'):
            if view.action == 'upload_multiple':
                return super()._check_permission(request.user, 'StorageFile', 'add')
        return super().has_permission(request, view)


class CanDeletePermanently(StoragePermission):
    """Проверка возможности полного удаления"""
    
    def has_permission(self, request, view):
        if hasattr(view, 'action') and view.action == 'hard_delete':
            return super()._check_permission(request.user, 'StorageFile', 'delete')
        return super().has_permission(request, view)