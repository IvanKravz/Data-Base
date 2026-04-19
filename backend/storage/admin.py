# admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.http import HttpResponseRedirect
from django.urls import reverse
from .models import StorageFolder, StorageFile, FileShareLink, Favorite


@admin.register(StorageFolder)
class StorageFolderAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'name', 'parent', 'folder_type', 'division', 'subdivision',
        'created_by', 'files_count', 'created_at', 'deleted_badge', 'deleted_at', 'deleted_by'
    )
    list_filter = (
        'folder_type', 'division', 'subdivision', 'created_by', 'created_at',
        'is_deleted', 'deleted_at'
    )
    search_fields = ('name',)
    raw_id_fields = ('parent', 'created_by', 'division', 'subdivision')
    list_editable = ('folder_type',)
    readonly_fields = ('is_deleted', 'deleted_at', 'deleted_by')
    actions = ['restore_selected', 'hard_delete_selected']

    def get_queryset(self, request):
        """Показываем в админке все папки (включая удалённые)"""
        return StorageFolder.objects.all_objects()

    def files_count(self, obj):
        return obj.files.filter(is_deleted=False).count()
    files_count.short_description = 'Файлов (активных)'

    def deleted_badge(self, obj):
        if obj.is_deleted:
            return format_html('<span style="color: red;">✓ Удалена</span>')
        return format_html('<span style="color: green;">✗ Активна</span>')
    deleted_badge.short_description = 'Состояние'

    def restore_selected(self, request, queryset):
        """Восстановить выбранные папки"""
        restored = 0
        for folder in queryset.filter(is_deleted=True):
            folder.restore()
            restored += 1
        self.message_user(request, f'Восстановлено папок: {restored}')
    restore_selected.short_description = 'Восстановить выбранные папки'

    def hard_delete_selected(self, request, queryset):
        """Полностью удалить выбранные папки (без возможности восстановления)"""
        deleted = 0
        for folder in queryset:
            folder.hard_delete()
            deleted += 1
        self.message_user(request, f'Навсегда удалено папок: {deleted}')
    hard_delete_selected.short_description = 'Навсегда удалить выбранные папки'


@admin.register(StorageFile)
class StorageFileAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'name', 'folder', 'file_type', 'division', 'subdivision',
        'size_display', 'mime_type', 'uploaded_by', 'created_at',
        'deleted_badge', 'deleted_at', 'deleted_by'
    )
    list_filter = (
        'file_type', 'division', 'subdivision', 'mime_type', 'uploaded_by',
        'created_at', 'is_deleted', 'deleted_at'
    )
    search_fields = ('id', 'name', 'original_name', 'mime_type')
    raw_id_fields = ('folder', 'uploaded_by', 'division', 'subdivision')
    list_editable = ('file_type',)
    readonly_fields = ('is_deleted', 'deleted_at', 'deleted_by')
    actions = ['restore_selected', 'hard_delete_selected']

    def get_queryset(self, request):
        """Показываем в админке все файлы (включая удалённые)"""
        return StorageFile.objects.all_objects()

    def size_display(self, obj):
        size = obj.size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"
    size_display.short_description = 'Размер'

    def deleted_badge(self, obj):
        if obj.is_deleted:
            return format_html('<span style="color: red;">✓ Удалён</span>')
        return format_html('<span style="color: green;">✗ Активен</span>')
    deleted_badge.short_description = 'Состояние'

    def restore_selected(self, request, queryset):
        restored = 0
        for file in queryset.filter(is_deleted=True):
            file.restore()
            restored += 1
        self.message_user(request, f'Восстановлено файлов: {restored}')
    restore_selected.short_description = 'Восстановить выбранные файлы'

    def hard_delete_selected(self, request, queryset):
        deleted = 0
        for file in queryset:
            file.hard_delete()
            deleted += 1
        self.message_user(request, f'Навсегда удалено файлов: {deleted}')
    hard_delete_selected.short_description = 'Навсегда удалить выбранные файлы'


@admin.register(FileShareLink)
class FileShareLinkAdmin(admin.ModelAdmin):
    list_display = ('token', 'file', 'created_by', 'expires_at', 'max_downloads',
                    'download_count', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_by', 'created_at')
    search_fields = ('token', 'file__name')
    raw_id_fields = ('file', 'created_by')
    readonly_fields = ('token', 'download_count', 'created_at')


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'folder', 'file', 'created_at')
    list_filter = ('user', 'created_at')
    search_fields = ('user__username', 'folder__name', 'file__name')
    raw_id_fields = ('user', 'folder', 'file')