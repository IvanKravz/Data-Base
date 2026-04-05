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
from django.utils import timezone
from datetime import timedelta
from users.logging import log_user_action
from django.contrib.auth.models import Group
from rest_framework_simplejwt.tokens import RefreshToken
from .utils import generate_temp_2fa_token

logger = logging.getLogger(__name__)


class TokenObtainPairSerializer(BaseTokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        # Если 2FA включена и есть код
        if user.two_factor_enabled and user.two_factor_code:
            temp_token = generate_temp_2fa_token(user.id)
            return {
                'requires_2fa': True,
                'temp_token': temp_token
            }

        # Обычный вход – выдаём токены и данные пользователя
        refresh = RefreshToken.for_user(user)
        data['access'] = str(refresh.access_token)
        data['refresh'] = str(refresh)
        data['user'] = UserSerializer(user).data

        # Логируем вход
        request = self.context.get('request')
        from users.logging import log_user_action
        log_user_action(
            user=user,
            action='login',
            module='auth',
            request=request,
            details={'login_type': 'password'}
        )
        return data


class TwoFactorVerifySerializer(serializers.Serializer):
    temp_token = serializers.CharField()
    code = serializers.CharField(min_length=4, max_length=4)


class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    division_info = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    two_factor_enabled = serializers.BooleanField(read_only=True)

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

    groups = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Group.objects.all(),
        required=False,
        write_only=True,
        help_text='Список ID групп (ролей) пользователя'
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'is_staff', 'is_active',
            'date_joined', 'last_login', 'roles', 'permissions', 'division_info',
            'user_division_id', 'user_subdivision_id', 'is_global_view', 'is_online',
            'groups', 'two_factor_enabled', 
        ]
        read_only_fields = ['is_staff', 'is_active', 'date_joined', 'last_login', 'is_online', 'two_factor_enabled']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        groups = validated_data.pop('groups', None)
        if password:
            user.set_password(password)
            user.save()
        if groups is not None:
            user.groups.set(groups)
        return user

    def get_is_online(self, obj):
        if not obj.last_login:
            return False
        return timezone.now() - obj.last_login < timedelta(minutes=5)

    def get_roles(self, obj):
        return obj.get_roles()

    def get_permissions(self, obj):
        return obj.get_permissions_info()

    def get_division_info(self, obj):
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