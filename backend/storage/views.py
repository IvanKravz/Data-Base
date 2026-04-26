# storage/views.py (полностью обновлённая версия)
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
from users.logging import log_user_action

# Импорты функций логирования
from users.logging.storage import (
    log_storage_create, log_storage_update, log_storage_delete, log_storage_view,
    log_storage_download, log_storage_move, log_storage_rename, log_storage_soft_delete,
    log_storage_restore, log_storage_pin, log_storage_share, log_storage_bulk_create,
    log_storage_empty_trash
)


class StorageFolderViewSet(viewsets.ModelViewSet):
    queryset = StorageFolder.objects.all()
    serializer_class = StorageFolderSerializer
    permission_classes = [IsAuthenticated, HasFolderAccess]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = StorageFolderFilter
    search_fields = ['name']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def _get_changed_fields(self, old_data, new_data):
        changed = {}
        for key in old_data:
            if key in new_data and old_data[key] != new_data[key]:
                changed[key] = {
                    'old': old_data[key],
                    'new': new_data[key]
                }
        return changed

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        # Для детальных действий пропускаем фильтрацию
        if self.action in ['retrieve', 'path', 'contents', 'check_access', 'pin', 'move',
                           'rename', 'soft_delete', 'restore']:
            return queryset

        folder_type = self.request.query_params.get('type')  # 'personal' или 'work'

        # 1. Определяем, какие типы папок доступны пользователю
        allowed_types = []
        can_view_personal = False
        can_view_work = False

        # Администратор видит всё
        if user.has_role('admin'):
            allowed_types = ['personal', 'work']
            can_view_personal = can_view_work = True
        else:
            # Руководители и заместители – только личные
            if user.has_role('leader') or user.has_role('deputy_director'):
                allowed_types = ['personal']
                can_view_personal = True
            # Начальник отдела, начальник отделения, сотрудники отделений – только рабочие
            elif (user.has_role('head_of_department_1') or
                  user.has_role('head_of_section_1_1') or
                  any(user.has_role(role) for role in ['hr_section_1_1', 'tech_section_1_1',
                                                       'employee_section_1_2', 'tech_section_1_3'])):
                allowed_types = ['work']
                can_view_work = True
            # Роли эксплуатации – только рабочие
            elif user.has_role('exploitation_chief') or user.has_role('exploitation_employee'):
                allowed_types = ['work']
                can_view_work = True
            # (если роль не подходит – ничего не показываем)

        # Если тип не указан – пытаемся показать все доступные типы
        if not folder_type:
            if allowed_types:
                queryset = queryset.filter(folder_type__in=allowed_types)
            else:
                return queryset.none()
        else:
            if folder_type not in allowed_types:
                return queryset.none()
            queryset = queryset.filter(folder_type=folder_type)

        # 2. Фильтрация по принадлежности (личные – только владельцу)
        if can_view_personal and (folder_type == 'personal' or folder_type is None):
            queryset = queryset.filter(created_by=user)

        # 3. Фильтрация для рабочих папок по подразделению/отделению
        if can_view_work and (folder_type == 'work' or folder_type is None):
            if user.has_role('head_of_department_1'):
                division = user.division
                if division:
                    queryset = queryset.filter(division=division)
                else:
                    return queryset.none()
            elif user.has_role('head_of_section_1_1'):
                subdivision = user.subdivision
                if subdivision:
                    queryset = queryset.filter(subdivision=subdivision)
                else:
                    return queryset.none()
            elif any(user.has_role(role) for role in ['hr_section_1_1', 'tech_section_1_1',
                                                    'employee_section_1_2', 'tech_section_1_3']):
                subdivision = user.subdivision
                if subdivision:
                    queryset = queryset.filter(subdivision=subdivision)
                else:
                    return queryset.none()
            elif user.has_role('exploitation_chief') or user.has_role('exploitation_employee'):
                division = user.division
                if division:
                    queryset = queryset.filter(division=division)
                else:
                    return queryset.none()

        # 4. Дополнительные параметры (parent_id, division_id, subdivision_id, trash)
        parent_id = self.request.query_params.get('parent_id')
        if parent_id == 'root' or parent_id is None:
            queryset = queryset.filter(parent=None)
        elif parent_id:
            queryset = queryset.filter(parent_id=parent_id)

        division_id = self.request.query_params.get('division_id')
        if division_id:
            queryset = queryset.filter(division_id=division_id)

        subdivision_id = self.request.query_params.get('subdivision_id')
        if subdivision_id:
            queryset = queryset.filter(subdivision_id=subdivision_id)

        if not self.request.query_params.get('trash'):
            queryset = queryset.filter(is_deleted=False)

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        folder_type = serializer.validated_data.get('folder_type')
        extra_data = {'created_by': user}
        if folder_type == 'work':
            if user.division:
                extra_data['division'] = user.division
            if user.subdivision:
                extra_data['subdivision'] = user.subdivision
        serializer.save(**extra_data)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            instance = StorageFolder.objects.get(id=response.data['id'])
            log_storage_create(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data}
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            log_storage_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        folder_data = self.get_serializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_storage_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': folder_data}
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            if instance.folder_type == 'personal' and instance.created_by != request.user:
                raise Http404("Папка не найдена")
            serializer = self.get_serializer(instance)
            log_storage_view(
                user=request.user,
                instance=instance,
                request=request
            )
            return Response(serializer.data)
        except Http404:
            return Response(
                {'error': 'Папка не найдена или у вас нет к ней доступа'},
                status=status.HTTP_404_NOT_FOUND
            )

    def get_object(self):
        if self.action in ['retrieve', 'path', 'contents', 'check_access', 'pin', 'move',
                        'rename', 'soft_delete', 'restore', 'update', 'partial_update',
                        'hard_delete']:
            queryset = StorageFolder.objects.all_objects() 
        else:
            queryset = self.filter_queryset(self.get_queryset())

        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        if lookup_url_kwarg not in self.kwargs:
            return queryset.get(pk=self.kwargs.get('pk'))

        lookup_value = self.kwargs[lookup_url_kwarg]
        filter_kwargs = {self.lookup_field: lookup_value}
        obj = get_object_or_404(queryset, **filter_kwargs)
        self.check_object_permissions(self.request, obj)
        return obj
    
    @action(detail=True, methods=['delete'], url_path='hard-delete')
    def hard_delete(self, request, pk=None):
        folder = self.get_object()
        folder_id = folder.id
        folder_name = folder.name
        folder.hard_delete()
        return Response({'status': 'permanently_deleted', 'id': folder_id, 'name': folder_name})

    @action(detail=True, methods=['get'])
    def check_access(self, request, pk=None):
        try:
            folder = StorageFolder.objects.get(id=pk)
        except StorageFolder.DoesNotExist:
            raise Http404("Папка не найдена")
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
        folder = self.get_object()
        old_pinned = folder.is_pinned
        folder.is_pinned = not folder.is_pinned
        folder.save()
        log_storage_pin(
            user=request.user,
            instance=folder,
            pinned_status=folder.is_pinned,
            request=request
        )
        return Response({'id': folder.id, 'is_pinned': folder.is_pinned})

    @action(detail=True, methods=['get'])
    def contents(self, request, pk=None):
        folder = self.get_object()
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 50))
        subfolders = folder.subfolders.filter(is_deleted=False)
        files = folder.files.filter(is_deleted=False)
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
        folder = self.get_object()
        target_folder_id = request.data.get('target_folder_id')
        target_folder = None
        if target_folder_id == 'root':
            folder.parent = None
        elif target_folder_id:
            try:
                target_folder = StorageFolder.objects.get(id=target_folder_id)
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
        log_storage_move(
            user=request.user,
            instance=folder,
            target_folder=target_folder,
            request=request
        )
        return Response(StorageFolderSerializer(folder, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def rename(self, request, pk=None):
        folder = self.get_object()
        old_name = folder.name
        new_name = request.data.get('name')
        if not new_name:
            return Response({'error': 'Имя папки не может быть пустым'}, status=400)
        folder.name = new_name
        folder.save()
        log_storage_rename(
            user=request.user,
            instance=folder,
            old_name=old_name,
            new_name=new_name,
            request=request
        )
        return Response(StorageFolderSerializer(folder, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        folder = self.get_object()
        folder.soft_delete(user=request.user)
        log_storage_soft_delete(
            user=request.user,
            instance=folder,
            request=request
        )
        return Response({'id': folder.id, 'status': 'deleted', 'deleted_at': folder.deleted_at})

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        folder = self.get_object()
        folder.restore()
        log_storage_restore(
            user=request.user,
            instance=folder,
            request=request
        )
        return Response({'id': folder.id, 'status': 'restored'})

    @action(detail=False, methods=['get'])
    def trash(self, request):
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        deleted_folders = StorageFolder.objects.deleted().filter(
            Q(folder_type='work') | Q(folder_type='personal', created_by=request.user)
        )
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
        deleted_folders = StorageFolder.objects.deleted().filter(created_by=request.user)
        count = deleted_folders.count()
        for folder in deleted_folders:
            folder.hard_delete()
        log_storage_empty_trash(
            user=request.user,
            count=count,
            request=request
        )
        return Response({'status': 'trash_emptied', 'deleted_count': count})

    @action(detail=False, methods=['get'])
    def pinned(self, request):
        pinned_folders = StorageFolder.objects.filter(
            is_pinned=True, is_deleted=False
        ).filter(
            Q(folder_type='work') | Q(folder_type='personal', created_by=request.user)
        )
        serializer = self.get_serializer(pinned_folders, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def path(self, request, pk=None):
        try:
            folder = self.get_object()
            ancestors = []
            current = folder
            while current:
                ancestors.insert(0, current)
                current = current.parent
            serializer = self.get_serializer(ancestors, many=True)
            return Response({
                'current_folder': self.get_serializer(folder).data,
                'breadcrumbs': serializer.data,
                'path': serializer.data
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
        
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, HasFolderAccess])
    def batch_move(self, request):
        folder_ids = request.data.get('folder_ids', [])
        parent_id = request.data.get('parent_id')
        if not folder_ids:
            return Response({'error': 'No folder IDs provided'}, status=400)

        target_folder = None
        if parent_id:
            try:
                target_folder = StorageFolder.objects.get(id=parent_id)
                # Проверяем права на целевую папку (требуется 'change' или хотя бы 'add' на неё)
                self.check_object_permissions(request, target_folder)
            except StorageFolder.DoesNotExist:
                return Response({'error': 'Target folder not found'}, status=404)

        moved = []
        errors = []
        for fid in folder_ids:
            try:
                folder = StorageFolder.objects.get(id=fid)
                self.check_object_permissions(request, folder)
                if target_folder and (folder.id == target_folder.id or folder.is_descendant_of(target_folder)):
                    errors.append({'id': fid, 'error': 'Cannot move folder into itself or its descendant'})
                    continue
                folder.parent = target_folder
                folder.save()
                moved.append(fid)
            except StorageFolder.DoesNotExist:
                errors.append({'id': fid, 'error': 'Folder not found'})
            except Exception as e:
                errors.append({'id': fid, 'error': str(e)})

        return Response({'moved': moved, 'errors': errors, 'count': len(moved)})

class StorageFileViewSet(viewsets.ModelViewSet):
    queryset = StorageFile.objects.all()
    serializer_class = StorageFileSerializer
    permission_classes = [IsAuthenticated, HasFileAccess]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = StorageFileFilter
    search_fields = ['name', 'original_name', 'mime_type']
    ordering_fields = ['name', 'size', 'created_at', 'updated_at', 'download_count']
    ordering = ['-created_at']

    def _get_changed_fields(self, old_data, new_data):
        changed = {}
        for key in old_data:
            if key in new_data and old_data[key] != new_data[key]:
                changed[key] = {'old': old_data[key], 'new': new_data[key]}
        return changed

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        file_type = self.request.query_params.get('type')  # 'personal' или 'work'

        allowed_types = []
        can_view_personal = False
        can_view_work = False

        if user.has_role('admin'):
            allowed_types = ['personal', 'work']
            can_view_personal = can_view_work = True
        else:
            if user.has_role('leader') or user.has_role('deputy_director'):
                allowed_types = ['personal']
                can_view_personal = True
            elif (user.has_role('head_of_department_1') or
                  user.has_role('head_of_section_1_1') or
                  any(user.has_role(role) for role in ['hr_section_1_1', 'tech_section_1_1',
                                                       'employee_section_1_2', 'tech_section_1_3'])):
                allowed_types = ['work']
                can_view_work = True
            elif user.has_role('exploitation_chief') or user.has_role('exploitation_employee'):
                allowed_types = ['work']
                can_view_work = True
            else:
                return queryset.none()

        if not file_type:
            queryset = queryset.filter(file_type__in=allowed_types)
        else:
            if file_type not in allowed_types:
                return queryset.none()
            queryset = queryset.filter(file_type=file_type)

        if can_view_personal and (file_type == 'personal' or file_type is None):
            queryset = queryset.filter(uploaded_by=user)

        if can_view_work and (file_type == 'work' or file_type is None):
            if user.has_role('head_of_department_1'):
                division = user.division
                if division:
                    queryset = queryset.filter(division=division)
                else:
                    return queryset.none()
            elif user.has_role('head_of_section_1_1'):
                subdivision = user.subdivision
                if subdivision:
                    queryset = queryset.filter(subdivision=subdivision)
                else:
                    return queryset.none()
            elif any(user.has_role(role) for role in ['hr_section_1_1', 'tech_section_1_1',
                                                      'employee_section_1_2', 'tech_section_1_3']):
                subdivision = user.subdivision
                if subdivision:
                    queryset = queryset.filter(subdivision=subdivision)
                else:
                    return queryset.none()
            elif user.has_role('exploitation_chief') or user.has_role('exploitation_employee'):
                division = user.division
                if division:
                    queryset = queryset.filter(division=division)
                else:
                    return queryset.none()

        folder_id = self.request.query_params.get('folder_id')
        if folder_id == 'root' or folder_id is None:
            queryset = queryset.filter(folder=None)
        elif folder_id:
            queryset = queryset.filter(folder_id=folder_id)

        if not self.request.query_params.get('trash'):
            queryset = queryset.filter(is_deleted=False)

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        file_type = serializer.validated_data.get('file_type')
        extra_data = {'uploaded_by': user}
        if file_type == 'work':
            # Используем employee, если есть
            if user.employee and user.employee.division:
                extra_data['division'] = user.employee.division
            elif user.user_division:
                extra_data['division'] = user.user_division

            if user.employee and user.employee.subdivision:
                extra_data['subdivision'] = user.employee.subdivision
            elif user.user_subdivision:
                extra_data['subdivision'] = user.user_subdivision

        serializer.save(**extra_data)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            instance = StorageFile.objects.get(id=response.data['id'])
            log_storage_create(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data}
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            log_storage_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        file_data = self.get_serializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_storage_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': file_data}
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_storage_view(
            user=request.user,
            instance=instance,
            request=request
        )
        return response
    
    def get_object(self):
        if self.action in ['retrieve', 'download', 'pin', 'move', 'rename', 'soft_delete',
                        'restore', 'hard_delete', 'update', 'partial_update']:
            queryset = StorageFile.objects.all_objects()   # ИСПРАВЛЕНО
        else:
            queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        if lookup_url_kwarg not in self.kwargs:
            return queryset.get(pk=self.kwargs.get('pk'))
        lookup_value = self.kwargs[lookup_url_kwarg]
        filter_kwargs = {self.lookup_field: lookup_value}
        obj = get_object_or_404(queryset, **filter_kwargs)
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        file = self.get_object()
        try:
            file.increment_download_count()
            log_storage_download(
                user=request.user,
                instance=file,
                request=request
            )
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
        file = self.get_object()
        old_pinned = file.is_pinned
        file.is_pinned = not file.is_pinned
        file.save()
        log_storage_pin(
            user=request.user,
            instance=file,
            pinned_status=file.is_pinned,
            request=request
        )
        return Response({'id': file.id, 'is_pinned': file.is_pinned})

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        file = self.get_object()
        target_folder_id = request.data.get('target_folder_id')
        target_folder = None
        if target_folder_id == 'root':
            file.folder = None
        elif target_folder_id:
            try:
                target_folder = StorageFolder.objects.get(id=target_folder_id)
                file.folder = target_folder
            except StorageFolder.DoesNotExist:
                return Response({'error': 'Целевая папка не найдена'}, status=404)
        file.save()
        log_storage_move(
            user=request.user,
            instance=file,
            target_folder=target_folder,
            request=request
        )
        return Response(StorageFileSerializer(file, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def rename(self, request, pk=None):
        file = self.get_object()
        old_name = file.name
        new_name = request.data.get('name')
        if not new_name:
            return Response({'error': 'Имя файла не может быть пустым'}, status=400)
        file.name = new_name
        file.save()
        log_storage_rename(
            user=request.user,
            instance=file,
            old_name=old_name,
            new_name=new_name,
            request=request
        )
        return Response(StorageFileSerializer(file, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def soft_delete(self, request, pk=None):
        file = self.get_object()
        file.soft_delete(user=request.user)
        log_storage_soft_delete(
            user=request.user,
            instance=file,
            request=request
        )
        return Response({'id': file.id, 'status': 'deleted', 'deleted_at': file.deleted_at})

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, CanEmptyTrash])
    def empty_trash(self, request):
        """Очистить корзину (удалить все удалённые файлы пользователя)"""
        deleted_files = StorageFile.objects.deleted().filter(uploaded_by=request.user)
        count = deleted_files.count()
        for file in deleted_files:
            file.hard_delete()
        log_storage_empty_trash(
            user=request.user,
            count=count,
            request=request,
            details={'type': 'files'}
        )
        return Response({'status': 'trash_emptied', 'deleted_count': count, 'type': 'files'})

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        file = self.get_object()
        file.restore()
        log_storage_restore(
            user=request.user,
            instance=file,
            request=request
        )
        return Response({'id': file.id, 'status': 'restored'})

    @action(detail=True, methods=['delete'], url_path='hard-delete')
    def hard_delete(self, request, pk=None):
        file = self.get_object()
        file_id = file.id
        file_name = file.name
        file.hard_delete()
        return Response({'status': 'permanently_deleted', 'id': file_id, 'name': file_name})

    @action(detail=False, methods=['post'])
    def upload_multiple(self, request):
        serializer = FileUploadSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            created_files = serializer.save()
            log_storage_bulk_create(
                user=request.user,
                instances=created_files,
                request=request,
                details={'upload_multiple': True, 'count': len(created_files)}
            )
            file_serializer = StorageFileSerializer(created_files, many=True, context={'request': request})
            return Response(file_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def trash(self, request):
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        deleted_files = StorageFile.objects.deleted().filter(
            Q(file_type='work') | Q(file_type='personal', uploaded_by=request.user)
        )
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
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        recent_files = StorageFile.objects.filter(
            uploaded_by=request.user, is_deleted=False
        ).order_by('-created_at')
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
        pinned_files = StorageFile.objects.filter(
            is_pinned=True, is_deleted=False
        ).filter(
            Q(file_type='work') | Q(file_type='personal', uploaded_by=request.user)
        )
        serializer = self.get_serializer(pinned_files, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        user_files = StorageFile.objects.filter(uploaded_by=request.user, is_deleted=False)
        work_files = StorageFile.objects.filter(file_type='work', is_deleted=False)
        total_files = user_files.count()
        total_size = user_files.aggregate(Sum('size'))['size__sum'] or 0
        by_type = user_files.values('file_type').annotate(
            count=Count('id'), total_size=Sum('size')
        )
        by_extension = user_files.values('extension').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        today = timezone.now().date()
        last_week = today - timezone.timedelta(days=7)
        recent_uploads = user_files.filter(created_at__date__gte=last_week).count()
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
        from django.conf import settings
        user = request.user
        user_files = StorageFile.objects.filter(uploaded_by=user, is_deleted=False)
        user_folders = StorageFolder.objects.filter(
            Q(folder_type='personal', created_by=user) | Q(folder_type='work')
        ).filter(is_deleted=False)
        total_used = user_files.aggregate(total=Sum('size'))['total'] or 0
        personal_used = user_files.filter(file_type='personal').aggregate(total=Sum('size'))['total'] or 0
        work_used = user_files.filter(file_type='work').aggregate(total=Sum('size'))['total'] or 0
        storage_quota = None
        if hasattr(user, 'storage_quota') and user.storage_quota:
            storage_quota = user.storage_quota
        elif hasattr(settings, 'DEFAULT_STORAGE_QUOTA'):
            storage_quota = settings.DEFAULT_STORAGE_QUOTA
        elif hasattr(user, 'profile') and hasattr(user.profile, 'storage_quota'):
            storage_quota = user.profile.storage_quota
        usage_percentage = 0
        if storage_quota and total_used > 0:
            usage_percentage = min((total_used / storage_quota) * 100, 100)
        max_file_size = getattr(settings, 'MAX_UPLOAD_SIZE', 100 * 1024 * 1024)
        by_type_stats = user_files.values('mime_type').annotate(
            count=Count('id'), total_size=Sum('size')
        ).order_by('-total_size')[:5]
        by_type = {}
        for stat in by_type_stats:
            mime_type = stat['mime_type']
            if mime_type:
                main_type = mime_type.split('/')[0] if '/' in mime_type else mime_type
                if main_type not in by_type:
                    by_type[main_type] = {'size': 0, 'count': 0, 'files': []}
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
    

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, HasFileAccess])
    def batch_move(self, request):
        file_ids = request.data.get('file_ids', [])
        folder_id = request.data.get('folder_id')
        if not file_ids:
            return Response({'error': 'No file IDs provided'}, status=400)

        target_folder = None
        if folder_id:
            try:
                target_folder = StorageFolder.objects.get(id=folder_id)
                # Проверяем права на целевую папку (через HasFolderAccess)
                from storage.permissions import HasFolderAccess
                permission = HasFolderAccess()
                if not permission.has_object_permission(request, None, target_folder):
                    return Response({'error': 'Permission denied for target folder'}, status=403)
            except StorageFolder.DoesNotExist:
                return Response({'error': 'Target folder not found'}, status=404)

        moved = []
        errors = []
        for fid in file_ids:
            try:
                file = StorageFile.objects.get(id=fid)
                self.check_object_permissions(request, file)
                file.folder = target_folder
                file.save()
                moved.append(fid)
            except StorageFile.DoesNotExist:
                errors.append({'id': fid, 'error': 'File not found'})
            except Exception as e:
                errors.append({'id': fid, 'error': str(e)})

        return Response({'moved': moved, 'errors': errors, 'count': len(moved)})


class FileShareLinkViewSet(viewsets.ModelViewSet):
    queryset = FileShareLink.objects.all()
    serializer_class = FileShareLinkSerializer
    permission_classes = [IsAuthenticated, CanShareFiles]

    def _get_changed_fields(self, old_data, new_data):
        changed = {}
        for key in old_data:
            if key in new_data and old_data[key] != new_data[key]:
                changed[key] = {'old': old_data[key], 'new': new_data[key]}
        return changed

    def get_queryset(self):
        return FileShareLink.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        import secrets
        token = secrets.token_urlsafe(32)
        serializer.save(created_by=self.request.user, token=token)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            instance = self.get_queryset().get(id=response.data['id'])
            log_storage_share(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data}
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            log_storage_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        link_data = self.get_serializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_storage_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': link_data}
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_storage_view(
            user=request.user,
            instance=instance,
            request=request
        )
        return response

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        link = self.get_object()
        old_active = link.is_active
        link.is_active = not link.is_active
        link.save()
        log_storage_update(
            user=request.user,
            instance=link,
            request=request,
            details={
                'field': 'is_active',
                'old_value': old_active,
                'new_value': link.is_active,
                'action_type': 'toggle'
            }
        )
        return Response({'id': link.id, 'is_active': link.is_active})

    @action(detail=False, methods=['get'], permission_classes=[])
    def download_shared(self, request, token):
        link = get_object_or_404(FileShareLink, token=token)
        if not link.can_be_downloaded():
            return Response({'error': 'Ссылка недействительна или истекла'}, status=410)
        password = request.query_params.get('password')
        if link.password and link.password != password:
            return Response({'error': 'Неверный пароль'}, status=403)
        link.download_count += 1
        link.save()
        link.file.increment_download_count()
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
            return Response({'error': 'Файл не найден на сервере'}, status=404)


class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def _get_changed_fields(self, old_data, new_data):
        changed = {}
        for key in old_data:
            if key in new_data and old_data[key] != new_data[key]:
                changed[key] = {'old': old_data[key], 'new': new_data[key]}
        return changed

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            instance = self.get_queryset().get(id=response.data['id'])
            log_storage_create(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data}
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            log_storage_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        fav_data = self.get_serializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_storage_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': fav_data}
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_storage_view(
            user=request.user,
            instance=instance,
            request=request
        )
        return response

    @action(detail=False, methods=['get'])
    def all(self, request):
        favorites = self.get_queryset()
        folder_favorites = favorites.filter(folder__isnull=False)
        file_favorites = favorites.filter(file__isnull=False)
        folder_ids = [fav.folder.id for fav in folder_favorites]
        file_ids = [fav.file.id for fav in file_favorites]
        folders = StorageFolder.objects.filter(id__in=folder_ids, is_deleted=False)
        files = StorageFile.objects.filter(id__in=file_ids, is_deleted=False)
        return Response({
            'folders': StorageFolderSerializer(folders, many=True, context={'request': request}).data,
            'files': StorageFileSerializer(files, many=True, context={'request': request}).data,
        })

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        folder_id = request.data.get('folder_id')
        file_id = request.data.get('file_id')
        if folder_id:
            obj = get_object_or_404(StorageFolder, id=folder_id)
            favorite, created = Favorite.objects.get_or_create(
                user=request.user, folder=obj, defaults={'file': None}
            )
            if not created:
                favorite.delete()
                log_storage_delete(
                    user=request.user,
                    instance=favorite,
                    request=request,
                    details={'toggle': 'removed', 'type': 'folder', 'id': folder_id}
                )
                return Response({'status': 'removed', 'is_favorited': False, 'type': 'folder', 'id': folder_id})
            else:
                log_storage_create(
                    user=request.user,
                    instance=favorite,
                    request=request,
                    details={'toggle': 'added', 'type': 'folder', 'id': folder_id}
                )
                return Response({'status': 'added', 'is_favorited': True, 'type': 'folder', 'id': folder_id})
        elif file_id:
            obj = get_object_or_404(StorageFile, id=file_id)
            favorite, created = Favorite.objects.get_or_create(
                user=request.user, file=obj, defaults={'folder': None}
            )
            if not created:
                favorite.delete()
                log_storage_delete(
                    user=request.user,
                    instance=favorite,
                    request=request,
                    details={'toggle': 'removed', 'type': 'file', 'id': file_id}
                )
                return Response({'status': 'removed', 'is_favorited': False, 'type': 'file', 'id': file_id})
            else:
                log_storage_create(
                    user=request.user,
                    instance=favorite,
                    request=request,
                    details={'toggle': 'added', 'type': 'file', 'id': file_id}
                )
                return Response({'status': 'added', 'is_favorited': True, 'type': 'file', 'id': file_id})
        return Response({'error': 'Укажите folder_id или file_id'}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_storage_info(request):
    from django.conf import settings
    from django.db.models import Sum, Q
    from .models import StorageFile, StorageFolder
    user = request.user
    user_files = StorageFile.objects.filter(uploaded_by=user, is_deleted=False)
    user_folders = StorageFolder.objects.filter(
        Q(folder_type='personal', created_by=user) | Q(folder_type='work')
    ).filter(is_deleted=False)
    total_used = user_files.aggregate(total=Sum('size'))['total'] or 0
    storage_quota = None
    if hasattr(user, 'storage_quota') and user.storage_quota:
        storage_quota = user.storage_quota
    elif hasattr(settings, 'DEFAULT_STORAGE_QUOTA'):
        storage_quota = settings.DEFAULT_STORAGE_QUOTA
    elif hasattr(user, 'profile') and hasattr(user.profile, 'storage_quota'):
        storage_quota = user.profile.storage_quota
    usage_percentage = 0
    if storage_quota and total_used > 0:
        usage_percentage = min((total_used / storage_quota) * 100, 100)
    log_user_action(
        user=user,
        action='view',
        module='storage',
        request=request,
        model_name='UserStorageInfo',
        object_name='user_storage_info',
        details={'info_type': 'user_storage'}
    )
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