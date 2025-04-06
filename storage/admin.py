from django.contrib import admin
from .models import StorageFolder, StorageFile

@admin.register(StorageFolder)
class StorageFolderAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'created_by', 'files_count', 'created_at')
    list_filter = ('created_by', 'created_at')
    search_fields = ('name',)
    raw_id_fields = ('parent', 'created_by')
    
    def files_count(self, obj):
        return obj.files.count()
    files_count.short_description = 'Files'

@admin.register(StorageFile)
class StorageFileAdmin(admin.ModelAdmin):
    list_display = ('name', 'folder', 'size_display', 'mime_type', 'uploaded_by', 'created_at')
    list_filter = ('mime_type', 'uploaded_by', 'created_at')
    search_fields = ('name', 'mime_type')
    raw_id_fields = ('folder', 'uploaded_by')
    
    def size_display(self, obj):
        """Convert size to human-readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if obj.size < 1024:
                return f"{obj.size:.1f} {unit}"
            obj.size /= 1024
        return f"{obj.size:.1f} TB"
    size_display.short_description = 'Size'