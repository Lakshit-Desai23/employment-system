from rest_framework_simplejwt.tokens import RefreshToken

def get_tokens_for_user(user):
    """Manually generate refresh and access tokens for a user (useful for tests or registration flows)."""
    refresh = RefreshToken.for_user(user)
    
    # Custom payload claims
    refresh['email'] = user.email
    refresh['role'] = user.role
    refresh['full_name'] = user.full_name
    
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }
