from django import forms
from django.contrib import admin
from .models import CommunicationPost, Division, FacilityType, Subdivision, Facility

class SubdivisionInline(admin.TabularInline):
    model = Subdivision
    extra = 1
    show_change_link = True
    fieldsets = (
        (None, {
            'fields': ('name', 'division', 'staff_planned_total')
        }),
        ('Детали штата', {
            'fields': (
                'staff_planned_management',
                'staff_planned_officers',
                'staff_planned_warrant_officers',
                'staff_planned_civilian'
            ),
            'classes': ('collapse',)  # Эта секция будет скрыта по умолчанию
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Division)
class DivisionAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'name', 'staff_planned_total', 
        'employees_count', 'management_count', 'officers_count',
        'warrant_officers_count', 'civilian_count',
        'equipment_count', 'tasks_count', 'facilities_count', 'created_at'
    )
    search_fields = ('name',)
    readonly_fields = ('facilities_list', 'created_at', 'updated_at')
    inlines = [SubdivisionInline]


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

    fieldsets = (
        ('Основная информация', {
            'fields': (
                'name', 'staff_planned_total', 'staff_planned_management',
                'staff_planned_officers', 'staff_planned_warrant_officers',
                'staff_planned_civilian'
            )
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(FacilityType)
class FacilityTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'is_closed_type', 'created_at')
    search_fields = ('name',)
    list_filter = ('created_at', 'is_closed_type')  
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'is_closed_type') 
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
class CommunicationPostInline(admin.TabularInline):
    model = Facility.communication_posts.through
    extra = 1
    verbose_name = 'Пост связи'
    verbose_name_plural = 'Посты связи'
    autocomplete_fields = ['communicationpost']

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
    list_display = ('name', 'division', 'subdivision', 'description', 'created_at')
    list_filter = ('division', 'subdivision', 'created_at')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (None, {
            'fields': ('name', 'division', 'subdivision', 'description')
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    form = FacilityAdminForm 
    list_display = (
        'id', 'name', 'type', 'facility_class', 'division', 
        'subdivision', 'is_closed', 'communication_posts_list', 
        'inn', 'equipment_count', 'latitude', 'longitude'
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
                ('city', 'street', 'house_number'), 'address',
                'comments', 'is_closed', 'inn',  # <-- возможно, здесь
                'latitude', 'longitude'           # <-- добавить
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
    readonly_fields = ('address', 'created_at', 'updated_at')

    def facility_class_display(self, obj):
        return dict(Facility.FACILITY_CLASSES).get(obj.facility_class, '')
    facility_class_display.short_description = 'Класс'


    def equipment_count(self, obj):
        return obj.equipment.count()
    equipment_count.short_description = 'Оборудование'

    def communication_posts_list(self, obj):
        return ", ".join([f"{post.name}" for post in obj.communication_posts.all()])
    communication_posts_list.short_description = 'Посты связи'

    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        return fieldsets