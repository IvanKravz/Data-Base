from django.contrib import admin
from .models import Task, TaskStep

class TaskStepInline(admin.TabularInline):
    model = TaskStep
    extra = 1
    raw_id_fields = ('completed_by',)

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'division', 'created_by', 'progress', 'created_at')
    list_filter = ('category', 'division', 'created_at')
    search_fields = ('title',)
    raw_id_fields = ('created_by',)
    inlines = [TaskStepInline]
    
    def progress(self, obj):
        total_steps = obj.steps.count()
        if not total_steps:
            return '0%'
        completed_steps = obj.steps.filter(is_completed=True).count()
        percentage = (completed_steps / total_steps) * 100
        return f'{percentage:.0f}%'
    progress.short_description = 'Progress'