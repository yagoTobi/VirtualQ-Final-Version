import datetime
from django.db import models
from rideApp.models import ThemeParkRide
from ticketApp.models import Ticket, Guest
from django.contrib.auth import get_user_model
from hashlib import sha256
import base64
from django.utils.crypto import get_random_string

CustomUser = get_user_model()


class RideReservation(models.Model):
    reservation_id = models.AutoField(primary_key=True)
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE)
    ride = models.ForeignKey(ThemeParkRide, on_delete=models.CASCADE)
    date = models.DateField(null=True)
    start_time = models.TimeField()
    end_time = models.TimeField(editable=False)
    reservation_ticket_id = models.CharField(max_length=200, editable=False, null=True)
    validated = models.BooleanField(default=False)

    def _generate_reservation_ticket_id(self):
        data = f"{self.ticket.user.email}_{self.ticket.ticket_id}_{self.start_time}"
        random_secret = get_random_string(12)
        return base64.urlsafe_b64encode(
            sha256(f"{data}_{random_secret}".encode()).digest()
        ).decode()

    def save(self, *args, **kwargs):
        if not self.reservation_ticket_id:
            self.reservation_ticket_id = self._generate_reservation_ticket_id()

        # Assuming the date for the start time is today
        # Convert TimeField to datetime
        datetime_start = datetime.datetime.combine(
            datetime.date.today(), self.start_time
        )
        # Add the timedelta
        datetime_end = datetime_start + datetime.timedelta(
            minutes=self.ride.ride_duration
        )
        # Convert back to TimeField
        self.end_time = datetime_end.time()
        super().save(*args, **kwargs)
