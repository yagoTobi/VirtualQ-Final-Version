import datetime
from django.core.exceptions import ValidationError
from django.db import models, transaction
from rideApp.models import ThemeParkRide
from ticketApp.models import Ticket
from hashlib import sha256
import base64
from django.utils import timezone
from django.utils.crypto import get_random_string


class RideReservation(models.Model):
    reservation_id = models.AutoField(primary_key=True)
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE)
    ride = models.ForeignKey(ThemeParkRide, on_delete=models.CASCADE)
    date = models.DateField(null=True)
    start_time = models.TimeField()
    end_time = models.TimeField(editable=False)
    reservation_ticket_id = models.CharField(max_length=200, editable=False, null=True)
    validated = models.BooleanField(default=False)

    def clean(self):
        super().clean()
        if not all((self.ticket_id, self.ride_id, self.date, self.start_time)):
            raise ValidationError("Choose a ticket, ride, date and time.")

        previous = type(self).objects.filter(pk=self.pk).first() if self.pk else None
        if previous and all(
            getattr(self, field) == getattr(previous, field)
            for field in ("ticket_id", "ride_id", "date", "start_time")
        ):
            # Admission/status edits must preserve the original booked duration.
            self.end_time = previous.end_time
            return
        if previous and previous.validated:
            raise ValidationError("An admitted reservation cannot be rescheduled.")

        ride, ticket = self.ride, self.ticket
        start = datetime.datetime.combine(self.date, self.start_time)
        end = start + datetime.timedelta(minutes=ride.ride_duration)
        if timezone.make_aware(start) <= timezone.now():
            raise ValidationError({"start_time": "Choose a future time."})
        if ticket.date_of_visit != self.date:
            raise ValidationError({"date": "The ticket is not valid for this date."})
        if ride.under_maintenance:
            raise ValidationError({"ride": "The ride is currently under maintenance."})
        if ride.ride_duration <= 0 or ride.ride_capacity <= 0:
            raise ValidationError({"ride": "This ride is not available for booking."})
        if (
            end.date() != self.date
            or self.start_time < ride.opening_hour
            or end.time() > ride.closing_hour
        ):
            raise ValidationError({"start_time": "The entire ride must fit within opening hours."})

        if ticket.guest_number:
            height = getattr(getattr(ticket, "guest", None), "height", None)
        else:
            height = ticket.user.height
        if ride.height_restriction and (height is None or height < ride.height_restriction):
            raise ValidationError({"ticket": f"This visitor must have a recorded height of at least {ride.height_restriction} cm."})

        overlapping = type(self).objects.filter(
            date=self.date, start_time__lt=end.time(), end_time__gt=self.start_time,
        ).exclude(pk=self.pk)
        if overlapping.filter(ticket=ticket).exists():
            raise ValidationError({"start_time": "This visitor already has an overlapping reservation."})

        # Count peak simultaneous riders; adjacent intervals do not consume a
        # seat together, even when historical bookings have different durations.
        events = []
        for other_start, other_end in overlapping.filter(ride=ride).values_list("start_time", "end_time"):
            events.extend(((max(self.start_time, other_start), 1), (min(end.time(), other_end), -1)))
        occupied = 0
        for _, delta in sorted(events):
            occupied += delta
            if occupied >= ride.ride_capacity:
                raise ValidationError({"start_time": "This time is full. Choose another time."})
        self.end_time = end.time()

    def _generate_reservation_ticket_id(self):
        data = f"{self.ticket.user.email}_{self.ticket.ticket_id}_{self.start_time}"
        random_secret = get_random_string(12)
        return base64.urlsafe_b64encode(
            sha256(f"{data}_{random_secret}".encode()).digest()
        ).decode()

    @transaction.atomic
    def save(self, *args, **kwargs):
        # SQLite uses IMMEDIATE transactions. Row locks also serialize this
        # ticket's conflicts and this ride's capacity on row-locking databases.
        self.ticket = Ticket.objects.select_for_update().get(pk=self.ticket_id)
        self.ride = ThemeParkRide.objects.select_for_update().get(pk=self.ride_id)
        self.clean()
        if not self.reservation_ticket_id:
            self.reservation_ticket_id = self._generate_reservation_ticket_id()
        if kwargs.get("update_fields"):
            kwargs["update_fields"] = set(kwargs["update_fields"]) | {"end_time", "reservation_ticket_id"}
        super().save(*args, **kwargs)
