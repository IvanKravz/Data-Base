# employees/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import Employee, ShaWorkerDetails, ShaEquipmentConclusion


class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'division', 'subdivision', 'rank', 'position', 'category', 'priority', 'photo_preview')
    list_filter = ('category', 'division', 'subdivision', 'is_sha_worker', 'is_material_responsible')
    search_fields = ('full_name', 'position', 'rank')
    ordering = ('priority', 'full_name')
    raw_id_fields = ('division', 'subdivision')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('photo', 'full_name', 'position', 'rank', 'category', 'subcategory', 'priority')
        }),
        ('Контактные данные', {
            'fields': ('personal_number', 'personal_phone', 'work_phone', 'birth_date')
        }),
        ('Служебная информация', {
            'fields': ('contract_date', 'date_start_work', 'date_end_work', 'order_rank')
        }),
        ('Допуск к гостайне', {
            'fields': ('form_state_secrets', 'number_state_secrets', 'data_state_secrets')
        }),
        ('Образование', {
            'fields': ('education', 'institution', 'year_graduation')
        }),
        ('Подразделение', {
            'fields': ('division', 'subdivision')
        }),
        ('Дополнительно', {
            'fields': ('is_sha_worker', 'is_material_responsible', 'description')
        }),
        ('Системные', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def photo_preview(self, obj):
        if obj.photo:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 5px;" />', obj.photo.url)
        return format_html('<div style="width: 50px; height: 50px; background: #f0f0f0; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #999;">Нет фото</div>')
    photo_preview.short_description = 'Фото'


class ShaWorkerDetailsAdmin(admin.ModelAdmin):
    list_display = ('employee', 'access_level', 'start_date', 'created_at')
    raw_id_fields = ('employee',)
    list_filter = ('access_level', 'start_date')
    search_fields = ('employee__full_name',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (None, {
            'fields': ('employee', 'start_date', 'access_level')
        }),
        ('Системные', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class ShaEquipmentConclusionAdmin(admin.ModelAdmin):
    list_display = ('sha_worker', 'equipment_type', 'conclusion_number', 'created_at')
    raw_id_fields = ('sha_worker',)
    list_filter = ('equipment_type',)
    search_fields = ('sha_worker__employee__full_name', 'conclusion_number', 'equipment_type')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (None, {
            'fields': ('sha_worker', 'equipment_type', 'conclusion_number')
        }),
        ('Системные', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


admin.site.register(Employee, EmployeeAdmin)
admin.site.register(ShaWorkerDetails, ShaWorkerDetailsAdmin)
admin.site.register(ShaEquipmentConclusion, ShaEquipmentConclusionAdmin)