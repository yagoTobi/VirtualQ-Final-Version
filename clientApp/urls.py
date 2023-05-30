from django.urls import path
from django.contrib.auth import views as auth_views
from .views import (
    signup,
    login,
    ResetPasswordView,
    UserUpdateView,
    get_user_info,
)

urlpatterns = [
    path("signup/", signup, name="signup"),
    path("login/", login, name="login"),
    path("user/", get_user_info, name="user_info"),
    path("update/", UserUpdateView.as_view(), name="user_update"),
    path("reset-password/", ResetPasswordView.as_view(), name="resetpassword"),
    path(
        "reset-password/<uidb64>/<token>/",
        auth_views.PasswordResetConfirmView.as_view(
            template_name="clientApp/registration/password_reset_confirm.html"
        ),
        name="password_reset_confirm",
    ),
    path(
        "reset-password/done/",
        auth_views.PasswordResetCompleteView.as_view(
            template_name="clientApp/registration/password_reset_done.html"
        ),
        name="password_reset_complete",
    ),
]
