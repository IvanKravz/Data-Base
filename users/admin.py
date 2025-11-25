# admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin, GroupAdmin
from django.contrib.auth.models import Group
from .models import Employee, ShaWorkerDetails, ShaEquipmentConclusion, User
from django.utils.html import format_html
from .permissions_config import ROLE_PERMISSIONS, get_role_from_group


class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'get_roles', 'is_global_view', 'division', 'subdivision', 'is_staff', 'is_active')
    list_filter = ('groups', 'is_staff', 'is_active', 'user_division', 'user_subdivision')
    filter_horizontal = ('groups', 'user_permissions')
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('email', 'employee', 'user_division', 'user_subdivision')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_global_view', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    def get_roles(self, obj):
        roles = obj.get_roles()
        role_names = []
        for role in roles:
            if role in ROLE_PERMISSIONS:
                role_names.append(ROLE_PERMISSIONS[role]['name'])
            else:
                role_names.append(role)
        return ", ".join(role_names)
    get_roles.short_description = 'Роли'

    def division(self, obj):
        return obj.division.name if obj.division else "-"
    division.short_description = 'Подразделение'

    def subdivision(self, obj):
        return obj.subdivision.name if obj.subdivision else "-"
    subdivision.short_description = 'Отделение'


class CustomGroupAdmin(GroupAdmin):
    list_display = ('name', 'get_role_display_name', 'get_role_description', 'user_count', 'get_available_models')
    list_filter = ('name',)
    search_fields = ('name',)
    
    def get_role_display_name(self, obj):
        """Возвращает отображаемое имя роли из ROLE_PERMISSIONS"""
        role = get_role_from_group(obj.name)
        if role and role in ROLE_PERMISSIONS:
            return ROLE_PERMISSIONS[role]['name']
        return "Не системная роль"
    get_role_display_name.short_description = 'Название роли'
    get_role_display_name.admin_order_field = 'name'
    
    def get_role_description(self, obj):
        """Возвращает описание роли из ROLE_PERMISSIONS"""
        role = get_role_from_group(obj.name)
        if role and role in ROLE_PERMISSIONS:
            return ROLE_PERMISSIONS[role]['description']
        return "Группа без системной роли"
    get_role_description.short_description = 'Описание роли'
    
    def get_available_models(self, obj):
        """Возвращает список доступных моделей для роли"""
        role = get_role_from_group(obj.name)
        if role and role in ROLE_PERMISSIONS:
            models = list(ROLE_PERMISSIONS[role]['models'].keys())
            return ", ".join(models[:3]) + ("..." if len(models) > 3 else "")
        return "-"
    get_available_models.short_description = 'Доступные модели'
    
    def user_count(self, obj):
        # Используем правильное имя связи - custom_user_set
        return obj.custom_user_set.count()
    user_count.short_description = 'Кол-во пользователей'
    
    def get_queryset(self, request):
        """Оптимизируем запрос для подсчета пользователей"""
        # Используем правильное имя связи - custom_user_set
        return super().get_queryset(request).prefetch_related('custom_user_set')


class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'user_account', 'division', 'subdivision', 'rank', 'position', 'category', 'priority', 'photo_preview')
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


# Перерегистрируем модели с кастомными админами
admin.site.unregister(Group)
admin.site.register(Group, CustomGroupAdmin)

admin.site.register(User, CustomUserAdmin)
admin.site.register(Employee, EmployeeAdmin)
admin.site.register(ShaWorkerDetails, ShaWorkerDetailsAdmin)
admin.site.register(ShaEquipmentConclusion, ShaEquipmentConclusionAdmin)

# Кастомизация заголовков админки
admin.site.site_header = '🗂️ Система управления персоналом'
admin.site.site_title = 'Система управления персоналом'
admin.site.index_title = '📊 Панель администрирования'

# Убираем проблемный CustomAdminSite, так как он может вызывать конфликты
# Вместо этого используем стандартные настройки