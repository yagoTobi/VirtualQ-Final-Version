from django.db import models, router, transaction
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

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        database = using or router.db_for_write(type(self), instance=self)
        with transaction.atomic(using=database):
            password_changed = False
            if self.pk and (update_fields is None or "password" in update_fields):
                previous = (
                    type(self).objects.using(database).select_for_update()
                    .filter(pk=self.pk).values_list("password", flat=True).first()
                )
                password_changed = previous is not None and previous != self.password
            result = super().save(
                force_insert=force_insert, force_update=force_update,
                using=database, update_fields=update_fields,
            )
            if password_changed:
                Token.objects.using(database).filter(user_id=self.pk).delete()
            return result


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, using=None, **kwargs):
    if created:
        Token.objects.using(using).create(user=instance)
