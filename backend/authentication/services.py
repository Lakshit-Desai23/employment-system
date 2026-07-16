import secrets
import string

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags

User = get_user_model()


class UserService:
    @staticmethod
    def generate_temporary_password(length=12):
        alphabet = string.ascii_letters + string.digits
        password = ''.join(secrets.choice(alphabet) for _ in range(length - 2))
        return f'{password}#7'

    @staticmethod
    def _email_html(title, subtitle, name, email, temporary_password, action_text):
        login_url = getattr(settings, 'FRONTEND_LOGIN_URL', 'http://127.0.0.1:5173/login')
        return f"""
        <div style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;">
          <div style="max-width:620px;margin:0 auto;padding:32px 18px;">
            <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 16px 40px rgba(15,23,42,0.08);">
              <div style="background:#1e40af;padding:26px 30px;color:#ffffff;">
                <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.85;">EPM Enterprise</div>
                <h1 style="margin:8px 0 0;font-size:26px;line-height:1.25;">{title}</h1>
                <p style="margin:8px 0 0;color:#dbeafe;">{subtitle}</p>
              </div>
              <div style="padding:28px 30px;">
                <p style="margin:0 0 16px;font-size:15px;">Hello <strong>{name}</strong>,</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">{action_text}</p>
                <div style="border:1px solid #bfdbfe;background:#eff6ff;border-radius:12px;padding:18px;margin:22px 0;">
                  <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:#1e40af;letter-spacing:.08em;">Login details</div>
                  <p style="margin:12px 0 6px;font-size:14px;color:#475569;">Email</p>
                  <div style="font-size:16px;font-weight:700;color:#0f172a;">{email}</div>
                  <p style="margin:16px 0 6px;font-size:14px;color:#475569;">Temporary password</p>
                  <div style="font-size:22px;font-weight:800;letter-spacing:.08em;color:#1e3a8a;background:#ffffff;border:1px dashed #93c5fd;border-radius:10px;padding:12px;">{temporary_password}</div>
                </div>
                <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#475569;">Use this temporary password to sign in. After login, change your password from Profile or use Forgot Password again if needed.</p>
                <a href="{login_url}" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px;">Open EPM Login</a>
              </div>
              <div style="padding:18px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.5;">
                This is an automated security email from EPM Enterprise. Do not share this password with anyone.
              </div>
            </div>
          </div>
        </div>
        """

    @staticmethod
    def send_temporary_password_email(user, temporary_password, reason='invite'):
        if reason == 'invite':
            subject = 'Welcome to EPM Enterprise - Your Login Details'
            title = 'Welcome to EPM Enterprise'
            subtitle = 'Your account has been created by the administrator.'
            action_text = 'Your EPM account is ready. Please use the temporary password below for your first login.'
        else:
            subject = 'EPM Enterprise - Temporary Password Reset'
            title = 'Password Reset'
            subtitle = 'A new temporary password has been generated for your account.'
            action_text = 'We received a forgot password request. Please use the temporary password below to login.'

        html = UserService._email_html(
            title=title,
            subtitle=subtitle,
            name=user.full_name or user.email,
            email=user.email,
            temporary_password=temporary_password,
            action_text=action_text,
        )
        email = EmailMultiAlternatives(
            subject=subject,
            body=strip_tags(html),
            from_email=settings.DEFAULT_FROM_EMAIL or 'admin@epm.com',
            to=[user.email],
        )
        email.attach_alternative(html, 'text/html')
        email.send(fail_silently=False)

    @staticmethod
    def change_password(user, new_password):
        user.set_password(new_password)
        user.is_temporary_password = False
        user.save(update_fields=['password', 'is_temporary_password'])
        return user

    @staticmethod
    def set_temporary_password(user, temporary_password):
        user.set_password(temporary_password)
        user.is_temporary_password = True
        user.save(update_fields=['password', 'is_temporary_password'])
        return user

    @staticmethod
    def send_password_reset_email(email):
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return True

        temporary_password = UserService.generate_temporary_password()
        UserService.set_temporary_password(user, temporary_password)
        UserService.send_temporary_password_email(user, temporary_password, reason='forgot')
        return True
