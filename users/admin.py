from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Employee, ShaWorkerDetails, ShaEquipmentConclusion

# class CustomUserAdmin(UserAdmin):
#     list_display = ('username', 'email', 'is_staff', 'date_joined')
#     fieldsets = (
#         (None, {'fields': ('username', 'password')}),
#         ('Personal info', {'fields': ('email',)}),
#         ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
#         ('Important dates', {'fields': ('last_login', 'date_joined')}),
#     )

class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'id', 'rank', 'position', 'department', 'category', 'subcategory', 'priority')
    list_filter = ('category', 'subcategory', 'department')
    search_fields = ('full_name', 'position')
    ordering = ('priority', 'full_name')

class ShaWorkerDetailsAdmin(admin.ModelAdmin):
    list_display = ('employee', 'access_level', 'start_date')
    raw_id_fields = ('employee',)

class ShaEquipmentConclusionAdmin(admin.ModelAdmin):
    list_display = ('sha_worker', 'equipment_type', 'conclusion_number')
    raw_id_fields = ('sha_worker',)

# admin.site.register(User, CustomUserAdmin)
admin.site.register(Employee, EmployeeAdmin)
admin.site.register(ShaWorkerDetails, ShaWorkerDetailsAdmin)
admin.site.register(ShaEquipmentConclusion, ShaEquipmentConclusionAdmin)