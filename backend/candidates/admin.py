from django.contrib import admin
from .models import Candidate, CandidateStage


class CandidateStageInline(admin.TabularInline):
    model = CandidateStage
    extra = 0
    fields = ('order', 'stage_type', 'phase', 'planned_date', 'actual_date', 'status', 'comment')
    readonly_fields = ('order', 'stage_type', 'phase')
    ordering = ('order',)


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('number', 'full_name', 'planned_position', 'curator', 'division', 'status', 'created_at')
    list_filter = ('status', 'division')
    search_fields = ('full_name', 'planned_position', 'phone')
    inlines = [CandidateStageInline]
    readonly_fields = ('created_at', 'updated_at')