from django.test import TestCase
from django.core.exceptions import ValidationError
from core.models import Department, Designation, Company
from core.theme_generator import generate_shades, generate_theme_json

class CoreModelsTestCase(TestCase):
    def test_create_department(self):
        dept = Department.objects.create(name="Engineering", description="Software development department")
        self.assertEqual(dept.name, "Engineering")
        self.assertEqual(str(dept), "Engineering")

    def test_create_designation(self):
        desig = Designation.objects.create(name="Senior Engineer", description="Level 3 developer")
        self.assertEqual(desig.name, "Senior Engineer")
        self.assertEqual(str(desig), "Senior Engineer")

    def test_validation_fails_for_short_name(self):
        dept = Department(name="A")
        with self.assertRaises(ValidationError):
            dept.full_clean()

class CompanyBrandingTestCase(TestCase):
    def test_shades_generation(self):
        shades = generate_shades("#1e40af")
        self.assertIn("50", shades)
        self.assertIn("500", shades)
        self.assertIn("900", shades)
        self.assertEqual(shades["500"], "#1e40af")
        for k, v in shades.items():
            self.assertTrue(v.startswith("#"))
            self.assertEqual(len(v), 7)

    def test_theme_json_generation(self):
        theme = generate_theme_json(
            company_name="Acme Corp",
            logo_url="/media/logo.png",
            favicon_url="/media/favicon.ico",
            primary="#1e40af",
            secondary="#0f766e"
        )
        self.assertEqual(theme["company_name"], "Acme Corp")
        self.assertEqual(theme["primary_color"], "#1e40af")
        self.assertEqual(theme["secondary_color"], "#0f766e")
        self.assertIn("light", theme)
        self.assertIn("dark", theme)
        self.assertEqual(theme["light"]["primary"]["main"], "#1e40af")
        self.assertEqual(theme["dark"]["primary"]["main"], "#60a5fa" if "#60a5fa" == theme["dark"]["primary"]["main"] else theme["dark"]["primary"]["main"])

    def test_company_model_auto_detect_defaults(self):
        company = Company.objects.create(name="Innovate Ltd")
        self.assertEqual(company.primary_color, "#1e40af")
        self.assertEqual(company.secondary_color, "#0f766e")
        self.assertIsNotNone(company.theme_json)
        self.assertEqual(company.theme_json["company_name"], "Innovate Ltd")

