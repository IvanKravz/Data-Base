from django.db import models
from django.utils import timezone

class Division(models.Model):
    name = models.CharField(max_length=100)
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

    class Meta:
        ordering = ['name']
        verbose_name = 'Подразделение'
        verbose_name_plural = 'Подразделения'

class Subdivision(models.Model):
    name = models.CharField(max_length=100)
    division = models.ForeignKey(Division, on_delete=models.CASCADE, related_name='subdivisions')
    staff_planned_total = models.PositiveIntegerField(default=0, verbose_name='Общий штат сотрудников (план)')
    staff_planned_management = models.PositiveIntegerField(default=0, verbose_name='Штат руководства (план)')
    staff_planned_officers = models.PositiveIntegerField(default=0, verbose_name='Штат офицеров (план)')
    staff_planned_warrant_officers = models.PositiveIntegerField(default=0, verbose_name='Штат прапорщиков (план)')
    staff_planned_civilian = models.PositiveIntegerField(default=0, verbose_name='Штат гражданского персонала (план)')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.division.name} - {self.name}"

    class Meta:
        ordering = ['name']
        verbose_name = 'Отделение'
        verbose_name_plural = 'Отделения'

class Facility(models.Model):
    FACILITY_TYPES = [
        ('station', 'Станция'),
        ('shd', 'ШД')
    ]
    FACILITY_CLASSES = [
        ('1', '1 класс'),
        ('2', '2 класс')
    ]

    name = models.CharField(max_length=255, verbose_name='Название')
    type = models.CharField(max_length=10, choices=FACILITY_TYPES, verbose_name='Тип объекта')
    facility_class = models.CharField(max_length=1, choices=FACILITY_CLASSES, verbose_name='Класс')
    address = models.TextField(verbose_name='Адрес')
    division = models.ForeignKey(Division, on_delete=models.PROTECT, related_name='facilities', verbose_name='Подразделение')
    subdivision = models.ForeignKey(Subdivision, on_delete=models.SET_NULL, null=True, blank=True, 
                                  related_name='facilities', verbose_name='Отделение')
    comments = models.TextField(blank=True, null=True, verbose_name='Комментарии')
    
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

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Объект'
        verbose_name_plural = 'Объекты'
        ordering = ['name']