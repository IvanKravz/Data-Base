from django.contrib import admin
from django.utils.html import format_html
from django.db import models  # Добавляем импорт models
from .models import (
    Equipment, ClosedEquipmentCategory, OpenEquipmentCategory, ProductStructure, 
    VLAN, NetworkInterface, IPAddress, IPRange
)
@admin.register(ClosedEquipmentCategory)
class ClosedEquipmentCategoryAdmin(admin.ModelAdmin):
    list_display = ('value', 'name') 
    search_fields = ('value', 'name')

@admin.register(OpenEquipmentCategory)
class OpenEquipmentCategoryAdmin(admin.ModelAdmin):
    list_display = ('value', 'name')
    search_fields = ('value', 'name')

class ProductStructureInline(admin.StackedInline):
    model = ProductStructure
    extra = 1
    fields = ('name', 'model', 'serial_number', 'note')
    verbose_name = 'Компонент изделия'
    verbose_name_plural = 'Состав изделия'
    classes = ('collapse',)
    show_change_link = True

class NetworkInterfaceInline(admin.StackedInline):
    model = NetworkInterface
    extra = 0
    fields = ('name', 'interface_type', 'physical_type', 'enabled', 'vlan', 'is_trunk', 'native_vlan')
    verbose_name = 'Сетевой интерфейс'
    verbose_name_plural = 'Сетевые интерфейсы'
    classes = ('collapse',)
    show_change_link = True

class IPAddressInline(admin.StackedInline):
    model = IPAddress
    extra = 0
    fields = ('address', 'netmask', 'version', 'is_primary', 'gateway')
    verbose_name = 'IP-адрес'
    verbose_name_plural = 'IP-адреса'
    classes = ('collapse',)

@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'get_category_display', 'status_colored', 'division', 'subdivision', 'assigned_to', 'facility', 'components_count')
    list_filter = ('is_closed', 'status', 'division', 'facility', 'open_category', 'closed_category')
    search_fields = (
        'name', 'serial_number', 'inventory_number', 
        'first_invoice', 'material_invoice', 'ver_software',
        'comments', 'disposal_act_number', 'disposal_cert_number'
    )
    raw_id_fields = ('assigned_to', 'facility', 'open_category', 'closed_category')
    inlines = [ProductStructureInline, NetworkInterfaceInline]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'type', 'is_closed', 'open_category', 'closed_category', 'status', 'comments')
        }),
        ('Идентификация', {
            'fields': (
                'serial_number', 'inventory_number',
                'first_invoice', 'material_invoice', 
                'ver_software'
            )
        }),
        ('Даты', {
            'fields': ('manufacturing_date', 'purchase_date')
        }),
        ('Принадлежность', {
            'fields': ('division', 'subdivision', 'facility', 'assigned_to')
        }),
        ('Информация о списании', {
            'fields': (
                'disposal_act_number', 'disposal_act_date',
                'disposal_cert_number', 'disposal_cert_date',
                'disposal_comments'
            ),
            'classes': ('collapse',)
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            _components_count=models.Count('product_structures')
        )

    def components_count(self, obj):
        return obj._components_count
    components_count.short_description = 'Компоненты'
    components_count.admin_order_field = '_components_count'

    def status_colored(self, obj):
        colors = {
            'in-operation': 'green',
            'in-storage': 'blue',
            'defective': 'orange',
            'for-disposal': 'red',
            'disposed': 'purple'
        }
        return format_html(
            '<span style="color: {};">{}</span>',
            colors.get(obj.status, 'black'),
            obj.get_status_display()
        )
    status_colored.short_description = 'Status'

    def get_inline_instances(self, request, obj=None):
        """Показывать сетевые интерфейсы только для сетевого оборудования"""
        inlines = super().get_inline_instances(request, obj)
        if obj and obj.is_network_device:
            # Добавляем IPAddressInline только если есть интерфейсы
            if obj.network_interfaces.exists():
                inlines.append(IPAddressInline(self.model, self.admin_site))
        return inlines
    
# Регистрация новых моделей
@admin.register(VLAN)
class VLANAdmin(admin.ModelAdmin):
    list_display = ('vlan_id', 'name', 'description')
    search_fields = ('name', 'vlan_id')

@admin.register(NetworkInterface)
class NetworkInterfaceAdmin(admin.ModelAdmin):
    list_display = ('name', 'equipment', 'interface_type', 'enabled')
    list_filter = ('interface_type', 'enabled')
    search_fields = ('name', 'equipment__name')

@admin.register(IPAddress)
class IPAddressAdmin(admin.ModelAdmin):
    list_display = ('address', 'netmask', 'interface', 'is_primary')
    search_fields = ('address', 'interface__name')

@admin.register(IPRange)
class IPRangeAdmin(admin.ModelAdmin):
    list_display = ('network', 'description')
    filter_horizontal = ('devices',)
    search_fields = ('network', 'description')