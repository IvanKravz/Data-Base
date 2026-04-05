from rest_framework_simplejwt.tokens import AccessToken
from django.conf import settings

def generate_temp_2fa_token(user_id):
    """Генерирует временный JWT токен для 2FA (живёт 5 минут)"""
    from datetime import timedelta
    token = AccessToken()
    token.payload['user_id'] = user_id
    token.payload['temp_2fa'] = True
    # Устанавливаем короткое время жизни
    token.set_exp(lifetime=timedelta(minutes=5))
    return str(token)