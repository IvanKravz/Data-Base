from django.db import models
from django.utils import timezone
from facilities.models import Division, Facility, Subdivision
from users.models import Employee

class ClosedEquipmentCategory(models.Model):
    name = models.CharField(max_length=255, verbose_name='Название категории')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Категория закрытой техники'
        verbose_name_plural = 'Категории закрытой техники'
        ordering = ['name']

class Equipment(models.Model):
    OPEN_EQUIPMENT_CATEGORIES = [
        ('tko', 'ТКО'),
        ('radio', 'Радио'),
        ('computer', 'СВТ'),
        ('battery', 'АКБ'),
        ('antenna', 'Антенны, мачты'),
        ('power', 'Источники питания'),
        ('materials', 'Материалы')
    ]

    EQUIPMENT_STATUSES = [
        ('in-operation', 'Эксплуатируется'),
        ('in-storage', 'На складе'),
        ('defective', 'Неисправно'),
        ('for-disposal', 'На списание'),
        ('disposed', 'Списано')
    ]

    name = models.CharField(max_length=255, verbose_name='Название')
    type = models.CharField(max_length=255, verbose_name='Тип')
    is_closed = models.BooleanField(default=False, verbose_name='Закрытая техника')
    open_category = models.CharField(
        max_length=20,
        choices=OPEN_EQUIPMENT_CATEGORIES,
        blank=True,
        null=True,
        verbose_name='Категория (открытая техника)'
    )
    closed_category = models.ForeignKey(
        ClosedEquipmentCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Категория (закрытая техника)'
    )
    status = models.CharField(max_length=20, choices=EQUIPMENT_STATUSES, verbose_name='Статус')
    serial_number = models.CharField(max_length=255, verbose_name='Серийный номер')
    inventory_number = models.CharField(max_length=255, verbose_name='Инвентарный номер')
    manufacturing_date = models.DateField(verbose_name='Дата производства')
    purchase_date = models.DateField(verbose_name='Дата покупки')
    division = models.ForeignKey(Division, on_delete=models.CASCADE, related_name='equipment', verbose_name='Подразделение')
    subdivision = models.ForeignKey(
        Subdivision,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='equipment',
        verbose_name='Отделение'
    )
    facility = models.ForeignKey(Facility, on_delete=models.SET_NULL, null=True, blank=True, related_name='equipment', verbose_name='Объект')
    assigned_to = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_equipment', verbose_name='Закреплено за')
    comments = models.TextField(blank=True, null=True, verbose_name='Комментарии')
    
    # Disposal information
    disposal_act_number = models.CharField(max_length=255, blank=True, null=True, verbose_name='№ акта списания')
    disposal_act_date = models.DateField(blank=True, null=True, verbose_name='Дата акта списания')
    disposal_cert_number = models.CharField(max_length=255, blank=True, null=True, verbose_name='№ справки о ликвидации')
    disposal_cert_date = models.DateField(blank=True, null=True, verbose_name='Дата справки о ликвидации')
    disposal_comments = models.TextField(blank=True, null=True, verbose_name='Комментарии к списанию')
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Техника'
        verbose_name_plural = 'Техника'
        ordering = ['name']

    def get_category_display(self):
        if self.is_closed:
            return self.closed_category.name if self.closed_category else 'Без категории'
        else:
            return dict(self.OPEN_EQUIPMENT_CATEGORIES).get(self.open_category, 'Без категории')