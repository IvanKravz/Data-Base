from django.db import models
from equipment.models import Equipment
from facilities.models import Division, Facility, Subdivision
from django.core.validators import MinValueValidator, MaxValueValidator

class CommunicationNetwork(models.Model):
    NETWORK_CLASS_CHOICES = [
        ('1', '1 класс'),
        ('2', '2 класс'),
    ]
    
    SECURITY_LEVEL_CHOICES = [
        ('public', 'Открытая'),
        ('confidential', 'Конфиденциальная'),
        ('secret', 'Секретная'),
        ('top_secret', 'Совершенно секретная'),
]

    PROTOCOL_CHOICES = [
        ('TCP/IP', 'TCP/IP'),
        ('UDP', 'UDP'),
        ('MPLS', 'MPLS'),
        ('Other', 'Другой'),
    ]
    
    name = models.CharField(max_length=100, verbose_name="Название сети")
    description = models.TextField(verbose_name="Описание", blank=True)
    network_class = models.CharField(
        max_length=1, 
        choices=NETWORK_CLASS_CHOICES, 
        verbose_name="Класс сети",
        null=True,
        blank=True
    )
    security_level = models.CharField(
        max_length=20, 
        choices=SECURITY_LEVEL_CHOICES, 
        verbose_name="Степень секретности информации"
    )
    
    # Новые технические поля
    ip_range = models.CharField(
        max_length=100, 
        verbose_name="IP диапазон",
        help_text="Формат: 192.168.1.0/24",
        blank=True
    )
    throughput = models.PositiveIntegerField(
        verbose_name="Пропускная способность (Mbps)",
        null=True,
        blank=True
    )
    protocol = models.CharField(
        max_length=20,
        choices=PROTOCOL_CHOICES,
        default='TCP/IP',
        verbose_name="Протокол связи"
    )
          
    # Метаданные
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")
    
    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Сеть связи"
        verbose_name_plural = "Сети связи"
        ordering = ['name']

class NetworkMembership(models.Model):
    """Модель для хранения конкретных связей между сетью, подразделением, объектами и оборудованием"""
    network = models.ForeignKey(
        CommunicationNetwork,
        on_delete=models.CASCADE,
        related_name='memberships',
        verbose_name="Сеть"
    )
    division = models.ForeignKey(
        Division,
        on_delete=models.CASCADE,
        verbose_name="Подразделение"
    )
    facility = models.ForeignKey(
        Facility,
        on_delete=models.CASCADE,
        verbose_name="Объект"
    )
    equipment = models.ForeignKey(
        'equipment.Equipment',
        on_delete=models.CASCADE,
        verbose_name="Оборудование"
    )
    
    class Meta:
        verbose_name = "Принадлежность сети"
        verbose_name_plural = "Принадлежности сетей"
        unique_together = ['network', 'division', 'facility', 'equipment']
    
    def __str__(self):
        return f"{self.network.name} - {self.division.name} - {self.facility.name} - {self.equipment.name}"        

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

    PORT_MODES = [
        ('access', 'Access'),
        ('trunk', 'Trunk'),
        ('general', 'General'),
        ('hybrid', 'Hybrid'),
    ]
    
    equipment = models.ForeignKey(
        'equipment.Equipment',
        on_delete=models.CASCADE,
        related_name='net_interfaces',
        verbose_name="Оборудование"
    )
    name = models.CharField("Название", max_length=50)
    interface_type = models.CharField("Тип", max_length=20, choices=INTERFACE_TYPES, default='physical')
    physical_type = models.CharField("Тип порта", max_length=20, choices=PHYSICAL_PORT_TYPES, blank=True, null=True)
    port_number = models.PositiveIntegerField("Номер порта", blank=True, null=True)
    slot = models.PositiveIntegerField("Слот", blank=True, null=True)
    module = models.PositiveIntegerField("Модуль", blank=True, null=True)
    enabled = models.BooleanField("Включен", default=True)
    
    # Настройки порта
    mode = models.CharField("Режим порта", max_length=10, choices=PORT_MODES, default='access')
    mac_address = models.CharField("MAC-адрес", max_length=17, blank=True)
    mtu = models.PositiveIntegerField("MTU", default=1500)
    speed = models.CharField("Скорость", max_length=20, blank=True)

    # VLAN настройки
    access_vlan = models.ForeignKey(
        VLAN,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='access_ports',
        verbose_name="Access VLAN"
    )
    is_trunk = models.BooleanField("Trunk порт", default=False)
    native_vlan = models.ForeignKey(
        VLAN,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='native_ports',
        verbose_name="Native VLAN"
    )
    
    # Подключения
    connected_to = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        verbose_name="Подключен к"
    )
    connected_device = models.ForeignKey(
        'equipment.Equipment',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='connected_interfaces',
        verbose_name="Подключенное устройство"
    )
    
    class Meta:
        verbose_name = "Сетевой интерфейс"
        verbose_name_plural = "Сетевые интерфейсы"
        ordering = ['equipment', 'slot', 'module', 'port_number']
        unique_together = ['equipment', 'name']

    def __str__(self):
        return f"{self.equipment.name} - {self.name}"


class VLANConfiguration(models.Model):
    """Конфигурация VLAN на интерфейсе"""
    interface = models.ForeignKey(
        NetworkInterface,
        on_delete=models.CASCADE,
        related_name='vlan_configurations',
        verbose_name="Интерфейс"
    )
    vlan = models.ForeignKey(
        VLAN,
        on_delete=models.CASCADE,
        verbose_name="VLAN"
    )
    is_tagged = models.BooleanField("Tagged", default=True)
    priority = models.PositiveIntegerField("Приоритет", default=0)
    
    class Meta:
        verbose_name = "Конфигурация VLAN"
        verbose_name_plural = "Конфигурации VLAN"
        unique_together = ['interface', 'vlan']


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

class RoutingTable(models.Model):
    """Таблица маршрутизации"""
    equipment = models.ForeignKey(
        'equipment.Equipment',
        on_delete=models.CASCADE,
        related_name='routing_table',
        verbose_name="Оборудование"
    )
    network = models.CharField("Сеть назначения", max_length=43)
    netmask = models.CharField("Маска сети", max_length=39)
    gateway = models.GenericIPAddressField("Шлюз", protocol='both')
    interface = models.ForeignKey(
        NetworkInterface,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="Интерфейс"
    )
    metric = models.PositiveIntegerField("Метрика", default=1)
    description = models.TextField("Описание", blank=True)
    
    class Meta:
        verbose_name = "Запись маршрутизации"
        verbose_name_plural = "Таблица маршрутизации"

class ACL(models.Model):
    """Access Control List"""
    PROTOCOL_CHOICES = [
        ('ip', 'IP'),
        ('tcp', 'TCP'),
        ('udp', 'UDP'),
        ('icmp', 'ICMP'),
    ]
    
    ACTION_CHOICES = [
        ('permit', 'Permit'),
        ('deny', 'Deny'),
    ]
    
    equipment = models.ForeignKey(
        'equipment.Equipment',
        on_delete=models.CASCADE,
        related_name='acls',
        verbose_name="Оборудование"
    )
    name = models.CharField("Название ACL", max_length=50)
    sequence = models.PositiveIntegerField("Порядковый номер")
    action = models.CharField("Действие", max_length=10, choices=ACTION_CHOICES)
    protocol = models.CharField("Протокол", max_length=10, choices=PROTOCOL_CHOICES, default='ip')
    source_network = models.CharField("Источник", max_length=43, blank=True)
    destination_network = models.CharField("Назначение", max_length=43, blank=True)
    source_port = models.PositiveIntegerField("Порт источника", null=True, blank=True)
    destination_port = models.PositiveIntegerField("Порт назначения", null=True, blank=True)
    description = models.TextField("Описание", blank=True)
    
    class Meta:
        verbose_name = "ACL"
        verbose_name_plural = "ACLs"
        unique_together = ['equipment', 'name', 'sequence']
        ordering = ['name', 'sequence']

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
        'equipment.Equipment',
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