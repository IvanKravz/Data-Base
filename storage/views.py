from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import StorageFolder, StorageFile
from .serializers import StorageFolderSerializer, StorageFileSerializer

class StorageFolderViewSet(viewsets.ModelViewSet):
    queryset = StorageFolder.objects.all()
    serializer_class = StorageFolderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        parent_id = self.request.query_params.get('parent', None)
        if parent_id == 'root':
            return StorageFolder.objects.filter(parent=None)
        return StorageFolder.objects.filter(parent_id=parent_id)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def path(self, request, pk=None):
        """Get the full path to the folder"""
        folder = self.get_object()
        path = []
        current = folder
        while current:
            path.insert(0, {
                'id': current.id,
                'name': current.name
            })
            current = current.parent
        return Response(path)

class StorageFileViewSet(viewsets.ModelViewSet):
    queryset = StorageFile.objects.all()
    serializer_class = StorageFileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        folder_id = self.request.query_params.get('folder', None)
        if folder_id == 'root':
            return StorageFile.objects.filter(folder=None)
        return StorageFile.objects.filter(folder_id=folder_id)

    def perform_create(self, serializer):
        file_obj = self.request.FILES.get('file')
        if not file_obj:
            raise serializer.ValidationError('No file was submitted')

        serializer.save(
            uploaded_by=self.request.user,
            size=file_obj.size,
            mime_type=file_obj.content_type
        )

    @action(detail=True, methods=['post'])
    def rename(self, request, pk=None):
        file = self.get_object()
        new_name = request.data.get('name')
        if not new_name:
            return Response(
                {'error': 'New name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        file.name = new_name
        file.save()
        serializer = self.get_serializer(file)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        file = self.get_object()
        new_folder_id = request.data.get('folder')
        
        if new_folder_id == 'root':
            file.folder = None
        else:
            new_folder = get_object_or_404(StorageFolder, id=new_folder_id)
            file.folder = new_folder
            
        file.save()
        serializer = self.get_serializer(file)
        return Response(serializer.data)