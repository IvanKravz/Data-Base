# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin, GroupAdmin
from django.contrib.auth.models import Group
from django import forms
from .permissions_config import ROLE_PERMISSIONS, get_role_from_group
from .models import User, RoleGroup


class UserAdminForm(forms.ModelForm):
    class Meta:
        model = User
        fields = '__all__'

    def clean_two_factor_code(self):
        code = self.cleaned_data.get('two_factor_code')
        if code and (not code.isdigit() or len(code) != 4):
            raise forms.ValidationError('Код двухфакторной аутентификации должен состоять ровно из 4 цифр.')
        return code


class CustomUserAdmin(UserAdmin):
    form = UserAdminForm
    list_display = (
        'username', 'email', 'get_roles', 'is_global_view',
        'division', 'subdivision', 'two_factor_enabled', 'is_staff', 'is_active'
    )
    list_filter = (
        'groups', 'is_staff', 'is_active', 'user_division', 'user_subdivision',
        'two_factor_enabled'
    )
    filter_horizontal = ('groups', 'user_permissions')

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('email', 'employee', 'user_division', 'user_subdivision')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_global_view', 'is_superuser', 'groups', 'user_permissions')}),
        ('Two-Factor Authentication', {
            'fields': ('two_factor_code', 'two_factor_enabled'),
            'description': 'Установите 4-значный код для двухфакторной аутентификации. Оставьте пустым, если 2FA не требуется.'
        }),
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

    # Переопределяем метод для поля groups, чтобы в виджете выбора отображались русские названия
    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == "groups":
            kwargs["queryset"] = RoleGroup.objects.all()
        return super().formfield_for_manytomany(db_field, request, **kwargs)


class CustomGroupAdmin(GroupAdmin):
    list_display = ('name', 'get_role_display_name', 'get_role_description', 'user_count', 'get_available_models')
    list_filter = ('name',)
    search_fields = ('name',)

    def get_role_display_name(self, obj):
        role = get_role_from_group(obj.name)
        if role and role in ROLE_PERMISSIONS:
            return ROLE_PERMISSIONS[role]['name']
        return "Не системная роль"
    get_role_display_name.short_description = 'Название роли'
    get_role_display_name.admin_order_field = 'name'

    def get_role_description(self, obj):
        role = get_role_from_group(obj.name)
        if role and role in ROLE_PERMISSIONS:
            return ROLE_PERMISSIONS[role]['description']
        return "Группа без системной роли"
    get_role_description.short_description = 'Описание роли'

    def get_available_models(self, obj):
        role = get_role_from_group(obj.name)
        if role and role in ROLE_PERMISSIONS:
            models = list(ROLE_PERMISSIONS[role]['models'].keys())
            return ", ".join(models[:3]) + ("..." if len(models) > 3 else "")
        return "-"
    get_available_models.short_description = 'Доступные модели'

    def user_count(self, obj):
        return obj.custom_user_set.count()
    user_count.short_description = 'Кол-во пользователей'

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('custom_user_set')


# Перерегистрация групп с использованием прокси-модели
admin.site.unregister(Group)
admin.site.register(RoleGroup, CustomGroupAdmin)

admin.site.register(User, CustomUserAdmin)