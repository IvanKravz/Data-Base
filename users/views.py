import os
from venv import logger
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from django.db.models import Q
from rest_framework.parsers import MultiPartParser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView as BaseTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import User, ShaWorkerDetails
from .serializers import EmployeeDictionariesSerializer, EmployeePhotoSerializer, UserSerializer, TokenObtainPairSerializer

from rest_framework import viewsets, permissions
from .models import User, Employee, ShaWorkerDetails, ShaEquipmentConclusion
from .serializers import UserSerializer, EmployeeSerializer, ShaWorkerDetailsSerializer, ShaEquipmentConclusionSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated] #[permissions.IsAdminUser]

class EmployeeViewSet(APIView):
    permission_classes = [IsAuthenticated]  # или [permissions.IsAdminUser] для ограничения доступа

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
        serializer = EmployeeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
   
    def patch(self, request, pk):
        try:
            employee = Employee.objects.get(pk=pk)
        except Employee.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = EmployeeSerializer(
            employee, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
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
    permission_classes = [IsAuthenticated] #[permissions.IsAdminUser]

class ShaEquipmentConclusionViewSet(viewsets.ModelViewSet):
    queryset = ShaEquipmentConclusion.objects.all()
    serializer_class = ShaEquipmentConclusionSerializer
    permission_classes = [IsAuthenticated] #[permissions.IsAdminUser]

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
        
class EmployeeDictionariesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = {
            'categories': [{'value': c[0], 'label': c[1]} for c in Employee.get_category_choices()],
            'subcategories': [{'value': c[0], 'label': c[1]} for c in Employee.get_subcategory_choices()],
            'officer_positions': [{'value': p[0], 'label': p[1]} for p in Employee.get_officer_positions()],
            'warrant_officer_positions': [{'value': p[0], 'label': p[1]} for p in Employee.get_warrant_officer_positions()],
            'civilian_positions': [{'value': p[0], 'label': p[1]} for p in Employee.get_civilian_positions()],
            'management_officer_ranks': [{'value': p[0], 'label': p[1]} for p in Employee.get_management_officer_ranks()],
            'officer_ranks': [{'value': r[0], 'label': r[1]} for r in Employee.get_officer_ranks()],
            'warrant_officer_ranks': [{'value': r[0], 'label': r[1]} for r in Employee.get_warrant_officer_ranks()],
        }
        serializer = EmployeeDictionariesSerializer(data)
        return Response(serializer.data)
    
class EmployeePhotoView(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        employee = get_object_or_404(Employee, pk=pk)
        old_photo = employee.photo.path if employee.photo else None
        
        try:
            serializer = EmployeePhotoSerializer(
                employee, 
                data=request.data, 
                partial=True,
                context={'request': request}
            )
            
            if serializer.is_valid():
                # Удаляем старое фото после успешной валидации
                if old_photo and os.path.exists(old_photo):
                    try:
                        os.remove(old_photo)
                    except OSError as e:
                        logger.error(f"Error deleting old photo: {str(e)}")
                
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.error(f"Error updating photo: {str(e)}")
            return Response(
                {'error': 'Failed to update photo'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, pk):
        employee = get_object_or_404(Employee, pk=pk)
        
        try:
            # Сохраняем состояние до удаления для отката
            original_photo = employee.photo
            
            if employee.delete_photo():
                # Убедимся, что изменения применились
                employee.refresh_from_db()
                
                # Возвращаем обновленные данные
                serializer = EmployeeSerializer(employee, context={'request': request})
                return Response(serializer.data)
            
            return Response(
                {'error': 'No photo to delete'}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        except Exception as e:
            # Откатываем изменения в случае ошибки
            if original_photo:
                employee.photo = original_photo
                employee.save()
                
            logger.error(f"Ошибка удаления фото: {str(e)}")
            return Response(
                {'error': 'Failed to delete photo'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )