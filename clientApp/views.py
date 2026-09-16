from django.contrib.auth import authenticate, password_validation
from django.contrib.auth.forms import PasswordResetForm, SetPasswordForm
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.views import INTERNAL_RESET_SESSION_TOKEN
from django.conf import settings
from django.core.exceptions import ValidationError as ModelValidationError
from django.db import transaction
from django.http import HttpResponseRedirect
from django.utils.decorators import method_decorator
from django.utils.http import urlsafe_base64_decode
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe
from django.views.decorators.debug import sensitive_post_parameters, sensitive_variables
from urllib.parse import urlencode
from rest_framework import generics, serializers, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .serializers import UserSerializer, UserUpdateSerializer, PasswordResetSerializer, ResetLinkSerializer
from .models import CustomUser


class AuthThrottle(AnonRateThrottle):
    scope = "auth"


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def signup(request):
    serializer = UserSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response({"token": Token.objects.get(user=user).key}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def login(request):
    username, password = request.data.get("username"), request.data.get("password")
    user = authenticate(username=username, password=password) if isinstance(username, str) and isinstance(password, str) else None
    if user is None:
        return Response({"detail": "Invalid username or password."}, status=status.HTTP_400_BAD_REQUEST)
    with transaction.atomic():
        current = CustomUser.objects.select_for_update().filter(pk=user.pk).first()
        if current is None or not current.is_active or current.password != user.password:
            return Response({"detail": "Invalid username or password."}, status=status.HTTP_400_BAD_REQUEST)
        token, _ = Token.objects.get_or_create(user=current)
    return Response({"token": token.key})


@api_view(["POST"])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def get_user_info(request):
    return Response({
        **UserUpdateSerializer(request.user).data,
        "is_staff": request.user.is_staff,
        "permissions": sorted(request.user.get_all_permissions()) if request.user.is_staff else [],
    })


class UserUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = UserUpdateSerializer

    def get_object(self):
        return self.request.user


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]

    def post(self, request):
        email = serializers.EmailField().run_validation(request.data.get("email"))
        form = PasswordResetForm({"email": email})
        if form.is_valid():
            form.save(
                request=request,
                use_https=request.is_secure(),
                subject_template_name="clientApp/registration/password_reset_subject.txt",
                email_template_name="clientApp/registration/password_reset_email.txt",
                extra_email_context={"web_origin": settings.VIRTUALQ_WEB_ORIGIN},
            )
        # Never disclose whether an account exists or return the reset credential.
        return Response({"success": "If an account uses that email, a password reset link has been sent."})


@sensitive_variables()
def valid_reset_user(data, *, lock=False):
    try:
        uid = CustomUser._meta.pk.to_python(urlsafe_base64_decode(data["uid"]).decode())
        users = CustomUser.objects.select_for_update() if lock else CustomUser.objects
        user = users.get(pk=uid)
    except (TypeError, ValueError, OverflowError, ModelValidationError, CustomUser.DoesNotExist):
        user = None
    if (
        user is None or not user.is_active or not user.has_usable_password()
        or not default_token_generator.check_token(user, data["token"])
    ):
        raise serializers.ValidationError({"token": "This reset link is invalid or has expired. Request a new link."})
    return user


@method_decorator(never_cache, name="dispatch")
@method_decorator(sensitive_post_parameters("new_password1", "new_password2", "token"), name="dispatch")
class CheckPasswordResetView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthThrottle]

    @sensitive_variables()
    def post(self, request):
        serializer = ResetLinkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        valid_reset_user(serializer.validated_data)
        return Response({"password_help": password_validation.password_validators_help_texts()})


class ConfirmPasswordResetView(CheckPasswordResetView):
    @transaction.atomic
    @sensitive_variables()
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = valid_reset_user(data, lock=True)
        form = SetPasswordForm(user, data)
        if not form.is_valid():
            raise serializers.ValidationError(form.errors)
        form.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@never_cache
@require_safe
def password_reset_page(request, uidb64=None, token=None):
    path = "/sign-in"
    if uidb64 is not None:
        # Support links already opened in Django's former session-based form.
        if token == "set-password":
            token = request.session.pop(INTERNAL_RESET_SESSION_TOKEN, "")
        path = "/set-password#" + urlencode({"uid": uidb64, "token": token or ""})
    response = HttpResponseRedirect(settings.VIRTUALQ_WEB_ORIGIN + path)
    response["Referrer-Policy"] = "no-referrer"
    return response
