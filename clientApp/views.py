from django.contrib.auth import authenticate
from django.contrib.auth.forms import PasswordResetForm
from rest_framework import generics, serializers, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .serializers import UserSerializer, UserUpdateSerializer


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
    token, _ = Token.objects.get_or_create(user=user)
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
            )
        # Never disclose whether an account exists or return the reset credential.
        return Response({"success": "If an account uses that email, a password reset link has been sent."})
