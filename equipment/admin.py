from django.contrib import admin
from django.utils.html import format_html
from django.db import models
from django.apps import apps
from .models import EquipmentCategory, ProductStructure, Equipment

@admin.register(EquipmentCategory)
class EquipmentCategoryAdmin(admin.ModelAdmin):
    list_display = ('value', 'name', 'is_closed')
    list_filter = ('is_closed',)
    search_fields = ('value', 'name')

class ProductStructureInline(admin.StackedInline):
    model = ProductStructure
    extra = 1
    fields = ('name', 'model', 'serial_number', 'note')
    verbose_name = 'Компонент изделия'
    verbose_name_plural = 'Состав изделия'
    classes = ('collapse',)
    show_change_link = True

class NetworkInterfaceInline(admin.TabularInline):
    model = apps.get_model('networks', 'NetworkInterface')
    fk_name = 'equipment'  
    extra = 1
    fields = ('name', 'interface_type', 'physical_type', 'port_number', 'enabled', 'mode', 'speed')
    verbose_name = 'Сетевой интерфейс'
    verbose_name_plural = 'Сетевые интерфейсы'
    classes = ('collapse',)

class VLANInline(admin.TabularInline):
    model = Equipment.vlans.through
    extra = 1
    verbose_name = 'VLAN'
    verbose_name_plural = 'VLANы'
    classes = ('collapse',)

# Убираем IPAddressInline, RoutingTableInline и ACLInline, так как они не имеют прямых связей с Equipment
# Вместо этого, IP адреса можно просматривать через NetworkInterface

@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'get_category_display', 'status_colored', 'is_network', 'division', 'subdivision', 'assigned_to', 'facility', 'network_interfaces_count')
    list_filter = ('is_closed', 'is_network', 'status', 'division', 'facility', 'category')
    search_fields = (
        'name', 'serial_number', 'inventory_number', 
        'first_invoice', 'material_invoice', 'ver_software',
        'comments', 'disposal_act_number', 'disposal_cert_number'
    )
    raw_id_fields = ('assigned_to', 'facility', 'category')
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'type', 'is_closed', 'is_network', 'category', 'status', 'comments')
        }),
        ('Идентификация', {
            'fields': (
                'serial_number', 'inventory_number',
                'first_invoice', 'material_invoice', 
                'ver_software'
            )
        }),
        ('Даты', {
            'fields': ('manufacturing_date', 'exploitation_date')
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
    )
    readonly_fields = ('created_at', 'updated_at', 'network_interfaces_count')

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            _components_count=models.Count('product_structures'),
            _interfaces_count=models.Count('net_interfaces')
        )

    def components_count(self, obj):
        return obj._components_count
    components_count.short_description = 'Компоненты'
    components_count.admin_order_field = '_components_count'

    def network_interfaces_count(self, obj):
        return obj._interfaces_count
    network_interfaces_count.short_description = 'Интерфейсы'
    network_interfaces_count.admin_order_field = '_interfaces_count'

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

    def get_inlines(self, request, obj=None):
        inlines = [ProductStructureInline]
        
        if obj and obj.is_network:
            # Добавляем инлайны только для тех моделей, которые имеют прямую связь с Equipment
            inlines.extend([
                NetworkInterfaceInline,
                VLANInline,
                # Убраны IPAddressInline, RoutingTableInline и ACLInline
                # так как они не имеют прямых ForeignKey к Equipment
            ])
        
        return inlines

    # Добавляем метод для просмотра связанных IP адресов
    def ip_addresses(self, obj):
        if obj.is_network:
            IPAddress = apps.get_model('networks', 'IPAddress')
            addresses = IPAddress.objects.filter(interface__equipment=obj)
            return ", ".join([f"{addr.address}/{addr.netmask}" for addr in addresses])
        return "—"
    ip_addresses.short_description = 'IP адреса'