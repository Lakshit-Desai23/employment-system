from django.apps import AppConfig


class DesignModuleConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'design_module'

    def ready(self):
        import design_module.signals
