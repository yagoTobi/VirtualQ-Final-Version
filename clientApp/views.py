from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated

from .serializers import UserSerializer, UserUpdateSerializer

from django.contrib.sites.shortcuts import get_current_site
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.urls import reverse_lazy
from django.contrib.auth.views import PasswordResetConfirmView
from django.contrib.auth import authenticate
from django.db import IntegrityError
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from email.mime.image import MIMEImage

CustomUser = get_user_model()


# Sign Up
@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token = Token.objects.get(user=user)
        return Response({"token": token.key}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Log In
@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get("username")
    password = request.data.get("password")
    user = authenticate(username=username, password=password)
    if user is None:
        return Response(
            {"error": "Invalid login credentials"}, status=status.HTTP_400_BAD_REQUEST
        )
    token, created = Token.objects.get_or_create(user=user)
    return Response({"token": token.key}, status=status.HTTP_200_OK)


# Get User Info
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    user = request.user
    data = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "last_name": user.last_name,
        "username": user.username,
        "dob": user.dob,  # uncomment this if your user model has a date_of_birth field
    }
    return Response(data)


# User Update
class UserUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserUpdateSerializer(user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        serializer = UserUpdateSerializer(user, data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data)
            except IntegrityError:
                return Response(
                    {"error": "Username or email already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Reset Password
@permission_classes([AllowAny])
class ResetPasswordView(APIView):
    def post(self, request):
        email = request.data.get("email")
        associated_users = CustomUser.objects.filter(email=email)
        if associated_users.exists():
            for user in associated_users:
                c = {
                    "email": user.email,
                    "domain": get_current_site(request).domain,
                    "site_name": "Virtual Q - TFG Yago",
                    "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                    "user": user,
                    "token": default_token_generator.make_token(user),
                    "protocol": request.scheme,
                }

                subject_template_name = (
                    "clientApp/registration/password_reset_subject.txt"
                )
                email_template_name = "clientApp/registration/password_reset_email.html"
                subject = render_to_string(subject_template_name, c)
                subject = "".join(
                    subject.splitlines()
                )  # Email subject *must not* contain newlines
                html_content = render_to_string(
                    email_template_name, c
                )  # render with dynamic value
                text_content = strip_tags(
                    html_content
                )  # Strip the html tag. So people can see the pure text at least.

                # Create the email, and attach the HTML version as well.
                email_message = EmailMultiAlternatives(
                    subject, text_content, "virtualqueuetfg@gmail.com", [user.email]
                )

                # Open the image file in binary mode, encode it into base64 and attach it to the email as an inline image.
                image_path = (
                    "clientApp/templates/clientApp/registration/assets/VirtualQLogo.png"
                )
                with open(image_path, "rb") as img:
                    msg_img = MIMEImage(img.read())
                    msg_img.add_header("Content-ID", "<{}>".format("logo"))
                    email_message.attach(msg_img)

                # Reference the image in the HTML content by its Content-ID.
                html_content = html_content.replace(
                    "./assets/VirtualQLogo.png", "cid:logo"
                )

                email_message.attach_alternative(html_content, "text/html")
                email_message.send()

            return Response(
                {
                    "success": "Password reset email has been sent.",
                    "uid": c["uid"],
                    "token": c["token"],
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {"error": "No user is associated with this email address"},
            status=status.HTTP_400_BAD_REQUEST,
        )


# Reset Password confirmed
@permission_classes([AllowAny])
class ResetPasswordConfirm(PasswordResetConfirmView):
    template_name = (
        "clientApp/templates/clientApp/registration/password_reset_confirm.html"
    )
    success_url = reverse_lazy("password_reset_complete")


class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, created = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user_id": user.pk, "email": user.email})
