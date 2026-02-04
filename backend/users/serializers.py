# users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer as BaseTokenObtainPairSerializer
from facilities.models import Division, Subdivision
from .models import User
from .logs_models import UserActionLog
import os
from django.utils import timezone as django_timezone
import logging

logger = logging.getLogger(__name__)


class TokenObtainPairSerializer(BaseTokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        serializer = UserSerializer(user)
        data['user'] = serializer.data
        return data


class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    division_info = serializers.SerializerMethodField()
    
    user_division_id = serializers.PrimaryKeyRelatedField(
        queryset=Division.objects.all(),
        source='user_division',
        required=False,
        allow_null=True,
        write_only=True
    )
    user_subdivision_id = serializers.PrimaryKeyRelatedField(
        queryset=Subdivision.objects.all(),
        source='user_subdivision',
        required=False,
        allow_null=True,
        write_only=True
    )
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'is_staff', 'is_active', 'date_joined',
            'roles', 'permissions', 'division_info', 'user_division_id', 'user_subdivision_id',
            'is_global_view' 
        ]
        read_only_fields = ['is_staff', 'is_active', 'date_joined']
    
    def get_roles(self, obj):
        return obj.get_roles()
    
    def get_permissions(self, obj):
        return obj.get_permissions_info()
    
    def get_division_info(self, obj):
        # Используем свойства division и subdivision
        if obj.division:
            return {
                'id': obj.division.id,
                'name': obj.division.name,
                'subdivision': {
                    'id': obj.subdivision.id,
                    'name': obj.subdivision.name
                } if obj.subdivision else None
            }
        return None


class UserActionLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    module_display = serializers.CharField(source='get_module_display', read_only=True)
    action_color = serializers.CharField(source='get_action_color', read_only=True)
    formatted_time = serializers.SerializerMethodField()
    file_size_display = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()
    
    class Meta:
        model = UserActionLog
        fields = [
            'id', 'user_username', 'action', 'action_display', 'module', 
            'module_display', 'model_name', 'object_id', 'object_name',
            'details', 'ip_address', 'created_at', 'formatted_time', 
            'action_color', 'file_path', 'file_size', 'file_size_display',
            'file_type', 'storage_location', 'file_name'
        ]
        read_only_fields = fields

    def get_formatted_time(self, obj):
        return django_timezone.localtime(obj.created_at).strftime('%d.%m.%Y %H:%M:%S')
    
    def get_file_size_display(self, obj):
        return obj.get_file_size_display()
    
    def get_file_name(self, obj):
        if obj.file_path:
            return os.path.basename(obj.file_path)
        return None


class StorageStatisticsSerializer(serializers.Serializer):
    total_actions = serializers.IntegerField()
    actions_by_type = serializers.ListField()
    files_by_type = serializers.ListField()
    storage_by_location = serializers.ListField()
    total_upload_size = serializers.IntegerField()
    total_download_size = serializers.IntegerField()
    upload_count = serializers.IntegerField()
    download_count = serializers.IntegerField()