from django.db import models
from django.utils import timezone
from facilities.models import Division, Facility, Subdivision
from users.models import Employee

class EquipmentCategory(models.Model):
    value = models.CharField(max_length=20, unique=True, verbose_name='Код категории', null=True)
    name = models.CharField(max_length=255, verbose_name='Название категории')
    is_closed = models.BooleanField(default=False, verbose_name='Для закрытой техники')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Дата создания')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Категория техники'
        verbose_name_plural = 'Категории техники'
        ordering = ['created_at']

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
    is_network = models.BooleanField(default=False, verbose_name='Сетевое оборудование')
    category = models.ForeignKey(
        EquipmentCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Категория техники'
    )
    status = models.CharField(max_length=20, choices=EQUIPMENT_STATUSES, verbose_name='Статус')
    serial_number = models.CharField(max_length=255, verbose_name='Серийный номер', null=True, blank=True)
    inventory_number = models.CharField(max_length=255, verbose_name='Инвентарный номер', null=True, blank=True)
    manufacturing_date = models.DateField(verbose_name='Дата производства', null=True, blank=True)
    exploitation_date = models.DateField(verbose_name='Дата ввода в эксплуатацию', null=True, blank=True)
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

    vlans = models.ManyToManyField(
        'networks.VLAN',
        blank=True,
        verbose_name='VLANы',
        related_name='equipment_vlans' 
    )
    network_interfaces = models.ManyToManyField(
        'networks.NetworkInterface',
        blank=True,
        verbose_name='Сетевые интерфейсы',
        related_name='net_network_interfaces',  
    )
    ip_addresses = models.ManyToManyField(
        'networks.IPAddress',
        blank=True,
        verbose_name='IP-адреса',
        related_name='equipment_ip_addresses'  
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
            models.Index(fields=['is_network']),
        ]

    def get_category_display(self):
        return self.category.name if self.category else 'Без категории'
        
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