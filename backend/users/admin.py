# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin, GroupAdmin
from django.contrib.auth.models import Group
from django.utils.html import format_html
from .permissions_config import ROLE_PERMISSIONS, get_role_from_group
from .models import User


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


# Перерегистрируем модели с кастомными админами
admin.site.unregister(Group)
admin.site.register(Group, CustomGroupAdmin)
admin.site.register(User, CustomUserAdmin)