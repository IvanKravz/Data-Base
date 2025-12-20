from django.db import models
from django.forms import ValidationError
from django.utils import timezone

class Division(models.Model):
    name = models.CharField(max_length=100)
    order = models.IntegerField(
        default=0, 
        verbose_name='Порядок сортировки',
        help_text='Чем меньше число, тем выше в списке'
    )
    staff_planned_total = models.PositiveIntegerField(default=0, verbose_name='Общий штат сотрудников (план)')
    staff_planned_management = models.PositiveIntegerField(default=0, verbose_name='Штат руководства (план)')
    staff_planned_officers = models.PositiveIntegerField(default=0, verbose_name='Штат офицеров (план)')
    staff_planned_warrant_officers = models.PositiveIntegerField(default=0, verbose_name='Штат прапорщиков (план)')
    staff_planned_civilian = models.PositiveIntegerField(default=0, verbose_name='Штат гражданского персонала (план)')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    def get_employees_count(self):
        return self.employees.count()
    
    def get_management_count(self):
        return self.employees.filter(category='management').count()
    
    def get_officers_count(self):
        return self.employees.filter(category='officer').count()
    
    def get_warrant_officers_count(self):
        return self.employees.filter(category='warrant_officer').count()
    
    def get_civilian_count(self):
        return self.employees.filter(category='civilian').count()
    
    def get_equipment_count(self):
        return self.equipment.count()
    
    def get_facilities_count(self):
        return self.facilities.count()

    def get_tasks_count(self):
        return self.tasks.count()

    def get_networks_count(self):
        return self.networkmembership_set.values('network').distinct().count()

    class Meta:
        ordering = ['order', 'name']
        verbose_name = 'Подразделение'
        verbose_name_plural = 'Подразделения'

class Subdivision(models.Model):
    name = models.CharField(max_length=100)
    division = models.ForeignKey(Division, on_delete=models.CASCADE, related_name='subdivisions', null=True)
    order = models.IntegerField(
        default=0, 
        verbose_name='Порядок сортировки',
        help_text='Чем меньше число, тем выше в списке'
    )
    staff_planned_total = models.PositiveIntegerField(default=0, verbose_name='Общий штат сотрудников (план)')
    staff_planned_management = models.PositiveIntegerField(default=0, verbose_name='Штат руководства (план)')
    staff_planned_officers = models.PositiveIntegerField(default=0, verbose_name='Штат офицеров (план)')
    staff_planned_warrant_officers = models.PositiveIntegerField(default=0, verbose_name='Штат прапорщиков (план)')
    staff_planned_civilian = models.PositiveIntegerField(default=0, verbose_name='Штат гражданского персонала (план)')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def get_employees_count(self):
        return self.employees.count()
    
    def get_management_count(self):
        return self.employees.filter(category='management').count()
    
    def get_officers_count(self):
        return self.employees.filter(category='officer').count()
    
    def get_warrant_officers_count(self):
        return self.employees.filter(category='warrant_officer').count()
    
    def get_civilian_count(self):
        return self.employees.filter(category='civilian').count()
    
    def get_equipment_count(self):
        return self.equipment.count()
    
    def get_facilities_count(self):
        return self.facilities.count()

    def get_tasks_count(self):
        return self.tasks.count()

    
    def __str__(self):
        return f"{self.division.name} - {self.name}"

    class Meta:
        ordering = ['order', 'name']
        verbose_name = 'Отделение'
        verbose_name_plural = 'Отделения'

class FacilityType(models.Model):
    name = models.CharField(max_length=100, verbose_name='Наименование типа объекта')
    description = models.TextField(blank=True, null=True, verbose_name='Описание')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"

    class Meta:
        verbose_name = 'Тип объекта'
        verbose_name_plural = 'Типы объектов'
        ordering = ['name']


class CommunicationPost(models.Model):
    name = models.CharField(max_length=100, verbose_name='Наименование поста связи')
    division = models.ForeignKey(
        Division, 
        on_delete=models.CASCADE, 
        related_name='communication_posts',
        verbose_name='Подразделение'
    )
    subdivision = models.ForeignKey(
        Subdivision, 
        on_delete=models.SET_NULL,  
        related_name='communication_posts',
        null=True, 
        blank=True,
        verbose_name='Отделение'
    )
    description = models.TextField(blank=True, null=True, verbose_name='Описание')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Пост связи"
        verbose_name_plural = "Посты связи"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Facility(models.Model):
   
    FACILITY_CLASSES = [
        ('1', '1 класс'),
        ('2', '2 класс')
    ]

    name = models.CharField(max_length=255, verbose_name='Название')
    type = models.ForeignKey(
        FacilityType,
        on_delete=models.PROTECT,
        verbose_name='Тип объекта',
        null=True,
        blank=True,
        related_name='facilities'
    )
    facility_class = models.CharField(max_length=1, choices=FACILITY_CLASSES, verbose_name='Класс', null=True, blank=True)
    address = models.TextField(verbose_name='Полный адрес', null=True, blank=True, editable=False)
    city = models.CharField(max_length=100, verbose_name='Город', blank=True, null=True)
    street = models.CharField(max_length=100, verbose_name='Улица', blank=True, null=True)
    house_number = models.CharField(max_length=20, verbose_name='Номер дома', blank=True, null=True)
    division = models.ForeignKey(Division, on_delete=models.PROTECT, related_name='facilities', verbose_name='Подразделение')
    subdivision = models.ForeignKey(
        Subdivision, on_delete=models.SET_NULL, 
        null=True, blank=True, 
        related_name='facilities', 
        verbose_name='Отделение'
    )
    communication_posts = models.ManyToManyField(
        CommunicationPost,
        blank=True,
        verbose_name='Посты связи'
    )    
    inn = models.CharField(max_length=12, blank=True, null=True, verbose_name='ИНН')
    comments = models.TextField(blank=True, null=True, verbose_name='Комментарии')
    is_closed = models.BooleanField(default=False, verbose_name='Закрытый объект')

    # Документация
    acceptance_act_number = models.CharField(max_length=255, blank=True, null=True, verbose_name='Номер акта приемки помещения')
    rim_act_number = models.CharField(max_length=255, blank=True, null=True, verbose_name='Номер акта РИМ')
    commissioning_act_number = models.CharField(max_length=255, blank=True, null=True, verbose_name='Номер акта ввода')
    opening_permission_number = models.CharField(max_length=255, blank=True, null=True, verbose_name='Номер разрешения на открытие')
    
    # Информация о КЗ
    kz_size = models.CharField(max_length=255, blank=True, null=True, verbose_name='Размер КЗ')
    has_transformer_in_kz = models.BooleanField(default=False, verbose_name='ТП в пределах КЗ')
    has_grounding_in_kz = models.BooleanField(default=False, verbose_name='Контур заземления в пределах КЗ')
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Автоматически формируем полный адрес при сохранении
        address_parts = []
        if self.city:
            address_parts.append(self.city)
        if self.street:
            address_parts.append(self.street)
        if self.house_number:
            address_parts.append(self.house_number)
        self.address = ', '.join(address_parts) if address_parts else None
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Объект'
        verbose_name_plural = 'Объекты'
        ordering = ['name']