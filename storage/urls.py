from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StorageFolderViewSet, StorageFileViewSet

router = DefaultRouter()
router.register(r'folders', StorageFolderViewSet)
router.register(r'files', StorageFileViewSet)

urlpatterns = [
    path('', include(router.urls)),
]