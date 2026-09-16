"""Local development settings. The historical database and .env are not loaded."""
import os
from pathlib import Path
from urllib.parse import urlsplit

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env.local")

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "django-insecure-virtualq-local-only")
DEBUG = os.environ.get("DJANGO_DEBUG", "true").lower() == "true"
ALLOWED_HOSTS = os.environ.get(
    "DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,[::1]"
).split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "django_filters",
    "rest_framework",
    "rest_framework.authtoken",
    "clientApp",
    "adminApp",
    "queueApp",
    "rideApp",
    "restaurantApp",
    "storeApp",
    "ticketApp",
]
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS", "http://localhost:8081,http://127.0.0.1:8081,http://localhost:19006,http://127.0.0.1:19006"
).split(",")
VIRTUALQ_WEB_ORIGIN = os.environ.get("VIRTUALQ_WEB_ORIGIN", "http://localhost:8081").rstrip("/")
web_origin = urlsplit(VIRTUALQ_WEB_ORIGIN)
if (
    web_origin.scheme not in ("http", "https") or not web_origin.hostname
    or web_origin.username or web_origin.password or web_origin.path
    or web_origin.query or web_origin.fragment
):
    raise ImproperlyConfigured("VIRTUALQ_WEB_ORIGIN must be an HTTP(S) origin without a path or credentials.")

ROOT_URLCONF = "VirtualQ.urls"
WSGI_APPLICATION = "VirtualQ.wsgi.application"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.environ.get("DJANGO_DATABASE_PATH", BASE_DIR / "db.local.sqlite3"),
        "TEST": {"NAME": os.environ.get("DJANGO_TEST_DATABASE_PATH")},
        "OPTIONS": {"transaction_mode": "IMMEDIATE", "timeout": 20},
    }
}
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": f"django.contrib.auth.password_validation.{name}"}
    for name in (
        "UserAttributeSimilarityValidator",
        "MinimumLengthValidator",
        "CommonPasswordValidator",
        "NumericPasswordValidator",
    )
]
AUTH_USER_MODEL = "clientApp.CustomUser"
LOGIN_URL = "ticket_login"
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_ROOT = BASE_DIR / "ride_thumbnails"
MEDIA_URL = "/ride_thumbnails/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
DEFAULT_FROM_EMAIL = "virtualq@localhost"
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_RATES": {"auth": "30/min"},
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}
