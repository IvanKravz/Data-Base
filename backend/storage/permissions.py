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

        # Суперпользователи и администраторы имеют полный доступ
        if user.is_superuser or self._user_has_role(user, 'admin'):
            return True

        # ---- ДОБАВЛЕНА ПРОВЕРКА ДЛЯ УДАЛЁННЫХ ОБЪЕКТОВ ----
        if hasattr(obj, 'is_deleted') and obj.is_deleted:
            # Разрешаем доступ только тем, кто может управлять корзиной:
            #   - создатель объекта
            #   - пользователь, который удалил объект
            #   - пользователь с правом CanEmptyTrash (например, руководитель)
            if hasattr(obj, 'created_by') and obj.created_by == user:
                return True
            if hasattr(obj, 'deleted_by') and obj.deleted_by == user:
                return True
            if hasattr(obj, 'uploaded_by') and obj.uploaded_by == user:
                return True
            # Дополнительно можно разрешить тем, кто имеет право очищать корзину
            from storage.permissions import CanEmptyTrash
            if CanEmptyTrash().has_permission(request, view):
                return True
            return False
        # ---- КОНЕЦ ДОБАВЛЕННОЙ ПРОВЕРКИ ----

        # Далее стандартная логика для активных объектов
        model_name = obj.__class__.__name__
        action = self._get_action(view)

        has_perm = self._check_permission(user, model_name, action)
        if not has_perm:
            return False

        if hasattr(obj, 'folder_type'):
            if obj.folder_type == 'personal':
                return obj.created_by == user
            elif obj.folder_type == 'work':
                return self._check_work_object_access(user, obj)

        elif hasattr(obj, 'file_type'):
            if obj.file_type == 'personal':
                return obj.uploaded_by == user
            elif obj.file_type == 'work':
                return self._check_work_object_access(user, obj)

        return False
    
    def _check_work_object_access(self, user, obj):
        """Упрощенная проверка доступа к рабочим объектам"""
        from users.permissions_config import ROLE_PERMISSIONS
        
        user_roles = self._get_user_roles(user)

        # ПРОВЕРКА ДЛЯ ЛИЧНЫХ ОБЪЕКТОВ
        if hasattr(obj, 'folder_type') and obj.folder_type == 'personal':
            return obj.created_by == user
        elif hasattr(obj, 'file_type') and obj.file_type == 'personal':
            return obj.uploaded_by == user
        
        # Проверяем, есть ли у пользователя роль с доступом ко всему хранилищу
        for role in user_roles:
            if role in ROLE_PERMISSIONS:
                # Доступ ко всему хранилищу
                if ROLE_PERMISSIONS[role].get('can_see_all_storage', False):
                    return True
                # Доступ ко всем подразделениям
                if ROLE_PERMISSIONS[role].get('can_see_all_divisions', False):
                    return True
        
        # Для пользователей с ролями эксплуатации - всегда разрешаем доступ к рабочим папкам
        if any(role in ['exploitation_chief', 'exploitation_employee'] for role in user_roles):
            return True
        
        # Проверяем личные объекты (на всякий случай)
        if hasattr(obj, 'created_by') and obj.created_by == user:
            return True
        if hasattr(obj, 'uploaded_by') and obj.uploaded_by == user:
            return True
        
        # Получаем подразделение пользователя
        user_division = getattr(user, 'division', None)
        if not user_division and hasattr(user, 'employee') and user.employee:
            user_division = getattr(user.employee, 'division', None)
        
        # Если у пользователя нет подразделения - разрешаем доступ для эксплуатации
        if not user_division and any(role in ['exploitation_chief', 'exploitation_employee'] for role in user_roles):
            return True
        
        # Проверяем подразделение объекта
        obj_division = getattr(obj, 'division', None)
        
        # Если у объекта нет подразделения
        if not obj_division:
            # Проверяем цепочку родителей
            if hasattr(obj, 'parent') and obj.parent:
                return self._check_work_object_access(user, obj.parent)
            elif hasattr(obj, 'folder') and obj.folder:
                return self._check_work_object_access(user, obj.folder)
            # Если это корневой объект без подразделения - разрешаем
            return True
        
        # Если у пользователя нет подразделения, но объект имеет - запрещаем
        if not user_division:
            return False
            
        # Проверяем совпадение подразделений
        return user_division.id == obj_division.id
    
    def _get_action(self, view):
        """Получает действие из view с маппингом кастомных действий"""
        if hasattr(view, 'action'):
            # Маппинг кастомных действий на стандартные разрешения
            custom_action_map = {
                # Папки
                'path': 'view',  # ДОБАВЛЕНО: action 'path' требует права 'view'
                'pin': 'change',
                'contents': 'view',
                'move': 'change',
                'rename': 'change',
                'soft_delete': 'delete',
                'restore': 'change',
                'trash': 'view',
                'empty_trash': 'delete',
                'pinned': 'view',
                'check_access': 'view',
                'batch_move': 'change',
                
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