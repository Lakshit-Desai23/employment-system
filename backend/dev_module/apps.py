from django.apps import AppConfig


class DevModuleConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'dev_module'

    def ready(self):
        import dev_module.signals
