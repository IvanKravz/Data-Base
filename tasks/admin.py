from django.contrib import admin
from .models import Task, TaskStep
from django.contrib.auth import get_user_model
from django.db.models import Count, Q

User = get_user_model()

class TaskStepInline(admin.TabularInline):
    model = TaskStep
    extra = 1

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'division', 'subdivision', 'created_by', 'progress', 'is_completed', 'created_at')
    list_filter = ('category', 'division', 'subdivision', 'created_at')
    search_fields = ('title',)
    inlines = [TaskStepInline]
    
    def progress(self, obj):
        return f'{obj.progress}%'
    progress.short_description = 'Прогресс'
    
    def is_completed(self, obj):
        return obj.is_completed
    is_completed.boolean = True
    is_completed.short_description = 'Завершена'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(
            incomplete_steps=Count('steps', filter=Q(steps__is_completed=False)),
            total_steps=Count('steps')
        )
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'created_by':
            kwargs["queryset"] = User.objects.filter(is_active=True)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)