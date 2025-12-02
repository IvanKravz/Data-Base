# serializers.py
from rest_framework import serializers
from .models import StorageFolder, StorageFile, FileShareLink, Favorite
from users.serializers import UserSerializer, DivisionSerializer, SubdivisionSerializer

class StorageFolderSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    division = DivisionSerializer(read_only=True)
    subdivision = SubdivisionSerializer(read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    files_count = serializers.SerializerMethodField()
    subfolders_count = serializers.SerializerMethodField()
    total_size = serializers.SerializerMethodField()
    full_path = serializers.SerializerMethodField()
    
    class Meta:
        model = StorageFolder
        fields = [
            'id', 'name', 'parent', 'parent_name', 'folder_type',
            'division', 'subdivision', 'created_by', 'files_count',
            'subfolders_count', 'total_size', 'full_path', 'is_pinned',
            'color', 'created_at', 'updated_at', 'is_deleted'
        ]
        read_only_fields = ['is_deleted', 'deleted_at']
    
    def get_files_count(self, obj):
        return obj.files.filter(is_deleted=False).count()
    
    def get_subfolders_count(self, obj):
        return obj.subfolders.filter(is_deleted=False).count()
    
    def get_total_size(self, obj):
        return obj.get_total_size()
    
    def get_full_path(self, obj):
        return obj.get_full_path()

class StorageFileSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    division = DivisionSerializer(read_only=True)
    subdivision = SubdivisionSerializer(read_only=True)
    folder_name = serializers.CharField(source='folder.name', read_only=True)
    download_url = serializers.SerializerMethodField()
    human_readable_size = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()
    
    class Meta:
        model = StorageFile
        fields = [
            'id', 'name', 'original_name', 'file', 'size', 'human_readable_size',
            'mime_type', 'extension', 'file_type', 'folder', 'folder_name',
            'division', 'subdivision', 'uploaded_by', 'download_url', 'is_favorited',
            'is_pinned', 'download_count', 'last_downloaded', 'created_at',
            'updated_at', 'is_deleted'
        ]
        read_only_fields = ['is_deleted', 'deleted_at', 'download_count', 'last_downloaded']
    
    def get_download_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return None
    
    def get_human_readable_size(self, obj):
        return obj.get_human_readable_size()
    
    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(
                user=request.user,
                file=obj
            ).exists()
        return False

class FileShareLinkSerializer(serializers.ModelSerializer):
    file_info = StorageFileSerializer(source='file', read_only=True)
    expires_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M', required=False)
    
    class Meta:
        model = FileShareLink
        fields = [
            'id', 'token', 'file', 'file_info', 'password', 'expires_at',
            'max_downloads', 'download_count', 'created_by', 'created_at',
            'is_active'
        ]
        read_only_fields = ['token', 'download_count', 'created_by']

class FavoriteSerializer(serializers.ModelSerializer):
    folder = StorageFolderSerializer(read_only=True)
    file = StorageFileSerializer(read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'user', 'folder', 'file', 'created_at']
        read_only_fields = ['user', 'created_at']

class FileUploadSerializer(serializers.ModelSerializer):
    files = serializers.ListField(
        child=serializers.FileField(max_length=100),
        write_only=True
    )
    folder_id = serializers.IntegerField(required=False, allow_null=True)
    file_type = serializers.ChoiceField(
        choices=StorageFile.TYPE_CHOICES,
        default='work'
    )
    
    class Meta:
        model = StorageFile
        fields = ['files', 'folder_id', 'file_type']
    
    def create(self, validated_data):
        request = self.context.get('request')
        folder_id = validated_data.get('folder_id')
        files = validated_data.get('files', [])
        
        created_files = []
        for file in files:
            storage_file = StorageFile(
                name=file.name,
                original_name=file.name,
                file=file,
                size=file.size,
                mime_type=file.content_type,
                extension=file.name.split('.')[-1] if '.' in file.name else '',
                file_type=validated_data.get('file_type', 'work'),
                uploaded_by=request.user,
                folder_id=folder_id if folder_id else None
            )
            
            # Наследование division и subdivision от папки
            if folder_id:
                try:
                    folder = StorageFolder.objects.get(id=folder_id)
                    storage_file.division = folder.division
                    storage_file.subdivision = folder.subdivision
                except StorageFolder.DoesNotExist:
                    pass
            
            storage_file.save()
            created_files.append(storage_file)
        
        return created_files