from rest_framework import serializers
from .models import StorageFolder, StorageFile
from users.serializers import UserSerializer

class StorageFolderSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    files_count = serializers.SerializerMethodField()
    subfolders_count = serializers.SerializerMethodField()

    class Meta:
        model = StorageFolder
        fields = [
            'id', 'name', 'parent', 'parent_name', 'created_by',
            'files_count', 'subfolders_count', 'created_at', 'updated_at'
        ]

    def get_files_count(self, obj):
        return obj.files.count()

    def get_subfolders_count(self, obj):
        return obj.subfolders.count()

class StorageFileSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    folder_name = serializers.CharField(source='folder.name', read_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = StorageFile
        fields = [
            'id', 'name', 'file', 'size', 'mime_type', 'folder',
            'folder_name', 'uploaded_by', 'download_url',
            'created_at', 'updated_at'
        ]

    def get_download_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return None