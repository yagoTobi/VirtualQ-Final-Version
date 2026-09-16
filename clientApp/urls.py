from django.urls import path
from .views import (
    signup,
    login,
    ResetPasswordView,
    ConfirmPasswordResetView,
    CheckPasswordResetView,
    password_reset_page,
    UserUpdateView,
    get_user_info,
    logout,
)

urlpatterns = [
    path("signup/", signup, name="signup"),
    path("login/", login, name="login"),
    path("logout/", logout, name="logout"),
    path("user/", get_user_info, name="user_info"),
    path("update/", UserUpdateView.as_view(), name="user_update"),
    path("reset-password/", ResetPasswordView.as_view(), name="resetpassword"),
    path("reset-password/confirm/", ConfirmPasswordResetView.as_view(), name="confirm_password_reset"),
    path("reset-password/check/", CheckPasswordResetView.as_view(), name="check_password_reset"),
    path(
        "reset-password/<uidb64>/<token>/",
        password_reset_page,
        name="password_reset_confirm",
    ),
    path(
        "reset-password/done/",
        password_reset_page,
        name="password_reset_complete",
    ),
]
