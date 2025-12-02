# views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from .models import StorageFolder, StorageFile, FileShareLink, Favorite
from .serializers import (
    StorageFolderSerializer, StorageFileSerializer, 
    FileShareLinkSerializer, FavoriteSerializer,
    FileUploadSerializer
)
from .filters import StorageFileFilter, StorageFolderFilter

class StorageFolderViewSet(viewsets.ModelViewSet):
    queryset = StorageFolder.objects.all()
    serializer_class = StorageFolderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = StorageFolderFilter
    search_fields = ['name']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Фильтрация по типу (личное/рабочее)
        folder_type = self.request.query_params.get('type')
        if folder_type in ['personal', 'work']:
            queryset = queryset.filter(folder_type=folder_type)
        
        # Фильтрация по подразделению и отделению
        division_id = self.request.query_params.get('division_id')
        if division_id:
            queryset = queryset.filter(division_id=division_id)
        
        subdivision_id = self.request.query_params.get('subdivision_id')
        if subdivision_id:
            queryset = queryset.filter(subdivision_id=subdivision_id)
        
        # Показываем только папки пользователя для личных файлов
        if folder_type == 'personal':
            queryset = queryset.filter(created_by=self.request.user)
        
        # Фильтрация по родительской папке
        parent_id = self.request.query_params.get('parent_id')
        if parent_id == 'root' or parent_id is None:
            queryset = queryset.filter(parent=None)
        elif parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        """Закрепить/открепить папку"""
        folder = self.get_object()
        folder.is_pinned = not folder.is_pinned
        folder.save()
        return Response({'is_pinned': folder.is_pinned})
    
    @action(detail=True, methods=['get'])
    def contents(self, request, pk=None):
        """Получить содержимое папки"""
        folder = self.get_object()
        subfolders = folder.subfolders.filter(is_deleted=False)
        files = folder.files.filter(is_deleted=False)
        
        return Response({
            'folder': StorageFolderSerializer(folder, context={'request': request}).data,
            'subfolders': StorageFolderSerializer(subfolders, many=True, context={'request': request}).data,
            'files': StorageFileSerializer(files, many=True, context={'request': request}).data,
        })
    
    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        """Мягкое удаление папки"""
        folder = self.get_object()
        folder.soft_delete(user=request.user)
        return Response({'status': 'deleted'})
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Восстановить папку из корзины"""
        folder = self.get_object()
        folder.restore()
        return Response({'status': 'restored'})
    
    @action(detail=False, methods=['get'])
    def trash(self, request):
        """Получить корзину (удаленные папки)"""
        deleted_folders = StorageFolder.objects.deleted().filter(created_by=request.user)
        serializer = self.get_serializer(deleted_folders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def empty_trash(self, request):
        """Очистить корзину"""
        deleted_folders = StorageFolder.objects.deleted().filter(created_by=request.user)
        for folder in deleted_folders:
            folder.hard_delete()
        return Response({'status': 'trash_emptied'})

class StorageFileViewSet(viewsets.ModelViewSet):
    queryset = StorageFile.objects.all()
    serializer_class = StorageFileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = StorageFileFilter
    search_fields = ['name', 'original_name', 'mime_type']
    ordering_fields = ['name', 'size', 'created_at', 'updated_at', 'download_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Фильтрация по типу
        file_type = self.request.query_params.get('type')
        if file_type in ['personal', 'work']:
            queryset = queryset.filter(file_type=file_type)
        
        # Фильтрация по подразделению и отделению
        division_id = self.request.query_params.get('division_id')
        if division_id:
            queryset = queryset.filter(division_id=division_id)
        
        subdivision_id = self.request.query_params.get('subdivision_id')
        if subdivision_id:
            queryset = queryset.filter(subdivision_id=subdivision_id)
        
        # Фильтрация по папке
        folder_id = self.request.query_params.get('folder_id')
        if folder_id == 'root' or folder_id is None:
            queryset = queryset.filter(folder=None)
        elif folder_id:
            queryset = queryset.filter(folder_id=folder_id)
        
        # Показываем только файлы пользователя для личных файлов
        if file_type == 'personal':
            queryset = queryset.filter(uploaded_by=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def download(self, request, pk=None):
        """Скачать файл и увеличить счетчик"""
        file = self.get_object()
        file.increment_download_count()
        
        # Возвращаем URL для скачивания
        from django.http import FileResponse
        response = FileResponse(file.file.open(), as_attachment=True, filename=file.original_name)
        return response
    
    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        """Закрепить/открепить файл"""
        file = self.get_object()
        file.is_pinned = not file.is_pinned
        file.save()
        return Response({'is_pinned': file.is_pinned})
    
    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        """Мягкое удаление файла"""
        file = self.get_object()
        file.soft_delete(user=request.user)
        return Response({'status': 'deleted'})
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Восстановить файл из корзины"""
        file = self.get_object()
        file.restore()
        return Response({'status': 'restored'})
    
    @action(detail=True, methods=['post'])
    def hard_delete(self, request, pk=None):
        """Полное удаление файла"""
        file = self.get_object()
        file.hard_delete()
        return Response({'status': 'permanently_deleted'})
    
    @action(detail=False, methods=['post'])
    def upload_multiple(self, request):
        """Множественная загрузка файлов"""
        serializer = FileUploadSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            files = serializer.save()
            return Response(
                StorageFileSerializer(files, many=True, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def trash(self, request):
        """Получить корзину (удаленные файлы)"""
        deleted_files = StorageFile.objects.deleted().filter(uploaded_by=request.user)
        serializer = self.get_serializer(deleted_files, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Недавно загруженные файлы"""
        recent_files = StorageFile.objects.filter(
            uploaded_by=request.user
        ).order_by('-created_at')[:20]
        serializer = self.get_serializer(recent_files, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Статистика по файлам"""
        from django.db.models import Sum, Count
        
        total_files = StorageFile.objects.filter(uploaded_by=request.user).count()
        total_size = StorageFile.objects.filter(
            uploaded_by=request.user
        ).aggregate(Sum('size'))['size__sum'] or 0
        
        by_type = StorageFile.objects.filter(
            uploaded_by=request.user
        ).values('file_type').annotate(count=Count('id'))
        
        by_extension = StorageFile.objects.filter(
            uploaded_by=request.user
        ).values('extension').annotate(count=Count('id')).order_by('-count')[:10]
        
        return Response({
            'total_files': total_files,
            'total_size': total_size,
            'by_type': list(by_type),
            'top_extensions': list(by_extension),
        })

class FileShareLinkViewSet(viewsets.ModelViewSet):
    queryset = FileShareLink.objects.all()
    serializer_class = FileShareLinkSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return FileShareLink.objects.filter(created_by=self.request.user)
    
    def perform_create(self, serializer):
        import secrets
        token = secrets.token_urlsafe(32)
        serializer.save(created_by=self.request.user, token=token)
    
    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Активировать/деактивировать ссылку"""
        link = self.get_object()
        link.is_active = not link.is_active
        link.save()
        return Response({'is_active': link.is_active})
    
    @action(detail=False, methods=['get'], permission_classes=[])
    def download_shared(self, request, token):
        """Скачать файл по публичной ссылке"""
        link = get_object_or_404(FileShareLink, token=token)
        
        if not link.can_be_downloaded():
            return Response(
                {'error': 'Ссылка недействительна или истекла'},
                status=status.HTTP_410_GONE
            )
        
        # Проверка пароля
        password = request.query_params.get('password')
        if link.password and link.password != password:
            return Response(
                {'error': 'Неверный пароль'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Увеличиваем счетчик
        link.download_count += 1
        link.save()
        
        # Увеличиваем счетчик файла
        link.file.increment_download_count()
        
        return Response({
            'file': StorageFileSerializer(link.file, context={'request': request}).data,
            'download_url': request.build_absolute_uri(link.file.file.url)
        })

class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """Добавить/удалить из избранного"""
        folder_id = request.data.get('folder_id')
        file_id = request.data.get('file_id')
        
        if folder_id:
            obj = get_object_or_404(StorageFolder, id=folder_id)
            favorite, created = Favorite.objects.get_or_create(
                user=request.user,
                folder=obj,
                defaults={'file': None}
            )
            if not created:
                favorite.delete()
                return Response({'status': 'removed', 'is_favorited': False})
            return Response({'status': 'added', 'is_favorited': True})
        
        elif file_id:
            obj = get_object_or_404(StorageFile, id=file_id)
            favorite, created = Favorite.objects.get_or_create(
                user=request.user,
                file=obj,
                defaults={'folder': None}
            )
            if not created:
                favorite.delete()
                return Response({'status': 'removed', 'is_favorited': False})
            return Response({'status': 'added', 'is_favorited': True})
        
        return Response(
            {'error': 'Укажите folder_id или file_id'},
            status=status.HTTP_400_BAD_REQUEST
        )