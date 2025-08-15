from django.db import models
from django.utils import timezone
from facilities.models import Division, Facility, Subdivision
from users.models import Employee
from django.core.validators import MinValueValidator, MaxValueValidator

class ClosedEquipmentCategory(models.Model):
    value = models.CharField(max_length=20, unique=True, verbose_name='Код категории', null=True)  # Добавляем value
    name = models.CharField(max_length=255, verbose_name='Название категории')
    is_network = models.BooleanField(default=False, verbose_name='Сетевое оборудование') 


    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Категория закрытой техники'
        verbose_name_plural = 'Категории закрытой техники'
        ordering = ['name']

class OpenEquipmentCategory(models.Model):
    value = models.CharField(max_length=20, unique=True, verbose_name='Код категории', null=True)
    name = models.CharField(max_length=255, verbose_name='Название категории')
    is_network = models.BooleanField(default=False, verbose_name='Сетевое оборудование')
    
    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Категория открытой техники'
        verbose_name_plural = 'Категории открытой техники'
        ordering = ['name']
        

class Equipment(models.Model):
    
    @property
    def is_network_device(self):
        """Проверяет, является ли оборудование сетевым"""
        if self.is_closed and self.closed_category:
            return self.closed_category.is_network
        elif not self.is_closed and self.open_category:
            return self.open_category.is_network
        return False

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

# СЕТЕВЫЕ НАСТРОЙКИ
class VLAN(models.Model):
    """Модель VLAN для сетевого оборудования"""
    vlan_id = models.PositiveIntegerField(
        "VLAN ID",
        validators=[MinValueValidator(1), MaxValueValidator(4094)]
    )
    name = models.CharField("Название VLAN", max_length=100)
    description = models.TextField("Описание", blank=True)
    created_at = models.DateTimeField("Создан", auto_now_add=True)

    class Meta:
        verbose_name = "VLAN"
        verbose_name_plural = "VLANs"
        ordering = ['vlan_id']
        constraints = [
            models.UniqueConstraint(fields=['vlan_id'], name='unique_vlan_id')
        ]

    def __str__(self):
        return f"{self.name} (VLAN {self.vlan_id})"


class NetworkInterface(models.Model):
    """Модель сетевого интерфейса"""
    INTERFACE_TYPES = [
        ('physical', 'Физический порт'),
        ('vlan', 'VLAN Interface'),
        ('loopback', 'Loopback'),
        ('port-channel', 'Port-Channel'),
        ('tunnel', 'Tunnel'),
        ('other', 'Другой'),
    ]
    
    PHYSICAL_PORT_TYPES = [
        ('rj45', 'RJ-45'),
        ('sfp', 'SFP'),
        ('sfp+', 'SFP+'),
        ('qsfp', 'QSFP'),
        ('console', 'Console'),
        ('usb', 'USB'),
    ]
    
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name='network_interfaces',
        verbose_name="Оборудование"
    )
    name = models.CharField("Название", max_length=50)
    interface_type = models.CharField("Тип", max_length=20, choices=INTERFACE_TYPES, default='physical')
    physical_type = models.CharField("Тип порта", max_length=20, choices=PHYSICAL_PORT_TYPES, blank=True, null=True)
    port_number = models.PositiveIntegerField("Номер порта", blank=True, null=True)
    slot = models.PositiveIntegerField("Слот", blank=True, null=True)
    module = models.PositiveIntegerField("Модуль", blank=True, null=True)
    enabled = models.BooleanField("Включен", default=True)
    mac_address = models.CharField("MAC-адрес", max_length=17, blank=True)
    mtu = models.PositiveIntegerField("MTU", default=1500)
    speed = models.CharField("Скорость", max_length=20, blank=True)
    vlan = models.ForeignKey(
        VLAN,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Access VLAN"
    )
    is_trunk = models.BooleanField("Trunk порт", default=False)
    native_vlan = models.ForeignKey(
        VLAN,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='native_interfaces',
        verbose_name="Native VLAN"
    )
    connected_to = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        verbose_name="Подключен к"
    )
    
    class Meta:
        verbose_name = "Сетевой интерфейс"
        verbose_name_plural = "Сетевые интерфейсы"
        ordering = ['equipment', 'slot', 'module', 'port_number']

    def __str__(self):
        return f"{self.equipment.name} - {self.name}"


class IPAddress(models.Model):
    """Модель IP-адреса для сетевого оборудования"""
    IP_VERSION_CHOICES = [
        ('IPv4', 'IPv4'),
        ('IPv6', 'IPv6'),
    ]
    
    interface = models.ForeignKey(
        NetworkInterface,
        on_delete=models.CASCADE,
        related_name='ip_addresses',
        verbose_name="Интерфейс"
    )
    address = models.GenericIPAddressField("IP-адрес", protocol='both')
    netmask = models.CharField("Маска/префикс", max_length=39)
    version = models.CharField("Версия IP", max_length=4, choices=IP_VERSION_CHOICES)
    is_primary = models.BooleanField("Основной адрес", default=False)
    gateway = models.GenericIPAddressField("Шлюз", protocol='both', blank=True, null=True)
    dns_servers = models.TextField("DNS-серверы", blank=True)
    description = models.TextField("Комментарий", blank=True)

    class Meta:
        verbose_name = "IP-адрес"
        verbose_name_plural = "IP-адреса"

    def __str__(self):
        return f"{self.address}/{self.netmask}"

class IPRange(models.Model):
    """Модель диапазона IP-адресов"""
    network = models.CharField("Сеть", max_length=43)  # CIDR-нотация
    vlan = models.ForeignKey(
        VLAN,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="VLAN",
        related_name='ip_ranges'
    )
    description = models.CharField("Описание", max_length=255)
    devices = models.ManyToManyField(
        Equipment,
        related_name='ip_ranges',
        verbose_name="Устройства",
        blank=True
    )
    created_at = models.DateTimeField("Создан", auto_now_add=True)

    class Meta:
        verbose_name = "Диапазон IP"
        verbose_name_plural = "Диапазоны IP"

    def __str__(self):
        return self.network