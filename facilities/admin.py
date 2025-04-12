from django.contrib import admin
from .models import Division, Subdivision, Facility

@admin.register(Subdivision)
class SubdivisionAdmin(admin.ModelAdmin):
    list_display = ('name', 'division', 'staff_planned_total')
    list_filter = ('division',)
    search_fields = ('name',)
    
    # def staff_completion(self, obj):
    #     return f"{round((obj.staff_actual / obj.staff_planned_total) * 100, 2)}%" if obj.staff_planned_total > 0 else "0%"
    # staff_completion.short_description = 'Укомплектованность'

@admin.register(Division)
class DivisionAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'staff_planned_total', 
        'employees_count', 'management_count', 'officers_count',
        'warrant_officers_count', 'civilian_count',
        'equipment_count', 'tasks_count', 'facilities_count', 'created_at'
    )
    search_fields = ('name',)
    
    def employees_count(self, obj):
        return obj.get_employees_count()
    employees_count.short_description = 'Все сотрудники'
    
    def management_count(self, obj):
        return obj.get_management_count()
    management_count.short_description = 'Руководство'
    
    def officers_count(self, obj):
        return obj.get_officers_count()
    officers_count.short_description = 'Офицеры'
    
    def warrant_officers_count(self, obj):
        return obj.get_warrant_officers_count()
    warrant_officers_count.short_description = 'Прапорщики'
    
    def civilian_count(self, obj):
        return obj.get_civilian_count()
    civilian_count.short_description = 'Гражданские'
    
    def equipment_count(self, obj):
        return obj.get_equipment_count()
    equipment_count.short_description = 'Оборудование'

    def facilities_count(self, obj):
        return obj.get_facilities_count()
    facilities_count.short_description = 'Объекты'
    
    def tasks_count(self, obj):
        return obj.get_tasks_count()
    tasks_count.short_description = 'Задачи'
    
    # def staff_completion(self, obj):
    #     total_actual = obj.get_employees_count()
    #     return f"{round((total_actual / obj.staff_planned_total) * 100, 2)}%" if obj.staff_planned_total > 0 else "0%"
    # staff_completion.short_description = 'Укомплектованность'

@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'facility_class', 'division', 'subdivision', 'equipment_count')
    list_filter = ('type', 'facility_class', 'division', 'subdivision')
    search_fields = ('name', 'address', 'comments')
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'type', 'facility_class', 'address', 'comments')
        }),
        ('Принадлежность', {
            'fields': ('division', 'subdivision')
        }),
        ('Документация', {
            'fields': (
                'acceptance_act_number', 'rim_act_number',
                'commissioning_act_number', 'opening_permission_number'
            ),
            'classes': ('collapse',)
        }),
        ('Информация о КЗ', {
            'fields': ('kz_size', 'has_transformer_in_kz', 'has_grounding_in_kz'),
            'classes': ('collapse',)
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')
    
    def equipment_count(self, obj):
        return obj.equipment.count()
    equipment_count.short_description = 'Оборудование'