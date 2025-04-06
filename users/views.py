from rest_framework import viewsets, status
from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView as BaseTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import User, ShaWorkerDetails
from .serializers import UserSerializer, TokenObtainPairSerializer

from rest_framework import viewsets, permissions
from .models import User, Employee, ShaWorkerDetails, ShaEquipmentConclusion
from .serializers import UserSerializer, EmployeeSerializer, ShaWorkerDetailsSerializer, ShaEquipmentConclusionSerializer

# class UserViewSet(viewsets.ModelViewSet):
#     queryset = User.objects.all()
#     serializer_class = UserSerializer
#     permission_classes = [AllowAny] #[permissions.IsAdminUser]

class EmployeeViewSet(APIView):
    permission_classes = [AllowAny]  # или [permissions.IsAdminUser] для ограничения доступа

    def get(self, request, pk=None):
        if pk:
            # Получение конкретного сотрудника
            try:
                employee = Employee.objects.get(pk=pk)
                serializer = EmployeeSerializer(employee)
                return Response(serializer.data)
            except Employee.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
        else:
            # Получение списка сотрудников с сортировкой по приоритету
            employees = Employee.objects.all().order_by('priority', 'full_name')
            serializer = EmployeeSerializer(employees, many=True)
            return Response(serializer.data)

    def post(self, request):
        serializer = EmployeeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
   
    def patch(self, request, pk):
        try:
            employee = Employee.objects.get(pk=pk)
        except Employee.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        # Используем partial=True для частичного обновления
        serializer = EmployeeSerializer(employee, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        try:
            employee = Employee.objects.get(pk=pk)
        except Employee.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = EmployeeSerializer(employee, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            employee = Employee.objects.get(pk=pk)
        except Employee.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        employee.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ShaWorkerViewSet(viewsets.ModelViewSet):
    queryset = ShaWorkerDetails.objects.all()
    serializer_class = ShaWorkerDetailsSerializer
    permission_classes = [AllowAny] #[permissions.IsAdminUser]

class ShaEquipmentConclusionViewSet(viewsets.ModelViewSet):
    queryset = ShaEquipmentConclusion.objects.all()
    serializer_class = ShaEquipmentConclusionSerializer
    permission_classes = [AllowAny] #[permissions.IsAdminUser]

class TokenObtainPairView(BaseTokenObtainPairView):
    serializer_class = TokenObtainPairSerializer
    permission_classes = [AllowAny]

class TokenRefreshView(BaseTokenRefreshView):
    permission_classes = [AllowAny]

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = UserSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                if user:
                    token_serializer = TokenObtainPairSerializer(data={
                        'username': request.data['username'],
                        'password': request.data['password']
                    })
                    if token_serializer.is_valid():
                        return Response(token_serializer.validated_data, status=status.HTTP_201_CREATED)
                    return Response(token_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )