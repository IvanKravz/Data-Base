from django.contrib import admin
# from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from .models import Employee, ShaWorkerDetails, ShaEquipmentConclusion, User

class CustomUserAdmin(UserAdmin):
    actions = ['create_user_for_employee']
    
    def create_user_for_employee(self, request, queryset):
        for user in queryset:
            if not hasattr(user, 'employee'):
                # Создаем сотрудника и привязываем к пользователю
                employee = Employee.objects.create(
                    full_name=user.username,
                    user_account=user
                )
                user.employee = employee
                user.save()

class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user_account', 'id', 'rank', 'position', 'category', 'subcategory', 'priority')
    list_filter = ('category', 'subcategory')
    search_fields = ('full_name', 'position')
    ordering = ('priority', 'full_name')

class ShaWorkerDetailsAdmin(admin.ModelAdmin):
    list_display = ('employee', 'access_level', 'start_date')
    raw_id_fields = ('employee',)

class ShaEquipmentConclusionAdmin(admin.ModelAdmin):
    list_display = ('sha_worker', 'equipment_type', 'conclusion_number')
    raw_id_fields = ('sha_worker',)

admin.site.register(Employee, EmployeeAdmin)
admin.site.register(ShaWorkerDetails, ShaWorkerDetailsAdmin)
admin.site.register(ShaEquipmentConclusion, ShaEquipmentConclusionAdmin)
# admin.site.unregister(User)  
admin.site.register(User, CustomUserAdmin)  # Регистрируем с кастомным админом