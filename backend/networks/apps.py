from django.apps import AppConfig


class NetworksConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'networks'
    verbose_name = 'Сети связи'

    def ready(self):
        from . import signals  # noqa: F401