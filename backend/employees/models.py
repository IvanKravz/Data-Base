# employees/models.py
from django.db import models
from django.utils import timezone
from django.core.files.storage import default_storage
import logging
import os
import re
import uuid
from datetime import datetime
from django.dispatch import receiver
from django.db.models.signals import post_save, pre_delete
from facilities.models import Division, Subdivision

logger = logging.getLogger(__name__)

def employee_photo_path(instance, filename):
    full_name = re.sub(r'[^\w\s]', '', instance.full_name)
    full_name = full_name.replace(' ', '_')
    
    ext = os.path.splitext(filename)[1]
    
    if instance.id:
        return f'employee_photos/{full_name}_id_{instance.id}{ext}'
    else:
        return f'employee_photos/temp/{uuid.uuid4()}{ext}'
    

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
            ('Полковник', 'Полковник'),
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
        self.delete_photo()
        super().delete(*args, **kwargs)

    def delete_photo(self):
        if not self.id:
            return False

        full_name_clean = re.sub(r'[^\w\s]', '', self.full_name)
        full_name_clean = full_name_clean.replace(' ', '_')
        base_name = f'employee_photos/{full_name_clean}_id_{self.id}'

        storage = default_storage
        deleted = False

        try:
            dir_path = os.path.dirname(base_name)
            _, files = storage.listdir(dir_path)
        except FileNotFoundError:
            return False

        for filename in files:
            if filename.startswith(os.path.basename(base_name) + '.'):
                file_path = os.path.join(dir_path, filename)
                try:
                    storage.delete(file_path)
                    deleted = True
                except Exception as e:
                    logger.error(f"Ошибка удаления файла {file_path}: {str(e)}")

        self.photo = None
        self.save(update_fields=['photo'])
        return deleted
    

    def save(self, *args, **kwargs):
        if self.pk:
            try:
                old_employee = Employee.objects.get(pk=self.pk)
                if old_employee.photo and old_employee.photo != self.photo:
                    old_employee.photo.delete(save=False)
            except Employee.DoesNotExist:
                pass

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
                base_priority = 1200
            
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
                self.priority = base_priority + 60
        
        elif self.category == 'warrant_officer':
            if self.position == 'Старший инструктор':
                base_priority = 1300
            elif self.position == 'Старший радист':
                base_priority = 1400
            elif self.position == 'Радиотехник':
                base_priority = 1500
            else:
                base_priority = 1600
            
            if self.rank in ['Старший прапорщик', 'Старший мичман']:
                self.priority = base_priority + 10
            elif self.rank in ['Прапорщик', 'Мичман']:
                self.priority = base_priority + 20
            else:
                self.priority = base_priority + 30
        
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
        blank=True
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
        blank=True
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
        try:
            old_photo_name = instance.photo.name
            full_name = re.sub(r'[^\w\s]', '', instance.full_name)
            full_name = full_name.replace(' ', '_')
            ext = os.path.splitext(old_photo_name)[1]
            new_photo_name = f'employee_photos/{full_name}_id_{instance.id}{ext}'
            
            storage = instance.photo.storage
            if storage.exists(old_photo_name):
                with storage.open(old_photo_name) as f:
                    new_file = storage.save(new_photo_name, f)
                storage.delete(old_photo_name)
                instance.photo.name = new_photo_name
                instance.save(update_fields=['photo'])
        except Exception as e:
            logger.error(f"Ошибка при переименовании фото: {str(e)}")
    
    elif instance.photo and not created:
        try:
            old_instance = Employee.objects.get(pk=instance.pk)
            if old_instance.full_name != instance.full_name:
                old_full_name = re.sub(r'[^\w\s]', '', old_instance.full_name)
                old_full_name = old_full_name.replace(' ', '_')
                base_name = f'employee_photos/{old_full_name}_id_{instance.id}'
                
                storage = instance.photo.storage
                try:
                    dir_path = os.path.dirname(base_name)
                    _, files = storage.listdir(dir_path)
                except FileNotFoundError:
                    files = []
                
                for filename in files:
                    if filename.startswith(os.path.basename(base_name) + '.'):
                        file_path = os.path.join(dir_path, filename)
                        storage.delete(file_path)
                
                new_full_name = re.sub(r'[^\w\s]', '', instance.full_name)
                new_full_name = new_full_name.replace(' ', '_')
                new_photo_name = f'employee_photos/{new_full_name}_id_{instance.id}{ext}'
                
                if storage.exists(old_photo_name):
                    with storage.open(old_photo_name) as f:
                        new_file = storage.save(new_photo_name, f)
                    storage.delete(old_photo_name)
                    instance.photo.name = new_photo_name
                    instance.save(update_fields=['photo'])
        except Exception as e:
            logger.error(f"Ошибка при переименовании фото: {str(e)}")