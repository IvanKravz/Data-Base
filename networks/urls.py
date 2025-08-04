from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommunicationNetworkViewSet

router = DefaultRouter()
router.register(r'', CommunicationNetworkViewSet)

urlpatterns = [
    path('', include(router.urls)),
]