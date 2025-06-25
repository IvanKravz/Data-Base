from django.contrib import admin
from .models import Task, TaskStep

class TaskStepInline(admin.TabularInline):
    model = TaskStep
    extra = 1

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'division', 'created_by', 'progress', 'created_at')
    list_filter = ('category', 'division', 'created_at')
    search_fields = ('title',)
    raw_id_fields = ('created_by',)  # Это добавит поисковое поле вместо выпадающего списка
    inlines = [TaskStepInline]
    
    def progress(self, obj):
        return f'{obj.progress}%'
    progress.short_description = 'Прогресс'