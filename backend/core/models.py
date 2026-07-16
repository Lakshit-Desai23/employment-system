from django.db import models
from .validators import validate_name_length

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True, validators=[validate_name_length])
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Designation(models.Model):
    name = models.CharField(max_length=100, unique=True, validators=[validate_name_length])
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

def default_modules_config():
    return {
        "employees": True,
        "projects": True,
        "tasks": True,
        "work_logs": True,
        "design": True,
        "development": True,
        "reports": True,
        "messages": True,
        "notifications": True,
    }

class Company(models.Model):
    name = models.CharField(max_length=255, default="WorkOps Inc.")
    logo = models.ImageField(upload_to='branding/', null=True, blank=True)
    favicon = models.ImageField(upload_to='branding/', null=True, blank=True)
    primary_color = models.CharField(max_length=7, blank=True)
    secondary_color = models.CharField(max_length=7, blank=True)
    accent_color = models.CharField(max_length=7, blank=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    theme_json = models.JSONField(default=dict, blank=True)
    modules_config = models.JSONField(default=default_modules_config, blank=True)
    updated_date = models.DateTimeField(auto_now=True)


    class Meta:
        verbose_name_plural = "Companies"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_logo = None
        old_favicon = None
        old_name = None
        old_primary = None
        old_secondary = None
        old_accent = None

        if not is_new:
            try:
                orig = Company.objects.get(pk=self.pk)
                old_logo = orig.logo
                old_favicon = orig.favicon
                old_name = orig.name
                old_primary = orig.primary_color
                old_secondary = orig.secondary_color
                old_accent = orig.accent_color
            except Company.DoesNotExist:
                pass

        # Call super first to save files to disk so they are readable by Pillow
        super().save(*args, **kwargs)

        logo_changed = (is_new and self.logo) or (not is_new and self.logo != old_logo)
        color_or_name_changed = (
            (self.name != old_name) or
            (self.primary_color != old_primary) or
            (self.secondary_color != old_secondary) or
            (self.accent_color != old_accent)
        )

        if logo_changed or color_or_name_changed or not self.theme_json:
            extracted_colors = []
            if self.logo:
                try:
                    from .theme_generator import extract_colors_from_image
                    extracted_colors = extract_colors_from_image(self.logo.path)
                except Exception as e:
                    print(f"Error extracting colors in model save: {e}")

            # If user didn't specify primary, extract it
            if not self.primary_color:
                if len(extracted_colors) > 0:
                    self.primary_color = extracted_colors[0]
                else:
                    self.primary_color = "#1e40af"

            # If user didn't specify secondary, extract it
            if not self.secondary_color:
                if len(extracted_colors) > 1:
                    self.secondary_color = extracted_colors[1]
                else:
                    self.secondary_color = "#0f766e"

            # If user didn't specify accent, extract it
            if not self.accent_color:
                if len(extracted_colors) > 2:
                    self.accent_color = extracted_colors[2]
                else:
                    self.accent_color = "#3b82f6"

            # Generate theme JSON
            from .theme_generator import generate_theme_json
            logo_url = self.logo.url if self.logo else None
            favicon_url = self.favicon.url if self.favicon else None

            self.theme_json = generate_theme_json(
                company_name=self.name,
                logo_url=logo_url,
                favicon_url=favicon_url,
                primary=self.primary_color,
                secondary=self.secondary_color,
                accent=self.accent_color
            )

            # Avoid recursive call to save() by updating database fields directly
            super().save(update_fields=['primary_color', 'secondary_color', 'accent_color', 'theme_json'])

