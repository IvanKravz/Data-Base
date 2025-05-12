from django import forms
from django.contrib import admin
from .models import CommunicationPost, Division, Subdivision, Facility

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
    readonly_fields = ('facilities_list',)

    def facilities_list(self, obj):
        return ", ".join([f.name for f in obj.facilities.all()])
    facilities_list.short_description = 'Объекты'
    
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
    
class CommunicationPostInline(admin.TabularInline):
    model = Facility.communication_posts.through
    extra = 1
    verbose_name = 'Пост связи'
    verbose_name_plural = 'Посты связи'

    def get_formset(self, request, obj=None, **kwargs):      
        return super().get_formset(request, obj, **kwargs)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "communicationpost":
            obj_id = request.resolver_match.kwargs.get('object_id')
            if obj_id:
                try:
                    facility = Facility.objects.get(id=obj_id)
                    if facility.division:
                        kwargs["queryset"] = CommunicationPost.objects.filter(
                            division=facility.division
                        )
                        if facility.subdivision:
                            kwargs["queryset"] = kwargs["queryset"].filter(
                                subdivision=facility.subdivision
                            )
                except Facility.DoesNotExist:
                    pass
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

class FacilityAdminForm(forms.ModelForm):
    class Meta:
        model = Facility
        fields = '__all__'
        exclude = ('communication_posts',)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

@admin.register(CommunicationPost)
class CommunicationPostAdmin(admin.ModelAdmin):
    list_display = ('name', 'value', 'division', 'subdivision')
    list_filter = ('division', 'subdivision')
    search_fields = ('name', 'value')

@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    form = FacilityAdminForm 
    list_display = (
        'name', 'type', 'facility_class', 'division', 
        'subdivision', 'is_closed', 'communication_posts_list', 
        'inn', 'equipment_count'
    )
    list_filter = (
        'type', 'facility_class', 'division', 
        'subdivision', 'is_closed'
    )
    search_fields = ('name', 'address', 'comments', 'inn')
    filter_horizontal = ()
    list_select_related = ('division', 'subdivision')
    prefetch_related = ('communication_posts',)
    inlines = [CommunicationPostInline]
    
    fieldsets = (
        ('Основная информация', {
            'fields': (
                'name', 'type', 'facility_class', 
                'address', 'comments', 'is_closed',
                'inn'
            )
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

    def communication_posts_list(self, obj):
        return ", ".join([f"{post.name} ({post.value})" for post in obj.communication_posts.all()])
    communication_posts_list.short_description = 'Посты связи'

    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        return fieldsets