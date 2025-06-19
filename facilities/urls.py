from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommunicationPostViewSet, DivisionViewSet, FacilityTypeViewSet, SubdivisionViewSet, FacilityViewSet

router = DefaultRouter()
router.register(r'divisions', DivisionViewSet)
router.register(r'subdivisions', SubdivisionViewSet)
router.register(r'communication-posts', CommunicationPostViewSet)
router.register(r'facility-types', FacilityTypeViewSet)
router.register(r'', FacilityViewSet)

urlpatterns = [
    path('', include(router.urls)),
]