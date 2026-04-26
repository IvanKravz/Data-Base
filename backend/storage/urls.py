from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StorageFolderViewSet, StorageFileViewSet,
    FileShareLinkViewSet, FavoriteViewSet, get_user_storage_info
)

router = DefaultRouter()
router.register(r'folders', StorageFolderViewSet)
router.register(r'files', StorageFileViewSet)
router.register(r'share-links', FileShareLinkViewSet)
router.register(r'favorites', FavoriteViewSet, basename='favorite')

urlpatterns = [
    path('', include(router.urls)),
    path('share/download/<str:token>/', FileShareLinkViewSet.as_view({'get': 'download_shared'}), name='download-shared'),
    path('user-storage-info/', get_user_storage_info, name='user-storage-info'),
]