import ipaddress

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils import timezone 
from facilities.models import Division, Facility


# ============================================================================
# СЕТЬ СВЯЗИ
# ============================================================================

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
        max_length=1, choices=NETWORK_CLASS_CHOICES,
        verbose_name="Класс сети", null=True, blank=True,
    )
    security_level = models.CharField(
        max_length=20, choices=SECURITY_LEVEL_CHOICES,
        verbose_name="Степень секретности информации",
    )

    ip_range = models.CharField(
        max_length=100, verbose_name="IP диапазон",
        help_text="Формат: 192.168.1.0/24. Устаревшее поле — используйте Subnet.",
        blank=True,
    )
    throughput = models.PositiveIntegerField(
        verbose_name="Пропускная способность (Mbps)", null=True, blank=True,
    )
    protocol = models.CharField(
        max_length=20, choices=PROTOCOL_CHOICES, default='TCP/IP',
        verbose_name="Протокол связи",
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        verbose_name = "Сеть связи"
        verbose_name_plural = "Сети связи"
        ordering = ['name']

    def __str__(self):
        return self.name


# ============================================================================
# VLAN (глобальный справочник)
# ============================================================================

class VLAN(models.Model):
    vlan_id = models.PositiveIntegerField(
        "VLAN ID",
        validators=[MinValueValidator(1), MaxValueValidator(4094)],
    )
    name = models.CharField("Название VLAN", max_length=100)
    description = models.TextField("Описание", blank=True)
    created_at = models.DateTimeField("Создан", auto_now_add=True)

    class Meta:
        verbose_name = "VLAN"
        verbose_name_plural = "VLANs"
        ordering = ['vlan_id']
        constraints = [
            models.UniqueConstraint(fields=['vlan_id'], name='unique_vlan_id'),
        ]

    def __str__(self):
        return f"{self.name} (VLAN {self.vlan_id})"


# ============================================================================
# ПОДСЕТЬ (заменяет IPRange)
# ============================================================================

class Subnet(models.Model):
    """
    Подсеть в нотации CIDR. Иерархия через `parent`:
    разбиение /24 → /25 → /26 моделируется дочерними Subnet.

    Поддерживаются IPv4 с префиксом /24 … /31.
    Подсети глобально не пересекаются (кроме родителя/потомков),
    это гарантирует глобальную уникальность IP-адресов
    (IPAddress.address = unique).
    """

    PREFIX_MIN = 24
    PREFIX_MAX = 31

    network = models.ForeignKey(
        CommunicationNetwork, on_delete=models.CASCADE,
        related_name='subnets', verbose_name="Сеть связи",
    )
    vlan = models.ForeignKey(
        VLAN, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='subnets', verbose_name="VLAN",
    )
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True,
        related_name='children', verbose_name="Родительская подсеть",
    )

    network_address = models.GenericIPAddressField("Адрес сети", protocol='ipv4')
    prefix_length = models.PositiveSmallIntegerField(
        "Префикс (маска)",
        validators=[MinValueValidator(PREFIX_MIN), MaxValueValidator(PREFIX_MAX)],
    )

    purpose = models.CharField(
        "Назначение", max_length=255, blank=True,
        help_text="Свободный текст: «Пользовательская», «DMZ», «CCTV» и т.п.",
    )
    gateway = models.GenericIPAddressField(
        "Шлюз", protocol='ipv4', null=True, blank=True,
    )
    description = models.TextField("Описание", blank=True)

    dhcp_enabled = models.BooleanField("DHCP включён", default=False)
    dhcp_pool_start = models.GenericIPAddressField(
        "DHCP: начало пула", protocol='ipv4', null=True, blank=True,
    )
    dhcp_pool_end = models.GenericIPAddressField(
        "DHCP: конец пула", protocol='ipv4', null=True, blank=True,
    )

    created_at = models.DateTimeField("Создана", auto_now_add=True)
    updated_at = models.DateTimeField("Обновлена", auto_now=True)

    class Meta:
        verbose_name = "Подсеть"
        verbose_name_plural = "Подсети"
        ordering = ['network', 'network_address', 'prefix_length']
        unique_together = [('network', 'network_address', 'prefix_length')]
        indexes = [
            models.Index(fields=['network_address']),
            models.Index(fields=['network', 'prefix_length']),
        ]

    def __str__(self):
        return self.cidr

    # ---------- вычисляемые свойства ----------

    @property
    def ip_network(self) -> ipaddress.IPv4Network:
        return ipaddress.IPv4Network(
            f"{self.network_address}/{self.prefix_length}", strict=False,
        )

    @property
    def cidr(self) -> str:
        return str(self.ip_network)

    @property
    def netmask(self) -> str:
        return str(self.ip_network.netmask)

    @property
    def broadcast(self) -> str:
        return str(self.ip_network.broadcast_address)

    @property
    def first_host(self) -> str:
        if self.prefix_length == 31:
            return str(self.ip_network.network_address)
        return str(self.ip_network.network_address + 1)

    @property
    def last_host(self) -> str:
        if self.prefix_length == 31:
            return str(self.ip_network.broadcast_address)
        return str(self.ip_network.broadcast_address - 1)

    @property
    def host_count(self) -> int:
        if self.prefix_length == 31:
            return 2
        return max(self.ip_network.num_addresses - 2, 0)

    # ---------- валидация ----------

    def _validate_overlap(self, net: ipaddress.IPv4Network):
        """
        Проверяет, что `net` не пересекается ни с какой другой подсетью
        (кроме своего родителя и своих потомков).
        Возвращает конфликтующую Subnet или None.
        """
        if self._state.adding:
            qs = Subnet.objects.all()
            if self.parent_id:
                qs = qs.exclude(pk=self.parent_id)
        else:
            exclude_ids = list(self.children.values_list('id', flat=True))
            if self.parent_id:
                exclude_ids.append(self.parent_id)
            qs = Subnet.objects.exclude(pk=self.pk)
            if exclude_ids:
                qs = qs.exclude(pk__in=exclude_ids)

        for other in qs.only('id', 'network_address', 'prefix_length', 'network'):
            if net.overlaps(other.ip_network):
                return other
        return None

    def clean(self):
        errors = {}

        try:
            net = self.ip_network
        except ValueError as e:
            raise ValidationError({'network_address': f'Некорректный адрес: {e}'})

        if str(net.network_address) != self.network_address:
            errors['network_address'] = (
                f'Адрес {self.network_address} не является сетевым. '
                f'Для /{self.prefix_length} сетевой адрес: {net.network_address}'
            )

        if not self._state.adding:
            old = Subnet.objects.filter(pk=self.pk).first()
            if old and old.cidr != self.cidr and old.children.exists():
                errors['network_address'] = (
                    'Нельзя изменить CIDR: у подсети есть дочерние подсети'
                )

        if self.gateway:
            try:
                gw = ipaddress.IPv4Address(self.gateway)
            except ValueError:
                errors['gateway'] = 'Некорректный IPv4-адрес шлюза'
            else:
                if gw not in net:
                    errors['gateway'] = 'Шлюз вне подсети'
                elif self.prefix_length <= 30 and gw in (
                    net.network_address, net.broadcast_address,
                ):
                    errors['gateway'] = (
                        'Шлюз не может быть сетевым или широковещательным адресом'
                    )

        if self.dhcp_enabled:
            if not (self.dhcp_pool_start and self.dhcp_pool_end):
                errors['dhcp_pool_start'] = (
                    'Для включённого DHCP задайте начало и конец пула'
                )
            else:
                try:
                    ps = ipaddress.IPv4Address(self.dhcp_pool_start)
                    pe = ipaddress.IPv4Address(self.dhcp_pool_end)
                except ValueError:
                    errors['dhcp_pool_start'] = 'Некорректный адрес DHCP-пула'
                else:
                    if ps not in net or pe not in net:
                        errors['dhcp_pool_start'] = (
                            'DHCP-пул должен быть внутри подсети'
                        )
                    elif ps > pe:
                        errors['dhcp_pool_start'] = 'Начало DHCP-пула больше конца'

        if self.parent_id:
            if self.parent_id == self.pk:
                errors['parent'] = 'Подсеть не может быть родителем самой себе'
            else:
                parent_net = self.parent.ip_network
                if not net.subnet_of(parent_net):
                    errors['parent'] = (
                        f'Подсеть {self.cidr} не входит в '
                        f'родительскую {self.parent.cidr}'
                    )
                elif net == parent_net:
                    errors['parent'] = 'Подсеть не может совпадать с родительской'

        if not errors:
            conflict = self._validate_overlap(net)
            if conflict is not None:
                errors['network_address'] = (
                    f'Подсеть {self.cidr} пересекается с {conflict.cidr} '
                    f'(сеть: {conflict.network.name})'
                )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


# ============================================================================
# ПРИНАДЛЕЖНОСТЬ СЕТИ (NetworkMembership)
# ============================================================================

class NetworkMembership(models.Model):
    network = models.ForeignKey(
        CommunicationNetwork, on_delete=models.CASCADE,
        related_name='memberships', verbose_name="Сеть",
    )
    division = models.ForeignKey(
        Division, on_delete=models.CASCADE, verbose_name="Подразделение",
    )
    facility = models.ForeignKey(
        Facility, on_delete=models.CASCADE, verbose_name="Объект",
    )
    equipment = models.ForeignKey(
        'equipment.Equipment', on_delete=models.CASCADE,
        verbose_name="Оборудование",
    )

    class Meta:
        verbose_name = "Принадлежность сети"
        verbose_name_plural = "Принадлежности сетей"
        unique_together = ['network', 'division', 'facility', 'equipment']

    def __str__(self):
        return (
            f"{self.network.name} — {self.division.name} — "
            f"{self.facility.name} — {self.equipment.name}"
        )

    def clean(self):
        errors = {}
        if self.division_id and self.facility_id:
            if self.facility.division_id != self.division_id:
                errors['facility'] = (
                    'Объект не принадлежит указанному подразделению'
                )
        if self.facility_id and self.equipment_id:
            if self.equipment.facility_id != self.facility_id:
                errors['equipment'] = (
                    'Оборудование не принадлежит указанному объекту'
                )
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


# ============================================================================
# НАПРАВЛЕНИЕ СВЯЗИ (NetworkDirection)
# ============================================================================

class NetworkDirection(models.Model):
    network = models.ForeignKey(
        CommunicationNetwork, on_delete=models.CASCADE,
        related_name='directions', verbose_name="Сеть",
    )
    from_membership = models.ForeignKey(
        NetworkMembership, on_delete=models.CASCADE,
        related_name='outgoing_directions', verbose_name="Откуда (источник)",
    )
    to_membership = models.ForeignKey(
        NetworkMembership, on_delete=models.CASCADE,
        related_name='incoming_directions', verbose_name="Куда (назначение)",
    )
    bandwidth = models.PositiveIntegerField(
        "Пропускная способность (Mbps)", null=True, blank=True,
    )
    latency = models.PositiveIntegerField(
        "Задержка (ms)", null=True, blank=True,
    )
    description = models.TextField("Описание", blank=True)
    created_at = models.DateTimeField("Создано", auto_now_add=True)

    class Meta:
        verbose_name = "Направление сети"
        verbose_name_plural = "Направления сетей"
        unique_together = ['network', 'from_membership', 'to_membership']

    def __str__(self):
        return f"{self.from_membership} → {self.to_membership}"

    def clean(self):
        errors = {}
        if self.from_membership_id and self.to_membership_id:
            if self.from_membership_id == self.to_membership_id:
                errors['to_membership'] = (
                    'Источник и назначение не могут совпадать'
                )
        if self.network_id and self.from_membership_id:
            if self.from_membership.network_id != self.network_id:
                errors['from_membership'] = 'Источник принадлежит другой сети'
        if self.network_id and self.to_membership_id:
            if self.to_membership.network_id != self.network_id:
                errors['to_membership'] = 'Назначение принадлежит другой сети'
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


# ============================================================================
# СЕТЕВОЙ ИНТЕРФЕЙС
# ============================================================================

class NetworkInterface(models.Model):
    INTERFACE_TYPES = [
        ('physical', 'Физический порт'),
        ('bond', 'Bond / LAG'),
        ('bridge', 'Bridge'),
        ('vlan', 'VLAN Interface'),
        ('loopback', 'Loopback'),
        ('port-channel', 'Port-Channel'),
        ('tunnel', 'Tunnel'),
        ('virtual', 'Виртуальный'),
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
        'equipment.Equipment', on_delete=models.CASCADE,
        related_name='net_interfaces', verbose_name="Оборудование",
    )
    name = models.CharField("Название", max_length=50)
    interface_type = models.CharField(
        "Тип", max_length=20, choices=INTERFACE_TYPES, default='physical',
    )
    physical_type = models.CharField(
        "Тип порта", max_length=20, choices=PHYSICAL_PORT_TYPES,
        blank=True, null=True,
    )
    port_number = models.PositiveIntegerField("Номер порта", blank=True, null=True)
    slot = models.PositiveIntegerField("Слот", blank=True, null=True)
    module = models.PositiveIntegerField("Модуль", blank=True, null=True)
    enabled = models.BooleanField("Включен", default=True)

    mode = models.CharField(
        "Режим порта", max_length=10, choices=PORT_MODES, default='access',
    )
    mac_address = models.CharField("MAC-адрес", max_length=17, blank=True)
    mtu = models.PositiveIntegerField("MTU", default=1500)
    speed = models.CharField("Скорость", max_length=20, blank=True)

    access_vlan = models.ForeignKey(
        VLAN, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='access_ports', verbose_name="Access VLAN",
    )
    is_trunk = models.BooleanField("Trunk порт", default=False)
    native_vlan = models.ForeignKey(
        VLAN, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='native_ports', verbose_name="Native VLAN",
    )

    connected_to = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        verbose_name="Подключен к интерфейсу",
    )

    class Meta:
        verbose_name = "Сетевой интерфейс"
        verbose_name_plural = "Сетевые интерфейсы"
        ordering = ['equipment', 'slot', 'module', 'port_number']
        unique_together = ['equipment', 'name']

    def __str__(self):
        return f"{self.equipment.name} — {self.name}"


# ============================================================================
# КОНФИГУРАЦИЯ VLAN НА ИНТЕРФЕЙСЕ
# ============================================================================

class VLANConfiguration(models.Model):
    interface = models.ForeignKey(
        NetworkInterface, on_delete=models.CASCADE,
        related_name='vlan_configurations', verbose_name="Интерфейс",
    )
    vlan = models.ForeignKey(
        VLAN, on_delete=models.CASCADE, verbose_name="VLAN",
    )
    is_tagged = models.BooleanField("Tagged", default=True)
    priority = models.PositiveIntegerField("Приоритет", default=0)

    class Meta:
        verbose_name = "Конфигурация VLAN"
        verbose_name_plural = "Конфигурации VLAN"
        unique_together = ['interface', 'vlan']


# ============================================================================
# IP-АДРЕС (IPAM)
# ============================================================================

class IPAddress(models.Model):
    STATUS_CHOICES = [
        ('free', 'Свободен'),
        ('reserved', 'Зарезервирован'),
        ('in_use', 'Используется'),
        ('deprecated', 'Устарел'),
    ]

    subnet = models.ForeignKey(
        Subnet, on_delete=models.CASCADE,
        related_name='ip_addresses', verbose_name="Подсеть",
        null=True, blank=True,  
    )
    interface = models.ForeignKey(
        NetworkInterface, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ip_addresses', verbose_name="Сетевой интерфейс",
    )

    address = models.GenericIPAddressField(
        "IP-адрес", protocol='ipv4', unique=True,
    )

    status = models.CharField(
        "Статус", max_length=20, choices=STATUS_CHOICES, default='free',
    )
    is_primary = models.BooleanField("Основной адрес", default=False)
    hostname = models.CharField(
        "Hostname", max_length=255, blank=True, default='',  # TEMP
    )
    purpose = models.CharField(
        "Назначение", max_length=255, blank=True, default='',  # TEMP
        help_text="Свободный текст: «Сервер БД», «Принтер», «GW» и т.п.",
    )
    assigned_to = models.CharField(
        "Кому/чему назначен", max_length=255, blank=True, default='',  # TEMP
    )
    description = models.TextField("Описание", blank=True)

    created_at = models.DateTimeField(  # TEMP: было auto_now_add=True
        "Создан", default=timezone.now,
    )
    updated_at = models.DateTimeField(  # TEMP: было auto_now=True
        "Обновлён", default=timezone.now,
    )

    class Meta:
        verbose_name = "IP-адрес"
        verbose_name_plural = "IP-адреса"
        ordering = ['address']
        indexes = [
            models.Index(fields=['subnet', 'status']),
            models.Index(fields=['interface']),
        ]

    def __str__(self):
        return self.address

    def clean(self):
        errors = {}

        if not self.subnet_id:
            raise ValidationError({'subnet': 'Укажите подсеть'})

        try:
            addr = ipaddress.IPv4Address(self.address)
        except (ValueError, TypeError):
            raise ValidationError({'address': 'Некорректный IPv4-адрес'})

        net = self.subnet.ip_network
        if addr not in net:
            errors['address'] = (
                f'Адрес {self.address} не входит в подсеть {self.subnet.cidr}'
            )
        elif self.subnet.prefix_length <= 30 and addr in (
            net.network_address, net.broadcast_address,
        ):
            errors['address'] = (
                'Сетевой или широковещательный адрес нельзя назначить'
            )

        if self.status == 'in_use' and not (self.interface_id or self.assigned_to):
            errors['status'] = (
                'Для статуса «Используется» укажите интерфейс '
                'или поле «Кому назначен»'
            )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


# ============================================================================
# МАРШРУТИЗАЦИЯ
# ============================================================================

class RoutingTable(models.Model):
    equipment = models.ForeignKey(
        'equipment.Equipment', on_delete=models.CASCADE,
        related_name='routing_table', verbose_name="Оборудование",
    )
    network = models.CharField("Сеть назначения", max_length=43)
    netmask = models.CharField("Маска сети", max_length=39)
    gateway = models.GenericIPAddressField("Шлюз", protocol='both')
    interface = models.ForeignKey(
        NetworkInterface, on_delete=models.CASCADE,
        null=True, blank=True, verbose_name="Интерфейс",
    )
    metric = models.PositiveIntegerField("Метрика", default=1)
    description = models.TextField("Описание", blank=True)

    class Meta:
        verbose_name = "Запись маршрутизации"
        verbose_name_plural = "Таблица маршрутизации"


# ============================================================================
# ACL
# ============================================================================

class ACL(models.Model):
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
        'equipment.Equipment', on_delete=models.CASCADE,
        related_name='acls', verbose_name="Оборудование",
    )
    name = models.CharField("Название ACL", max_length=50)
    sequence = models.PositiveIntegerField("Порядковый номер")
    action = models.CharField("Действие", max_length=10, choices=ACTION_CHOICES)
    protocol = models.CharField(
        "Протокол", max_length=10, choices=PROTOCOL_CHOICES, default='ip',
    )
    source_network = models.CharField("Источник", max_length=43, blank=True)
    destination_network = models.CharField("Назначение", max_length=43, blank=True)
    source_port = models.PositiveIntegerField("Порт источника", null=True, blank=True)
    destination_port = models.PositiveIntegerField(
        "Порт назначения", null=True, blank=True,
    )
    description = models.TextField("Описание", blank=True)

    class Meta:
        verbose_name = "ACL"
        verbose_name_plural = "ACLs"
        unique_together = ['equipment', 'name', 'sequence']
        ordering = ['name', 'sequence']