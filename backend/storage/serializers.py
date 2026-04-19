from rest_framework import serializers
from .models import StorageFolder, StorageFile, FileShareLink, Favorite
from users.serializers import UserSerializer
from employees.serializers import DivisionSerializer, SubdivisionSerializer

class StorageFolderSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    division = DivisionSerializer(read_only=True)
    subdivision = SubdivisionSerializer(read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    files_count = serializers.SerializerMethodField()
    subfolders_count = serializers.SerializerMethodField()
    total_size = serializers.SerializerMethodField()
    full_path = serializers.SerializerMethodField()
    deleted_at = serializers.DateTimeField(read_only=True)
    deleted_by = UserSerializer(read_only=True)
    is_favorited = serializers.SerializerMethodField()
    
    class Meta:
        model = StorageFolder
        fields = [
            'id', 'name', 'parent', 'parent_name', 'folder_type',
            'division', 'subdivision', 'created_by', 'files_count',
            'subfolders_count', 'total_size', 'full_path', 'is_pinned',
            'color', 'created_at', 'updated_at', 'is_deleted', 'deleted_at', 'deleted_by',
            'is_favorited'  # добавить сюда
        ]
        read_only_fields = ['is_deleted', 'deleted_at']

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, folder=obj).exists()
        return False
    
    def get_files_count(self, obj):
        return obj.files.filter(is_deleted=False).count()
    
    def get_subfolders_count(self, obj):
        return obj.subfolders.filter(is_deleted=False).count()
    
    def get_total_size(self, obj):
        return obj.get_total_size()
    
    def get_full_path(self, obj):
        return obj.get_full_path()
    
    def to_representation(self, instance):
        """Убираем отладочную информацию из продакшена"""
        data = super().to_representation(instance)
        
        # УДАЛЯЕМ отладочную информацию или оставляем только для админов
        request = self.context.get('request')
        if request and request.user and request.user.is_superuser:
            # Только для админов оставляем отладочную информацию
            from storage.permissions import HasFolderAccess
            from storage.views import StorageFolderViewSet
            
            view = StorageFolderViewSet()
            view.request = request
            view.format_kwarg = None
            
            permission = HasFolderAccess()
            data['_debug'] = {
                'has_access': permission.has_object_permission(request, view, instance),
                'user_id': request.user.id,
            }
        else:
            # Для обычных пользователей удаляем
            if '_debug' in data:
                del data['_debug']
        
        return data

class StorageFileSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    division = DivisionSerializer(read_only=True)
    subdivision = SubdivisionSerializer(read_only=True)
    folder_name = serializers.CharField(source='folder.name', read_only=True)
    download_url = serializers.SerializerMethodField()
    download_endpoint = serializers.SerializerMethodField()  # НОВОЕ ПОЛЕ
    human_readable_size = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()
    deleted_at = serializers.DateTimeField(read_only=True)
    deleted_by = UserSerializer(read_only=True)
    
    class Meta:
        model = StorageFile
        fields = [
            'id', 'name', 'original_name', 'file', 'size', 'human_readable_size',
            'mime_type', 'extension', 'file_type', 'folder', 'folder_name',
            'division', 'subdivision', 'uploaded_by', 'download_url', 'download_endpoint',
            'is_favorited', 'is_pinned', 'download_count', 'last_downloaded', 
            'created_at', 'updated_at', 'is_deleted', 'deleted_at', 'deleted_by'
        ]
        read_only_fields = ['is_deleted', 'deleted_at', 'download_count', 'last_downloaded']
    
    def get_download_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return None
    
    def get_download_endpoint(self, obj):
        """Возвращает URL для скачивания через эндпоинт API"""
        request = self.context.get('request')
        if request:
            # URL для эндпоинта скачивания
            return request.build_absolute_uri(f'/api/storage/files/{obj.id}/download/')
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

class FileUploadSerializer(serializers.Serializer):  # Изменено с ModelSerializer на Serializer
    files = serializers.ListField(
        child=serializers.FileField(max_length=100),
        write_only=True,
        required=True
    )
    folder_id = serializers.IntegerField(required=False, allow_null=True)
    file_type = serializers.ChoiceField(
        choices=StorageFile.TYPE_CHOICES,
        default='work'
    )
    
    # Убрали Meta класс, так как это больше не ModelSerializer
    
    def validate(self, data):
        """Дополнительная валидация"""
        files = data.get('files', [])
        
        if not files:
            raise serializers.ValidationError({
                'files': 'Необходимо загрузить хотя бы один файл'
            })
        
        # Проверка размера файлов
        max_file_size = 1024 * 1024 * 100  # 100MB, можно вынести в настройки
        for file in files:
            if file.size > max_file_size:
                raise serializers.ValidationError({
                    'files': f'Файл {file.name} превышает максимальный размер {max_file_size / (1024*1024)}MB'
                })
        
        return data
    
    def create(self, validated_data):
        request = self.context.get('request')
        folder_id = validated_data.get('folder_id')
        files = validated_data.get('files', [])
        file_type = validated_data.get('file_type', 'work')

        created_files = []
        for file in files:
            file_name_parts = file.name.split('.')
            extension = file_name_parts[-1].lower() if len(file_name_parts) > 1 else ''

            storage_file = StorageFile(
                name=file.name,
                original_name=file.name,
                file=file,
                size=file.size,
                mime_type=file.content_type or 'application/octet-stream',
                extension=extension,
                file_type=file_type,
                uploaded_by=request.user,
                folder_id=folder_id if folder_id else None
            )

            # Наследование division и subdivision от папки (если есть)
            if folder_id:
                try:
                    folder = StorageFolder.objects.get(id=folder_id)
                    storage_file.division = folder.division
                    storage_file.subdivision = folder.subdivision
                except StorageFolder.DoesNotExist:
                    pass
            else:
                # Для файлов в корне рабочего типа – проставляем из пользователя
                if file_type == 'work':
                    user = request.user
                    # Используем employee, если есть
                    if user.employee and user.employee.division:
                        storage_file.division = user.employee.division
                    elif user.user_division:
                        storage_file.division = user.user_division

                    if user.employee and user.employee.subdivision:
                        storage_file.subdivision = user.employee.subdivision
                    elif user.user_subdivision:
                        storage_file.subdivision = user.user_subdivision

            storage_file.save()
            created_files.append(storage_file)

        return created_files
    
    def to_representation(self, instance):
        """Добавляем дополнительную информацию для диагностики"""
        data = super().to_representation(instance)
        
        # Добавляем информацию о доступе
        request = self.context.get('request')
        if request and request.user:
            from storage.permissions import HasFolderAccess
            from storage.views import StorageFolderViewSet
            
            view = StorageFolderViewSet()
            view.request = request
            view.format_kwarg = None
            
            permission = HasFolderAccess()
            
            # Добавляем детальную информацию о пользователе и объекте
            data['_debug'] = {
                'has_access': permission.has_object_permission(request, view, instance),
                'user_id': request.user.id,
                'user_username': request.user.username,
                'user_roles': permission._get_user_roles(request.user),
                'user_division': request.user.division.id if hasattr(request.user, 'division') and request.user.division else None,
                'object_id': instance.id,
                'object_folder_type': instance.folder_type,
                'object_division': instance.division.id if instance.division else None,
                'object_created_by': instance.created_by.id if instance.created_by else None,
                'is_owner': instance.created_by == request.user if instance.created_by else False,
            }
        
        return data
