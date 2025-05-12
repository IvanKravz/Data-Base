from django.db import models
from django.utils import timezone
from facilities.models import Division, Facility, Subdivision
from users.models import Employee

class ClosedEquipmentCategory(models.Model):
    value = models.CharField(max_length=20, unique=True, verbose_name='Код категории', null=True)  # Добавляем value
    name = models.CharField(max_length=255, verbose_name='Название категории')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Категория закрытой техники'
        verbose_name_plural = 'Категории закрытой техники'
        ordering = ['name']

class OpenEquipmentCategory(models.Model):
    value = models.CharField(max_length=20, unique=True, verbose_name='Код категории', null=True)
    name = models.CharField(max_length=255, verbose_name='Название категории')
    
    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Категория открытой техники'
        verbose_name_plural = 'Категории открытой техники'
        ordering = ['name']
        

class Equipment(models.Model):
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
    open_category = models.ForeignKey(
        OpenEquipmentCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
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

    first_invoice = models.CharField(
        max_length=255, 
        blank=True, 
        null=True, 
        verbose_name='Первичный документ на получение'
    )
    material_invoice = models.CharField(
        max_length=255, 
        blank=True, 
        null=True, 
        verbose_name='Накладная на МОЛ'
    )
    ver_software = models.CharField(
        max_length=255, 
        blank=True, 
        null=True, 
        verbose_name='Версия программного обеспечения'
    )
    
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
        indexes = [
            models.Index(fields=['division']),
            models.Index(fields=['subdivision']),
            models.Index(fields=['facility']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['status']),
            models.Index(fields=['is_closed']),
        ]

    def get_category_display(self):
        if self.is_closed:
            return self.closed_category.name if self.closed_category else 'Без категории'
        else:
            return self.open_category.name if self.open_category else 'Без категории'
        
    def get_status_display(self):
        return dict(self.EQUIPMENT_STATUSES).get(self.status, self.status)
    
    
class ProductStructure(models.Model):
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name='product_structures',
        verbose_name='Оборудование'
    )
    name = models.CharField(max_length=255, verbose_name='Наименование')
    model = models.CharField(max_length=255, verbose_name='Модель', blank=True, null=True)
    serial_number = models.CharField(max_length=255, verbose_name='Заводской номер', blank=True, null=True)
    note = models.TextField(verbose_name='Примечание', blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.model or 'без модели'})"

    class Meta:
        verbose_name = 'Состав изделия'
        verbose_name_plural = 'Составы изделий'
        ordering = ['name']