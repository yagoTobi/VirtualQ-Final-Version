from django.db import models
from django.conf import settings
from django.utils.crypto import get_random_string
from hashlib import sha256
import base64


class Ticket(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date_of_visit = models.DateField()
    guest_number = models.IntegerField(null=True, blank=True)
    ticket_id = models.CharField(max_length=200, editable=False)  # Relational target

    def _generate_ticket(self, guest_number):
        guest_number_str = str(guest_number) if guest_number is not 0 else "0"
        data = f"{self.user.email}_{self.date_of_visit}_{guest_number_str}"
        random_secret = get_random_string(12)
        return base64.urlsafe_b64encode(
            sha256(f"{data}_{random_secret}".encode()).digest()
        ).decode()

    def save(self, *args, **kwargs):
        if not self.ticket_id:
            self.ticket_id = self._generate_ticket(self.guest_number)
        super().save(*args, **kwargs)
        # Create guest if guest_number > 0
        if self.guest_number > 0:
            Guest.objects.create(ticket=self)


class Guest(models.Model):
    PICTURE_CHOICES = [
        ("boy_1", "Boy 1"),
        ("boy_2", "Boy 2"),
        ("boy", "Boy"),
        ("catwoman", "Catwoman"),
        ("girl_1", "Girl 1"),
        ("girl_2", "Girl 2"),
        ("girl", "Girl"),
        ("punk", "Punk"),
        ("woman", "Woman"),
    ]

    guest_id = models.AutoField(primary_key=True)
    ticket = models.OneToOneField(
        Ticket, on_delete=models.CASCADE, related_name="guest"
    )
    name = models.CharField(max_length=20, blank=True, null=True)
    age = models.IntegerField(null=True, blank=True)
    picture = models.CharField(
        max_length=10, choices=PICTURE_CHOICES, blank=True, null=True
    )
    height = models.IntegerField(null=True, blank=True)
    date_of_visit = models.DateField(null=True, editable=False)

    def save(self, *args, **kwargs):
        self.date_of_visit = self.ticket.date_of_visit
        super().save(*args, **kwargs)
