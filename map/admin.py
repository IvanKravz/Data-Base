# maps/admin.py
from django.contrib import admin
from .models import FSBOffice

@admin.register(FSBOffice)
class FSBOfficeAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'region', 'phone_operator', 
        'phone_communication', 'is_active', 'created_at'
    ]
    list_filter = ['region', 'is_active', 'created_at']
    search_fields = ['name', 'region', 'address']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'address', 'region', 'description')
        }),
        ('Контактная информация', {
            'fields': (
                'phone_operator', 
                'phone_communication', 
                'fax', 
                'email'
            )
        }),
        ('Статус', {
            'fields': ('is_active',)
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )