# users/models.py (исправленные импорты)
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.db.models.signals import post_save
from django.dispatch import receiver
from facilities.models import Division, Subdivision
import logging
from threading import local
from django.contrib.auth.models import Group
from .permissions_config import ROLE_PERMISSIONS, get_role_from_group

logger = logging.getLogger(__name__)

_thread_locals = local()
logger = logging.getLogger(__name__)

def get_current_request():
    """Получение текущего запроса из thread local storage"""
    return getattr(_thread_locals, 'request', None)

def set_current_request(request):
    """Установка текущего запроса в thread local storage"""
    _thread_locals.request = request


class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('Username is required')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, password, **extra_fields)


class User(AbstractUser):
    employee = models.OneToOneField(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user_account',
        verbose_name='Сотрудник'
    )
    user_division = models.ForeignKey(
        Division,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        verbose_name='Подразделение пользователя'
    )
    user_subdivision = models.ForeignKey(
        Subdivision,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        verbose_name='Отделение пользователя'
    )
    is_global_view = models.BooleanField(
        default=False,
        verbose_name='Глобальный режим просмотра'
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='custom_user_set',
        related_query_name='custom_user'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='custom_user_set',
        related_query_name='custom_user'
    )

    objects = UserManager()

    class Meta:
        verbose_name = 'Учетная запись'
        verbose_name_plural = 'Учетные записи'
        ordering = ('username',)

    def __str__(self):
        return self.username
    
    def get_division_for_filter(self):
        """Безопасное получение подразделения для фильтрации"""
        division = self.division
        if division:
            return division.id
        return None
    
    def has_division_access(self, obj):
        """Проверка доступа к объекту на основе подразделения"""
        if self.is_superuser or self.has_role('admin'):
            return True
            
        user_division = self.division
        obj_division = getattr(obj, 'division', None)
        
        if not user_division or not obj_division:
            return False
            
        return user_division.id == obj_division.id
    
    @property
    def division(self):
        if self.employee and self.employee.division:
            return self.employee.division
        return self.user_division
    
    @property
    def subdivision(self):
        if self.employee and self.employee.subdivision:
            return self.employee.subdivision
        return self.user_subdivision
    
    def has_role(self, role_name):
        from .permissions_config import get_group_name
        return self.groups.filter(name=get_group_name(role_name)).exists()
    
    def get_roles(self):
        from .permissions_config import get_role_from_group
        
        roles = []
        for group in self.groups.filter(name__startswith='role_'):
            role = get_role_from_group(group.name)
            if role:
                roles.append(role)
        return roles
    
    def has_module_permission(self, module_name):
        if self.is_superuser or self.has_role('admin'):
            return True
            
        from .permissions_config import ROLE_PERMISSIONS
        
        user_roles = self.get_roles()
        for role in user_roles:
            if role in ROLE_PERMISSIONS:
                role_config = ROLE_PERMISSIONS[role]
                model_mapping = {
                    'employees': 'Employee',
                    'equipment': 'Equipment', 
                    'facilities': 'Facility',
                    'tasks': 'Task',
                    'networks': 'CommunicationNetwork'
                }
                
                if module_name in model_mapping:
                    model_name = model_mapping[module_name]
                    if model_name in role_config['models']:
                        return True
        return False
    
    def can_edit_module(self, module_name):
        if self.is_superuser or self.has_role('admin'):
            return True
            
        from .permissions_config import ROLE_PERMISSIONS
        from .permissions import RoleBasedPermission
        
        if RoleBasedPermission.is_view_only_user(self):
            return False
            
        user_roles = self.get_roles()
        for role in user_roles:
            if role in ROLE_PERMISSIONS:
                role_config = ROLE_PERMISSIONS[role]
                model_mapping = {
                    'employees': 'Employee',
                    'equipment': 'Equipment',
                    'facilities': 'Facility',
                    'tasks': 'Task',
                    'networks': 'CommunicationNetwork'
                }
                
                if module_name in model_mapping:
                    model_name = model_mapping[module_name]
                    if model_name in role_config['models']:
                        permissions = role_config['models'][model_name]
                        return any(perm in permissions for perm in ['add', 'change', 'delete'])
        return False
    
    def get_permissions_info(self):
        from .permissions_config import ROLE_PERMISSIONS
        
        permissions = {
            'roles': [],
            'models': {},
            'filters': {},
            'modules': set()
        }
        
        for role in self.get_roles():
            if role in ROLE_PERMISSIONS:
                role_config = ROLE_PERMISSIONS[role]
                permissions['roles'].append({
                    'id': role,
                    'name': role_config['name'],
                    'description': role_config['description']
                })
                
                for model, actions in role_config['models'].items():
                    if model not in permissions['models']:
                        permissions['models'][model] = set()
                    permissions['models'][model].update(actions)
                
                if 'filters' in role_config:
                    for model, model_filters in role_config['filters'].items():
                        if model not in permissions['filters']:
                            permissions['filters'][model] = {}
                        permissions['filters'][model].update(model_filters)
        
        permissions['models'] = {
            model: list(actions) for model, actions in permissions['models'].items()
        }
        
        permissions['modules'] = self._get_available_modules(permissions['models'])
        
        # Добавляем флаг is_editor_sha_worker
        permissions['is_editor_sha_worker'] = any(
            ROLE_PERMISSIONS.get(role, {}).get('is_editor_sha_worker', False)
            for role in self.get_roles()
        )
        
        return permissions
    
    def _get_available_modules(self, models_permissions):
        module_mapping = {
            'Employee': 'employees',
            'ShaWorkerDetails': 'employees',
            'ShaEquipmentConclusion': 'employees',
            'Equipment': 'equipment',
            'EquipmentCategory': 'equipment',
            'InterestOrgan': 'organs',
            'Division': 'divisions',
            'Subdivision': 'divisions',
            'Facility': 'divisions',
            'FacilityType': 'divisions',
            'CommunicationPost': 'divisions',
            'CommunicationNetwork': 'networks',
            'NetworkMembership': 'networks',
            'NetworkDirection': 'networks',
            'VLAN': 'networks',
            'NetworkInterface': 'networks',
            'VLANConfiguration': 'networks',
            'IPAddress': 'networks',
            'RoutingTable': 'networks',
            'ACL': 'networks',
            'IPRange': 'networks',
            'Task': 'tasks',
            'TaskStep': 'tasks',
            'User': 'users',
            'StorageFolder': 'storage',
            'StorageFile': 'storage',
            'FSBOffice': 'maps',
            'Object': 'objects',
        }
        modules = set()
        for model in models_permissions.keys():
            if model in module_mapping:
                modules.add(module_mapping[model])
        return list(modules)
    

@receiver(post_save, sender=User)
def assign_default_role(sender, instance, created, **kwargs):
    if created and not instance.groups.exists():
        from django.contrib.auth.models import Group
        from .permissions_config import get_group_name
        
        try:
            default_group = Group.objects.get(name=get_group_name('user'))
            instance.groups.add(default_group)
        except Group.DoesNotExist:
            pass
    

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    from .logging_utils import log_user_action
    log_user_action(
        user=user,
        action='login',
        module='auth',
        request=request,
        details={'login_type': 'password'}
    )


@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    pass

import os
from django.utils.timezone import now

def employee_photo_path(instance, filename):
    """
    Функция для определения пути сохранения фотографий сотрудников.
    Теперь перенесена в employees/models.py, но оставлена здесь для совместимости со старыми миграциями.
    """
    ext = filename.split('.')[-1]
    filename = f'{now().strftime("%Y%m%d%H%M%S")}_{instance.id}.{ext}'
    return os.path.join('employees/photos', filename)


class RoleGroup(Group):
    """
    Прокси-модель для групп, представляющих роли.
    Используется в админке для отображения русских названий ролей.
    """
    class Meta:
        proxy = True
        verbose_name = 'Группа-роль'
        verbose_name_plural = 'Группы-роли'

    def __str__(self):
        # Пытаемся получить русское название роли из конфигурации
        role = get_role_from_group(self.name)
        if role and role in ROLE_PERMISSIONS:
            return ROLE_PERMISSIONS[role]['name']
        # Если группа не является ролью, возвращаем оригинальное имя
        return self.name