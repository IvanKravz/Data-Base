from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, TaskStepViewSet

router = DefaultRouter()
router.register(r'steps', TaskStepViewSet)
router.register(r'', TaskViewSet)

urlpatterns = [
    path('incomplete-count/', TaskViewSet.as_view({'get': 'incomplete_count'}), name='tasks-incomplete-count'),
    path('', include(router.urls)),
]