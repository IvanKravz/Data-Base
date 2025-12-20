from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.http import FileResponse, Http404
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Sum, Count
from .models import StorageFolder, StorageFile, FileShareLink, Favorite
from .serializers import (
    StorageFolderSerializer, StorageFileSerializer, 
    FileShareLinkSerializer, FavoriteSerializer,
    FileUploadSerializer
)
from .filters import StorageFileFilter, StorageFolderFilter
from storage.permissions import HasFolderAccess, HasFileAccess, CanShareFiles, CanEmptyTrash
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class StorageFolderViewSet(viewsets.ModelViewSet):
    queryset = StorageFolder.objects.all()
    serializer_class = StorageFolderSerializer
    permission_classes = [IsAuthenticated, HasFolderAccess]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = StorageFolderFilter
    search_fields = ['name']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # ВАЖНО: Для запроса конкретной папки (retrieve) и кастомных детальных действий 
        # (path, contents, check_access) не применяем фильтры
        # Это позволяет получить любую папку по ID, если у пользователя есть права
        if self.action in ['retrieve', 'path', 'contents', 'check_access', 'pin', 'move', 
                        'rename', 'soft_delete', 'restore']:
            return queryset.all()  # Возвращаем ВСЕ объекты для проверки доступа
        
        # Для списковых запросов применяем фильтрацию
        # Фильтрация по типу (личное/рабочее)
        folder_type = self.request.query_params.get('type')
        if folder_type == 'personal':
            # ТОЛЬКО личные папки текущего пользователя
            queryset = queryset.filter(folder_type='personal', created_by=user)
        elif folder_type == 'work':
            queryset = queryset.filter(folder_type='work')
        else:
            # По умолчанию показываем доступные папки
            queryset = queryset.filter(
                Q(folder_type='work') | 
                Q(folder_type='personal', created_by=user)
            )
        
        # Фильтрация по подразделению (только для рабочих папок)
        if folder_type == 'work' or folder_type is None:
            division_id = self.request.query_params.get('division_id')
            if division_id:
                queryset = queryset.filter(division_id=division_id)
            
            subdivision_id = self.request.query_params.get('subdivision_id')
            if subdivision_id:
                queryset = queryset.filter(subdivision_id=subdivision_id)
        
        # Фильтрация по родительской папке
        parent_id = self.request.query_params.get('parent_id')
        if parent_id == 'root' or parent_id is None:
            queryset = queryset.filter(parent=None)
        elif parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        
        # Исключаем удаленные папки (кроме запросов к корзине)
        if not self.request.query_params.get('trash'):
            queryset = queryset.filter(is_deleted=False)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        """
        Получение конкретной папки по ID.
        Отдельно обрабатываем, чтобы не применять фильтры из get_queryset
        """
        try:
            instance = self.get_object()
            
            # ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА ДЛЯ ЛИЧНЫХ ПАПОК
            if instance.folder_type == 'personal' and instance.created_by != request.user:
                raise Http404("Папка не найдена")
                
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Http404:
            return Response(
                {'error': 'Папка не найдена или у вас нет к ней доступа'},
                status=status.HTTP_404_NOT_FOUND
            )

    def get_object(self):
        """
        Переопределяем get_object для лучшего контроля.
        Для детальных действий используем полный queryset.
        """
        # Получаем queryset в зависимости от действия
        if self.action in ['retrieve', 'path', 'contents', 'check_access', 'pin', 'move', 
                        'rename', 'soft_delete', 'restore']:
            # Для детальных действий используем все объекты
            queryset = StorageFolder.objects.all()
        else:
            queryset = self.filter_queryset(self.get_queryset())
        
        # Выполняем фильтрацию по lookup_field
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        
        # ВАЖНО: Некоторые действия могут не иметь lookup_url_kwarg
        if lookup_url_kwarg not in self.kwargs:
            # Если это кастомное действие без прямого lookup, возвращаем объект из queryset
            return queryset.get(pk=self.kwargs.get('pk'))
        
        lookup_value = self.kwargs[lookup_url_kwarg]
        
        # Фильтруем по lookup полю
        filter_kwargs = {self.lookup_field: lookup_value}
        obj = get_object_or_404(queryset, **filter_kwargs)
        
        # Проверяем права доступа
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=True, methods=['get'])
    def check_access(self, request, pk=None):
        """Проверить доступ к папке"""
        from django.http import Http404
        
        try:
            folder = StorageFolder.objects.get(id=pk)
        except StorageFolder.DoesNotExist:
            raise Http404("Папка не найдена")
        
        # Проверяем permissions
        permission = HasFolderAccess()
        has_access = permission.has_object_permission(request, self, folder)
        
        return Response({
            'has_access': has_access,
            'folder': {
                'id': folder.id,
                'name': folder.name,
                'folder_type': folder.folder_type,
                'division_id': folder.division_id if folder.division else None,
                'created_by_id': folder.created_by_id if folder.created_by else None,
            },
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'division_id': request.user.division.id if hasattr(request.user, 'division') and request.user.division else None,
            }
        })
    
    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        """Закрепить/открепить папку"""
        folder = self.get_object()
        folder.is_pinned = not folder.is_pinned
        folder.save()
        return Response({
            'id': folder.id,
            'is_pinned': folder.is_pinned
        })
    
    @action(detail=True, methods=['get'])
    def contents(self, request, pk=None):
        """Получить содержимое папки с пагинацией"""
        folder = self.get_object()
        
        # Получаем параметры пагинации
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 50))
        
        # Получаем подпапки и файлы
        subfolders = folder.subfolders.filter(is_deleted=False)
        files = folder.files.filter(is_deleted=False)
        
        # Применяем пагинацию
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        paginated_subfolders = subfolders[start_idx:end_idx]
        paginated_files = files[start_idx:end_idx]
        
        return Response({
            'folder': StorageFolderSerializer(folder, context={'request': request}).data,
            'subfolders': StorageFolderSerializer(paginated_subfolders, many=True, context={'request': request}).data,
            'files': StorageFileSerializer(paginated_files, many=True, context={'request': request}).data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_subfolders': subfolders.count(),
                'total_files': files.count(),
                'has_next': (subfolders.count() + files.count()) > end_idx
            }
        })
    
    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        """Переместить папку в другую папку"""
        folder = self.get_object()
        target_folder_id = request.data.get('target_folder_id')
        
        if target_folder_id == 'root':
            folder.parent = None
        elif target_folder_id:
            try:
                target_folder = StorageFolder.objects.get(id=target_folder_id)
                # Проверка на циклическую ссылку
                if folder.is_descendant_of(target_folder):
                    return Response(
                        {'error': 'Невозможно переместить папку в её же подпапку'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                folder.parent = target_folder
            except StorageFolder.DoesNotExist:
                return Response(
                    {'error': 'Целевая папка не найдена'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        folder.save()
        return Response(StorageFolderSerializer(folder, context={'request': request}).data)
    
    @action(detail=True, methods=['post'])
    def rename(self, request, pk=None):
        """Переименовать папку"""
        folder = self.get_object()
        new_name = request.data.get('name')
        
        if not new_name:
            return Response(
                {'error': 'Имя папки не может быть пустым'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        folder.name = new_name
        folder.save()
        return Response(StorageFolderSerializer(folder, context={'request': request}).data)
    
    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        """Мягкое удаление папки"""
        folder = self.get_object()
        folder.soft_delete(user=request.user)
        return Response({
            'id': folder.id,
            'status': 'deleted',
            'deleted_at': folder.deleted_at
        })
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Восстановить папку из корзины"""
        folder = self.get_object()
        folder.restore()
        return Response({
            'id': folder.id,
            'status': 'restored'
        })
    
    @action(detail=False, methods=['get'])
    def trash(self, request):
        """Получить корзину (удаленные папки) с пагинацией"""
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
    
        deleted_folders = StorageFolder.objects.deleted().filter(
            Q(folder_type='work') | 
            Q(folder_type='personal', created_by=request.user)  # ТОЛЬКО свои личные
        )
        
        # Применяем пагинацию
        start_idx = (page - 1) * page_size
        paginated_folders = deleted_folders[start_idx:start_idx + page_size]
        
        serializer = self.get_serializer(paginated_folders, many=True)
        return Response({
            'folders': serializer.data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total': deleted_folders.count(),
                'has_next': deleted_folders.count() > start_idx + page_size
            }
        })
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, CanEmptyTrash])
    def empty_trash(self, request):
        """Очистить корзину (только для администраторов и руководителей)"""
        deleted_folders = StorageFolder.objects.deleted().filter(created_by=request.user)
        count = deleted_folders.count()
        
        for folder in deleted_folders:
            folder.hard_delete()
        
        return Response({
            'status': 'trash_emptied',
            'deleted_count': count
        })
    
    @action(detail=False, methods=['get'])
    def pinned(self, request):
        """Получить закрепленные папки"""
        pinned_folders = StorageFolder.objects.filter(
            is_pinned=True,
            is_deleted=False
        ).filter(
            Q(folder_type='work') | 
            Q(folder_type='personal', created_by=request.user)
        )
        
        serializer = self.get_serializer(pinned_folders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def path(self, request, pk=None):
        """Получить полный путь к папке"""
        try:
            # Получаем папку с проверкой прав доступа
            folder = self.get_object()
            
            # Получаем всех предков папки (от корня к текущей папке)
            ancestors = []
            current = folder
            
            while current:
                ancestors.insert(0, current)  # Вставляем в начало
                current = current.parent
            
            # Сериализуем всех предков
            serializer = self.get_serializer(ancestors, many=True)
            
            return Response({
                'current_folder': self.get_serializer(folder).data,
                'breadcrumbs': serializer.data,
                'path': serializer.data  # Для совместимости, если где-то используется path
            })
        except Http404:
            return Response(
                {'error': 'Папка не найдена или у вас нет к ней доступа'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Ошибка при получении пути: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StorageFileViewSet(viewsets.ModelViewSet):
    queryset = StorageFile.objects.all()
    serializer_class = StorageFileSerializer
    permission_classes = [IsAuthenticated, HasFileAccess]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = StorageFileFilter
    search_fields = ['name', 'original_name', 'mime_type']
    ordering_fields = ['name', 'size', 'created_at', 'updated_at', 'download_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # Фильтрация по типу
        file_type = self.request.query_params.get('type')
        if file_type == 'personal':
            # ТОЛЬКО личные файлы текущего пользователя
            queryset = queryset.filter(file_type='personal', uploaded_by=user)
        elif file_type == 'work':
            queryset = queryset.filter(file_type='work')
        else:
            # По умолчанию показываем доступные файлы
            queryset = queryset.filter(
                Q(file_type='work') | 
                Q(file_type='personal', uploaded_by=user)
            )
        
        # Фильтрация по подразделению (только для рабочих файлов)
        if file_type == 'work' or file_type is None:
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
        
        # Исключаем удаленные файлы (кроме запросов к корзине)
        if not self.request.query_params.get('trash'):
            queryset = queryset.filter(is_deleted=False)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Скачать файл и увеличить счетчик"""
        file = self.get_object()
        
        try:
            file.increment_download_count()
            response = FileResponse(
                file.file.open('rb'),
                as_attachment=True,
                filename=file.original_name or file.name
            )
            response['Content-Type'] = file.mime_type or 'application/octet-stream'
            response['Content-Length'] = file.size
            return response
        except FileNotFoundError:
            raise Http404("Файл не найден на сервере")
    
    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        """Закрепить/открепить файл"""
        file = self.get_object()
        file.is_pinned = not file.is_pinned
        file.save()
        return Response({
            'id': file.id,
            'is_pinned': file.is_pinned
        })
    
    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        """Переместить файл в другую папку"""
        file = self.get_object()
        target_folder_id = request.data.get('target_folder_id')
        
        if target_folder_id == 'root':
            file.folder = None
        elif target_folder_id:
            try:
                target_folder = StorageFolder.objects.get(id=target_folder_id)
                file.folder = target_folder
            except StorageFolder.DoesNotExist:
                return Response(
                    {'error': 'Целевая папка не найдена'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        file.save()
        return Response(StorageFileSerializer(file, context={'request': request}).data)
    
    @action(detail=True, methods=['post'])
    def rename(self, request, pk=None):
        """Переименовать файл"""
        file = self.get_object()
        new_name = request.data.get('name')
        
        if not new_name:
            return Response(
                {'error': 'Имя файла не может быть пустым'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file.name = new_name
        file.save()
        return Response(StorageFileSerializer(file, context={'request': request}).data)
    
    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        """Мягкое удаление файла"""
        file = self.get_object()
        file.soft_delete(user=request.user)
        return Response({
            'id': file.id,
            'status': 'deleted',
            'deleted_at': file.deleted_at
        })
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Восстановить файл из корзины"""
        file = self.get_object()
        file.restore()
        return Response({
            'id': file.id,
            'status': 'restored'
        })
    
    @action(detail=True, methods=['post'])
    def hard_delete(self, request, pk=None):
        """Полное удаление файла (только для администраторов)"""
        file = self.get_object()
        file_id = file.id
        file_name = file.name
        file.hard_delete()
        return Response({
            'status': 'permanently_deleted',
            'id': file_id,
            'name': file_name
        })
    
    @action(detail=False, methods=['post'])
    def upload_multiple(self, request):
        """Множественная загрузка файлов"""
        serializer = FileUploadSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            created_files = serializer.save()  # Возвращает список файлов
            
            # Сериализуем созданные файлы
            file_serializer = StorageFileSerializer(
                created_files,  # Передаем список файлов
                many=True, 
                context={'request': request}
            )
            
            return Response(
                file_serializer.data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def trash(self, request):
        """Получить корзину (удаленные файлы) с пагинацией"""
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        deleted_files = StorageFile.objects.deleted().filter(
            Q(file_type='work') | 
            Q(file_type='personal', uploaded_by=request.user)  # ТОЛЬКО свои личные
        )
        
        # Применяем пагинацию
        start_idx = (page - 1) * page_size
        paginated_files = deleted_files[start_idx:start_idx + page_size]
        
        serializer = self.get_serializer(paginated_files, many=True)
        return Response({
            'files': serializer.data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total': deleted_files.count(),
                'has_next': deleted_files.count() > start_idx + page_size
            }
        })
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Недавно загруженные файлы с пагинацией"""
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        recent_files = StorageFile.objects.filter(
            uploaded_by=request.user,
            is_deleted=False
        ).order_by('-created_at')
        
        # Применяем пагинацию
        start_idx = (page - 1) * page_size
        paginated_files = recent_files[start_idx:start_idx + page_size]
        
        serializer = self.get_serializer(paginated_files, many=True)
        return Response({
            'files': serializer.data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total': recent_files.count(),
                'has_next': recent_files.count() > start_idx + page_size
            }
        })
    
    @action(detail=False, methods=['get'])
    def pinned(self, request):
        """Получить закрепленные файлы"""
        pinned_files = StorageFile.objects.filter(
            is_pinned=True,
            is_deleted=False
        ).filter(
            Q(file_type='work') | 
            Q(file_type='personal', uploaded_by=request.user)
        )
        
        serializer = self.get_serializer(pinned_files, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Статистика по файлам"""
        user_files = StorageFile.objects.filter(uploaded_by=request.user, is_deleted=False)
        work_files = StorageFile.objects.filter(file_type='work', is_deleted=False)
        
        # Общая статистика
        total_files = user_files.count()
        total_size = user_files.aggregate(Sum('size'))['size__sum'] or 0
        
        # По типам
        by_type = user_files.values('file_type').annotate(
            count=Count('id'),
            total_size=Sum('size')
        )
        
        # По расширениям
        by_extension = user_files.values('extension').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # По датам
        today = timezone.now().date()
        last_week = today - timezone.timedelta(days=7)
        
        recent_uploads = user_files.filter(
            created_at__date__gte=last_week
        ).count()
        
        return Response({
            'personal': {
                'total_files': total_files,
                'total_size': total_size,
                'recent_uploads': recent_uploads,
            },
            'work': {
                'total_files': work_files.count(),
                'total_size': work_files.aggregate(Sum('size'))['size__sum'] or 0,
            },
            'by_type': list(by_type),
            'top_extensions': list(by_extension),
        })
    
    @action(detail=False, methods=['get'])
    def storage_info(self, request):
        """Получить информацию о хранилище пользователя"""
        from django.conf import settings
        
        user = request.user
        
        # Файлы текущего пользователя
        user_files = StorageFile.objects.filter(uploaded_by=user, is_deleted=False)
        
        # Папки текущего пользователя
        user_folders = StorageFolder.objects.filter(
            Q(folder_type='personal', created_by=user) |
            Q(folder_type='work')
        ).filter(is_deleted=False)
        
        # Общее использованное место пользователем
        total_used = user_files.aggregate(total=Sum('size'))['total'] or 0
        
        # По типам
        personal_used = user_files.filter(file_type='personal').aggregate(total=Sum('size'))['total'] or 0
        work_used = user_files.filter(file_type='work').aggregate(total=Sum('size'))['total'] or 0
        
        # Получаем квоту пользователя из настроек или модели
        storage_quota = None
        
        # Вариант 1: Из модели User
        if hasattr(user, 'storage_quota') and user.storage_quota:
            storage_quota = user.storage_quota
        
        # Вариант 2: Из настроек Django
        elif hasattr(settings, 'DEFAULT_STORAGE_QUOTA'):
            storage_quota = settings.DEFAULT_STORAGE_QUOTA
        
        # Вариант 3: Из профиля пользователя (если есть модель Profile)
        elif hasattr(user, 'profile') and hasattr(user.profile, 'storage_quota'):
            storage_quota = user.profile.storage_quota
        
        # Рассчитываем проценты
        usage_percentage = 0
        if storage_quota and total_used > 0:
            usage_percentage = min((total_used / storage_quota) * 100, 100)
        
        # Максимальный размер файла
        max_file_size = getattr(settings, 'MAX_UPLOAD_SIZE', 100 * 1024 * 1024)  # 100MB по умолчанию
        
        # Статистика по типам файлов
        by_type_stats = user_files.values('mime_type').annotate(
            count=Count('id'),
            total_size=Sum('size')
        ).order_by('-total_size')[:5]
        
        by_type = {}
        for stat in by_type_stats:
            mime_type = stat['mime_type']
            if mime_type:
                main_type = mime_type.split('/')[0] if '/' in mime_type else mime_type
                if main_type not in by_type:
                    by_type[main_type] = {
                        'size': 0,
                        'count': 0,
                        'files': []
                    }
                by_type[main_type]['size'] += stat['total_size'] or 0
                by_type[main_type]['count'] += stat['count']
        
        return Response({
            'total_used': total_used,
            'storage_quota': storage_quota,
            'max_file_size': max_file_size,
            'usage_percentage': usage_percentage,
            'remaining': storage_quota - total_used if storage_quota else None,
            'by_type': by_type,
            'breakdown': {
                'personal': {
                    'size': personal_used,
                    'files_count': user_files.filter(file_type='personal').count(),
                    'folders_count': user_folders.filter(folder_type='personal').count(),
                },
                'work': {
                    'size': work_used,
                    'files_count': user_files.filter(file_type='work').count(),
                    'folders_count': user_folders.filter(folder_type='work').count(),
                }
            },
            'summary': {
                'total_files': user_files.count(),
                'total_folders': user_folders.count(),
                'deleted_files': StorageFile.objects.filter(uploaded_by=user, is_deleted=True).count(),
                'deleted_folders': StorageFolder.objects.filter(created_by=user, is_deleted=True).count(),
            }
        })


class FileShareLinkViewSet(viewsets.ModelViewSet):
    queryset = FileShareLink.objects.all()
    serializer_class = FileShareLinkSerializer
    permission_classes = [IsAuthenticated, CanShareFiles]  # Только для тех, кто может делиться файлами
    
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
        return Response({
            'id': link.id,
            'is_active': link.is_active
        })
    
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
        
        # Увеличиваем счетчики
        link.download_count += 1
        link.save()
        link.file.increment_download_count()
        
        # Возвращаем файл
        try:
            response = FileResponse(
                link.file.file.open('rb'),
                as_attachment=True,
                filename=link.file.original_name or link.file.name
            )
            response['Content-Type'] = link.file.mime_type or 'application/octet-stream'
            response['Content-Length'] = link.file.size
            return response
        except FileNotFoundError:
            return Response(
                {'error': 'Файл не найден на сервере'},
                status=status.HTTP_404_NOT_FOUND
            )


class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def all(self, request):
        """Получить все избранные элементы"""
        favorites = self.get_queryset()
        
        # Разделяем на папки и файлы
        folder_favorites = favorites.filter(folder__isnull=False)
        file_favorites = favorites.filter(file__isnull=False)
        
        folder_ids = [fav.folder.id for fav in folder_favorites]
        file_ids = [fav.file.id for fav in file_favorites]
        
        # Получаем актуальные объекты
        folders = StorageFolder.objects.filter(
            id__in=folder_ids,
            is_deleted=False
        )
        files = StorageFile.objects.filter(
            id__in=file_ids,
            is_deleted=False
        )
        
        return Response({
            'folders': StorageFolderSerializer(folders, many=True, context={'request': request}).data,
            'files': StorageFileSerializer(files, many=True, context={'request': request}).data,
        })
    
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
                return Response({
                    'status': 'removed',
                    'is_favorited': False,
                    'type': 'folder',
                    'id': folder_id
                })
            return Response({
                'status': 'added',
                'is_favorited': True,
                'type': 'folder',
                'id': folder_id
            })
        
        elif file_id:
            obj = get_object_or_404(StorageFile, id=file_id)
            favorite, created = Favorite.objects.get_or_create(
                user=request.user,
                file=obj,
                defaults={'folder': None}
            )
            if not created:
                favorite.delete()
                return Response({
                    'status': 'removed',
                    'is_favorited': False,
                    'type': 'file',
                    'id': file_id
                })
            return Response({
                'status': 'added',
                'is_favorited': True,
                'type': 'file',
                'id': file_id
            })
        
        return Response(
            {'error': 'Укажите folder_id или file_id'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_storage_info(request):
    """Простая функция для получения информации о хранилище"""
    from django.conf import settings
    from django.db.models import Sum, Q
    from .models import StorageFile, StorageFolder
    
    user = request.user
    
    # Файлы текущего пользователя
    user_files = StorageFile.objects.filter(uploaded_by=user, is_deleted=False)
    
    # Папки текущего пользователя
    user_folders = StorageFolder.objects.filter(
        Q(folder_type='personal', created_by=user) |
        Q(folder_type='work')
    ).filter(is_deleted=False)
    
    # Общее использованное место пользователем
    total_used = user_files.aggregate(total=Sum('size'))['total'] or 0
    
    # Получаем квоту пользователя
    storage_quota = None
    if hasattr(user, 'storage_quota') and user.storage_quota:
        storage_quota = user.storage_quota
    elif hasattr(settings, 'DEFAULT_STORAGE_QUOTA'):
        storage_quota = settings.DEFAULT_STORAGE_QUOTA
    elif hasattr(user, 'profile') and hasattr(user.profile, 'storage_quota'):
        storage_quota = user.profile.storage_quota
    
    # Рассчитываем проценты
    usage_percentage = 0
    if storage_quota and total_used > 0:
        usage_percentage = min((total_used / storage_quota) * 100, 100)
    
    return Response({
        'total_used': total_used,
        'storage_quota': storage_quota,
        'usage_percentage': usage_percentage,
        'remaining': storage_quota - total_used if storage_quota else None,
        'files_count': user_files.count(),
        'folders_count': user_folders.count(),
        'personal_files': user_files.filter(file_type='personal').count(),
        'work_files': user_files.filter(file_type='work').count(),
    })