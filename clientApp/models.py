from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token


class CustomUser(AbstractUser):
    id = models.AutoField(primary_key=True)
    email = models.EmailField("email address", unique=True, blank=False, null=False)
    name = models.CharField(max_length=30, blank=False, null=False, default="Undefined")
    last_name = models.CharField(max_length=150, blank=False, null=False)
    dob = models.DateField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)
