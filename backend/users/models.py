from venv import logger
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from django.core.files.storage import default_storage
import os
import re
import uuid
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.files.storage import default_storage

from facilities.models import Division, Subdivision

def employee_photo_path(instance, filename):
    # Очищаем ФИО от недопустимых символов
    full_name = re.sub(r'[^\w\s]', '', instance.full_name)  # Удаляем спецсимволы
    full_name = full_name.replace(' ', '_')  # Заменяем пробелы на подчеркивания
    
    # Получаем расширение файла
    ext = os.path.splitext(filename)[1]
    
    # Формируем имя файла
    if instance.id:
        return f'employee_photos/{full_name}_id_{instance.id}{ext}'
    else:
        # Для новых объектов (еще без ID) используем временное имя
        return f'employee_photos/temp/{uuid.uuid4()}{ext}'
    

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
        'Employee',
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
    
    @property
    def division(self):
        """Автоматически определяем подразделение через сотрудника или прямое поле"""
        if self.employee and self.employee.division:
            return self.employee.division
        return self.user_division  # Возвращаем прямое поле
    
    @property
    def subdivision(self):
        """Автоматически определяем отделение через сотрудника или прямое поле"""
        if self.employee and self.employee.subdivision:
            return self.employee.subdivision
        return self.user_subdivision  # Возвращаем прямое поле
    
    def has_role(self, role_name):
        """Проверяет, имеет ли пользователь указанную роль"""
        from .permissions_config import get_group_name
        return self.groups.filter(name=get_group_name(role_name)).exists()
    
    def get_roles(self):
        """Возвращает список ролей пользователя"""
        from .permissions_config import get_role_from_group
        
        roles = []
        for group in self.groups.filter(name__startswith='role_'):
            role = get_role_from_group(group.name)
            if role:
                roles.append(role)
        return roles
    
    def has_module_permission(self, module_name):
        """Проверяет доступ к модулю по имени"""
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
        """Проверяет права на редактирование в модуле"""
        if self.is_superuser or self.has_role('admin'):
            return True
            
        from .permissions_config import ROLE_PERMISSIONS
        from .permissions import RoleBasedPermission
        
        # Пользователи только с правами просмотра не могут редактировать
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
                        # Проверяем наличие прав на изменение
                        return any(perm in permissions for perm in ['add', 'change', 'delete'])
        return False
    
    def get_permissions_info(self):
        """Возвращает информацию о правах пользователя"""
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
                
                # Объединяем права на модели
                for model, actions in role_config['models'].items():
                    if model not in permissions['models']:
                        permissions['models'][model] = set()
                    permissions['models'][model].update(actions)
                
                # Объединяем фильтры
                if 'filters' in role_config:
                    for model, model_filters in role_config['filters'].items():
                        if model not in permissions['filters']:
                            permissions['filters'][model] = {}
                        permissions['filters'][model].update(model_filters)
        
        # Преобразуем обратно в списки
        permissions['models'] = {
            model: list(actions) for model, actions in permissions['models'].items()
        }
        
        # Определяем доступные модули
        permissions['modules'] = self._get_available_modules(permissions['models'])
        
        return permissions
    
    def _get_available_modules(self, models_permissions):
        """Определяет доступные модули на основе прав к моделям"""
        module_mapping = {
            'Employee': 'employees',
            'ShaWorkerDetails': 'sha_workers',
            'ShaEquipmentConclusion': 'sha_equipment',
            'Equipment': 'equipment',
            'Object': 'objects',
            'CommunicationNetwork': 'networks',
            'Task': 'tasks',
            'User': 'users',
            'Division': 'divisions',
            'Subdivision': 'subdivisions',
        }
        
        modules = set()
        for model in models_permissions.keys():
            if model in module_mapping:
                modules.add(module_mapping[model])
                
        return list(modules)
    
class Employee(models.Model):
    CATEGORY_CHOICES = [
        ('management', 'Руководство'),
        ('officer', 'Офицер'),
        ('warrant_officer', 'Прапорщик'),
        ('civilian', 'Гражданский персонал'),
    ]

    SUB_CATEGORY_CHOICES = [
        ('chief', 'Главный руководитель'),
        ('deputy_chief', 'Заместитель главного руководителя'),
        ('department_head', 'Начальник отдела'),
        ('deputy_department_head', 'Заместитель начальника отдела'),
        ('section_head', 'Начальник отделения'),
    ]

    @classmethod
    def get_category_choices(cls):
        return cls.CATEGORY_CHOICES

    @classmethod
    def get_subcategory_choices(cls):
        return cls.SUB_CATEGORY_CHOICES

    @classmethod
    def get_officer_positions(cls):
        return [
            ('Старший офицер', 'Старший офицер'),
            ('Флагманский связист', 'Флагманский связист'),
            ('Офицер', 'Офицер'),
            ('Старший инженер', 'Старший инженер'),
            ('Старший референт', 'Старший референт'),
            ('Инженер', 'Инженер'),
            ('Референт', 'Референт')
        ]

    @classmethod
    def get_warrant_officer_positions(cls):
        return [
            ('Старший инструктор', 'Старший инструктор'),
            ('Старший радист', 'Старший радист'),
            ('Радиотехник', 'Радиотехник'),
            ('Ответственный исполнитель', 'Ответственный исполнитель')
        ]

    @classmethod
    def get_civilian_positions(cls):
        return [
            ('Техник', 'Техник'),
            ('Ответственный исполнитель', 'Ответственный исполнитель')
        ]

    @classmethod
    def get_management_officer_ranks(cls):
        return [
            ('Полковник', 'Полковник' ),
            ('Подполковник', 'Подполковник'),
            ('Подполковник юстиции', 'Подполковник юстиции'),
            ('Майор', 'Майор'),
            ('Капитан 3 ранга', 'Капитан 3 ранга'),
            ('Капитан', 'Капитан'),
        ]
    
    @classmethod
    def get_officer_ranks(cls):
        return [
            ('Подполковник', 'Подполковник'),
            ('Подполковник юстиции', 'Подполковник юстиции'),
            ('Майор', 'Майор'),
            ('Капитан 3 ранга', 'Капитан 3 ранга'),
            ('Капитан', 'Капитан'),
            ('Капитан-лейтенант', 'Капитан-лейтенант'),
            ('Старший лейтенант', 'Старший лейтенант'),
            ('Лейтенант', 'Лейтенант')
        ]

    @classmethod
    def get_warrant_officer_ranks(cls):
        return [
            ('Старший прапорщик', 'Старший прапорщик'),
            ('Старший мичман', 'Старший мичман'),
            ('Прапорщик', 'Прапорщик'),
            ('Мичман', 'Мичман')
        ]

    photo = models.ImageField(
        upload_to=employee_photo_path,
        verbose_name='Фотография',
        null=True,
        blank=True
    )
    full_name = models.CharField(max_length=50, verbose_name='ФИО')
    position = models.CharField(max_length=256, verbose_name='Должность')
    rank = models.CharField(max_length=20, verbose_name='Звание', null=True)
    order_rank = models.CharField(max_length=30, verbose_name='Приказ на присвоение звания', null=True, blank=True)
    personal_number = models.CharField(max_length=15, verbose_name='Личный номер', null=True)
    personal_phone = models.CharField(max_length=50, verbose_name='Телефон', null=True)
    work_phone = models.CharField(max_length=50, verbose_name='Телефон', null=True)
    birth_date = models.DateField(verbose_name='Дата рождения', null=True, blank=True)
    contract_date = models.DateField(verbose_name='Дата контракта', null=True, blank=True)
    form_state_secrets = models.CharField(max_length=15, verbose_name='Форма гостайны', null=True, blank=True)
    number_state_secrets = models.CharField(max_length=15, verbose_name='Номер допуска', null=True, blank=True)
    data_state_secrets = models.DateField(verbose_name='Дата допуска', null=True, blank=True)
    education = models.CharField(max_length=50, verbose_name='Уровень образования', null=True, blank=True)
    institution = models.CharField(max_length=100, verbose_name='Учебное заведение', null=True, blank=True)
    year_graduation = models.DateField(verbose_name='Дата окончания учебного заведения', null=True, blank=True)
    date_start_work = models.DateField(verbose_name='Дата начала службы', null=True, blank=True)
    date_end_work = models.DateField(verbose_name='Дата окончания контракта', null=True, blank=True)
    description = models.TextField(verbose_name='Комментарии', null=True, blank=True)
    division = models.ForeignKey(
        Division,
        on_delete=models.CASCADE,
        related_name='employees',
        verbose_name='Подразделение',
        null=True,
        blank=True
    )
    subdivision = models.ForeignKey(
        Subdivision,
        on_delete=models.SET_NULL,
        related_name='employees',
        verbose_name='Отделение',
        null=True,
        blank=True,
    )
    is_sha_worker = models.BooleanField(default=False, verbose_name='ШаРаботник')
    is_material_responsible = models.BooleanField(default=False, verbose_name='МОЛ')
    category = models.CharField(
        max_length=20, 
        choices=CATEGORY_CHOICES, 
        verbose_name='Категория', 
        default='civilian'
    )
    subcategory = models.CharField(
        max_length=25, 
        choices=SUB_CATEGORY_CHOICES, 
        verbose_name='Подкатегория', 
        blank=True, 
        null=True
    )
    priority = models.IntegerField(
        verbose_name='Приоритет сортировки', 
        default=0, 
        help_text='Чем меньше число, тем выше приоритет'
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Сотрудник'
        verbose_name_plural = 'Сотрудники'
        ordering = ['priority', 'full_name']

    def __str__(self):
        return self.full_name
    
    @property
    def photo_url(self):
        if self.photo and hasattr(self.photo, 'url'):
            return self.photo.url
        return None
    
    def delete(self, *args, **kwargs):
        # Удаляем все файлы фото
        self.delete_photo()
        super().delete(*args, **kwargs)

    def delete_photo(self):
        """Удаляет все фото сотрудника по шаблону имени"""
        if not self.id:
            return False

        # Формируем базовое имя файла без расширения
        full_name_clean = re.sub(r'[^\w\s]', '', self.full_name)
        full_name_clean = full_name_clean.replace(' ', '_')
        base_name = f'employee_photos/{full_name_clean}_id_{self.id}'

        storage = default_storage
        deleted = False

        try:
            # Получаем список файлов в директории employee_photos
            dir_path = os.path.dirname(base_name)
            _, files = storage.listdir(dir_path)
        except FileNotFoundError:
            return False

        # Удаляем все файлы, начинающиеся с base_name
        for filename in files:
            if filename.startswith(os.path.basename(base_name) + '.'):
                file_path = os.path.join(dir_path, filename)
                try:
                    storage.delete(file_path)
                    deleted = True
                except Exception as e:
                    logger.error(f"Ошибка удаления файла {file_path}: {str(e)}")

        # Очищаем поле фото
        self.photo = None
        self.save(update_fields=['photo'])
        return deleted
    

    def save(self, *args, **kwargs):
        # Если это существующая запись и фото было изменено
        if self.pk:
            try:
                old_employee = Employee.objects.get(pk=self.pk)
                if old_employee.photo and old_employee.photo != self.photo:
                    old_employee.photo.delete(save=False)
            except Employee.DoesNotExist:
                pass

    # Автоматически устанавливаем приоритет в зависимости от категории, должности и звания
        if self.category == 'management':
            if self.subcategory == 'chief':
                self.priority = 100
            elif self.subcategory == 'deputy_chief':
                self.priority = 200
            elif self.subcategory == 'department_head':
                self.priority = 300
            elif self.subcategory == 'deputy_department_head':
                self.priority = 400
            elif self.subcategory == 'section_head':
                self.priority = 500
        
        elif self.category == 'officer':
            # Сначала сортировка по должности (шаг 100)
            if self.position in ['Старший офицер', 'Флагманский связист']:
                base_priority = 600
            elif self.position == 'Офицер':
                base_priority = 700
            elif self.position == 'Старший инженер':
                base_priority = 800
            elif self.position == 'Старший референт':
                base_priority = 900
            elif self.position == 'Инженер':
                base_priority = 1000
            elif self.position == 'Референт':
                base_priority = 1100
            else:
                base_priority = 1200  # Для других должностей офицеров
            
            # Затем уточнение по званию (шаг 10)
            if self.rank in ['Подполковник', 'Подполковник юстиции']:
                self.priority = base_priority + 10
            elif self.rank in ['Майор', 'Капитан 3 ранга']:
                self.priority = base_priority + 20
            elif self.rank in ['Капитан', 'Капитан-лейтенант']:
                self.priority = base_priority + 30
            elif self.rank == 'Старший лейтенант':
                self.priority = base_priority + 40
            elif self.rank == 'Лейтенант':
                self.priority = base_priority + 50
            else:
                self.priority = base_priority + 60  # Для других званий офицеров
        
        elif self.category == 'warrant_officer':
            # Сначала сортировка по должности (шаг 100)
            if self.position == 'Старший инструктор':
                base_priority = 1300
            elif self.position == 'Старший радист':
                base_priority = 1400
            elif self.position == 'Радиотехник':
                base_priority = 1500
            else:
                base_priority = 1600  # Для других должностей прапорщиков
            
            # Затем уточнение по званию (шаг 10)
            if self.rank in ['Старший прапорщик', 'Старший мичман']:
                self.priority = base_priority + 10
            elif self.rank in ['Прапорщик', 'Мичман']:
                self.priority = base_priority + 20
            else:
                self.priority = base_priority + 30  # Для других званий прапорщиков
        
        elif self.category == 'civilian':
            self.priority = 1700
        
        super().save(*args, **kwargs)

class ShaWorkerDetails(models.Model):
    ACCESS_LEVELS = [
        ('1', '1 класс'),
        ('2', '2 класс')
    ]

    employee = models.OneToOneField(
        Employee,
        on_delete=models.CASCADE,
        related_name='sha_details',
        verbose_name='Сотрудник',
        blank=True  # Разрешаем пустые значения в формах
    )
    start_date = models.DateField(verbose_name='Дата начала')
    access_level = models.CharField(
        max_length=1, 
        choices=ACCESS_LEVELS, 
        verbose_name='Форма допуска'
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Детали ШаРаботника'
        verbose_name_plural = 'Детали ШаРаботников'

    def __str__(self):
        return f"ШаРаботник: {self.employee.full_name}"

class ShaEquipmentConclusion(models.Model):
    sha_worker = models.ForeignKey(
        ShaWorkerDetails,
        on_delete=models.CASCADE,
        related_name='equipment_conclusions',
        verbose_name='ШаРаботник',
        blank=True  # Разрешаем пустые значения в формах
    )
    equipment_type = models.CharField(max_length=255, verbose_name='Тип техники')
    conclusion_number = models.CharField(max_length=255, verbose_name='Номер заключения')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Заключение на технику'
        verbose_name_plural = 'Заключения на технику'
        ordering = ['conclusion_number']

    def __str__(self):
        return f"Заключение {self.conclusion_number} для {self.sha_worker.employee.full_name}"
    
@receiver(post_save, sender=Employee)
def update_employee_photo(sender, instance, created, **kwargs):
    if created and instance.photo:
        # Для только что созданных объектов с фото
        try:
            old_photo_name = instance.photo.name
            # Генерируем новое имя с ID
            full_name = re.sub(r'[^\w\s]', '', instance.full_name)
            full_name = full_name.replace(' ', '_')
            ext = os.path.splitext(old_photo_name)[1]
            new_photo_name = f'employee_photos/{full_name}_id_{instance.id}{ext}'
            
            # Перемещаем файл
            storage = instance.photo.storage
            if storage.exists(old_photo_name):
                # Копируем в новое расположение
                with storage.open(old_photo_name) as f:
                    new_file = storage.save(new_photo_name, f)
                # Удаляем временный файл
                storage.delete(old_photo_name)
                # Обновляем поле photo
                instance.photo.name = new_photo_name
                instance.save(update_fields=['photo'])
        except Exception as e:
            logger.error(f"Ошибка при переименовании фото: {str(e)}")
    
    # При изменении ФИО переименовываем файл
    elif instance.photo and not created:
        try:
            old_instance = Employee.objects.get(pk=instance.pk)
            if old_instance.full_name != instance.full_name:
                # Удаляем файлы со старым именем
                old_full_name = re.sub(r'[^\w\s]', '', old_instance.full_name)
                old_full_name = old_full_name.replace(' ', '_')
                base_name = f'employee_photos/{old_full_name}_id_{instance.id}'
                
                storage = instance.photo.storage
                try:
                    dir_path = os.path.dirname(base_name)
                    _, files = storage.listdir(dir_path)
                except FileNotFoundError:
                    files = []
                
                # Удаляем все файлы со старым именем
                for filename in files:
                    if filename.startswith(os.path.basename(base_name) + '.'):
                        file_path = os.path.join(dir_path, filename)
                        storage.delete(file_path)
                
                ...  # Существующий код для переименования файла
        except Exception as e:
            logger.error(f"Ошибка при переименовании фото: {str(e)}")

@receiver(post_save, sender=User)
def assign_default_role(sender, instance, created, **kwargs):
    """Назначаем роль по умолчанию при создании пользователя"""
    if created and not instance.groups.exists():
        from django.contrib.auth.models import Group
        from .permissions_config import get_group_name
        
        # Назначаем роль обычного пользователя, если она существует
        try:
            default_group = Group.objects.get(name=get_group_name('user'))
            instance.groups.add(default_group)
        except Group.DoesNotExist:
            pass