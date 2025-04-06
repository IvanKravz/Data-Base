from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DivisionViewSet, SubdivisionViewSet, FacilityViewSet

router = DefaultRouter()
router.register(r'divisions', DivisionViewSet)
router.register(r'subdivisions', SubdivisionViewSet)
router.register(r'', FacilityViewSet)

urlpatterns = [
    path('', include(router.urls)),
]