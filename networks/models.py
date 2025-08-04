from django.db import models
from equipment.models import Equipment
from facilities.models import Division, Facility, Subdivision

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
    
    # Связи с другими моделями
    divisions = models.ManyToManyField(
        Division, 
        verbose_name="Подразделения", 
        related_name='communication_networks', 
        blank=True
    )
    subdivisions = models.ManyToManyField(
        Subdivision, 
        verbose_name="Отделения", 
        related_name='communication_networks', 
        blank=True
    )
    facilities = models.ManyToManyField(
        Facility, 
        verbose_name="Объекты", 
        related_name='communication_networks', 
        blank=True
    )
    equipment = models.ManyToManyField(
        Equipment, 
        verbose_name="Техника", 
        related_name='communication_networks', 
        blank=True
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