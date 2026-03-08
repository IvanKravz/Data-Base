# admin.py
from django.contrib import admin
from .models import StorageFolder, StorageFile, FileShareLink, Favorite

@admin.register(StorageFolder)
class StorageFolderAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'parent', 'folder_type', 'division', 'subdivision', 'created_by', 'files_count', 'created_at', 'is_deleted')
    list_filter = ('folder_type', 'division', 'subdivision', 'created_by', 'created_at', 'is_deleted')
    search_fields = ('name',)
    raw_id_fields = ('parent', 'created_by', 'division', 'subdivision')
    list_editable = ('folder_type', 'is_deleted')
    
    def files_count(self, obj):
        return obj.files.count()
    files_count.short_description = 'Количество файлов'

@admin.register(StorageFile)
class StorageFileAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'folder', 'file_type', 'division', 'subdivision', 'size_display', 'mime_type', 'uploaded_by', 'created_at', 'is_deleted')
    list_filter = ('file_type', 'division', 'subdivision', 'mime_type', 'uploaded_by', 'created_at', 'is_deleted')
    search_fields = ('id', 'name', 'original_name', 'mime_type')
    raw_id_fields = ('folder', 'uploaded_by', 'division', 'subdivision')
    list_editable = ('file_type', 'is_deleted')
    
    def size_display(self, obj):
        """Convert size to human-readable format"""
        size = obj.size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"
    size_display.short_description = 'Размер'

@admin.register(FileShareLink)
class FileShareLinkAdmin(admin.ModelAdmin):
    list_display = ('token', 'file', 'created_by', 'expires_at', 'max_downloads', 'download_count', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_by', 'created_at')
    search_fields = ('token', 'file__name')
    raw_id_fields = ('file', 'created_by')

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'folder', 'file', 'created_at')
    list_filter = ('user', 'created_at')
    search_fields = ('user__username', 'folder__name', 'file__name')
    raw_id_fields = ('user', 'folder', 'file')