from django.contrib import admin
from django.utils.html import format_html
from .models import Equipment, ClosedEquipmentCategory

@admin.register(ClosedEquipmentCategory)
class ClosedEquipmentCategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'get_category_display', 'status_colored', 'division', 'subdivision', 'assigned_to', 'facility')
    list_filter = ('is_closed', 'status', 'division', 'facility')
    search_fields = ('name', 'serial_number', 'inventory_number', 'comments', 'disposal_act_number', 'disposal_cert_number')
    raw_id_fields = ('assigned_to', 'facility')
    
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

    def get_category_display(self, obj):
        return obj.get_category_display()
    get_category_display.short_description = 'Категория'

    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'type', 'is_closed', 'open_category', 'closed_category', 'status', 'comments')
        }),
        ('Идентификация', {
            'fields': ('serial_number', 'inventory_number')
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