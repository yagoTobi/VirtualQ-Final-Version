from concurrent.futures import ThreadPoolExecutor
from datetime import time, timedelta
from io import StringIO
from threading import Barrier

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.db import close_old_connections, connection
from django.test import TestCase, TransactionTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from rideApp.models import ThemeParkRide
from ticketApp.models import Ticket
from .models import RideReservation


@override_settings(DEBUG=True)
class ReservationRulesTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_demo", stdout=StringIO())

    def setUp(self):
        self.user = get_user_model().objects.get(username="demo")
        self.api = APIClient()
        self.api.force_authenticate(self.user)
        self.ride = ThemeParkRide.objects.get(ride_name="Python Plunge")
        self.tickets = list(Ticket.objects.filter(user=self.user).order_by("guest_number"))
        self.payload = {
            "ticket": self.tickets[0].pk,
            "ride": self.ride.pk,
            "date": str(self.tickets[0].date_of_visit),
            "start_time": "10:00:00",
        }

    def book(self, **changes):
        return self.api.post("/api/queue/reservations/", {**self.payload, **changes}, format="json")

    def test_opening_closing_dates_and_missing_height(self):
        for changes in (
            {"start_time": "08:59:00"},
            {"start_time": "19:56:00"},
            {"date": None},
            {"date": str(timezone.localdate() - timedelta(days=1))},
        ):
            with self.subTest(changes=changes):
                self.assertEqual(self.book(**changes).status_code, 400)
        self.user.height = None
        self.user.save()
        self.assertEqual(self.book().status_code, 400)
        self.user.height = 170
        self.user.save()
        self.assertEqual(self.book(start_time="09:00:00").status_code, 201)
        self.assertEqual(self.book(start_time="19:55:00").status_code, 201)

    def test_overlap_across_rides_and_adjacent_bookings(self):
        self.assertEqual(self.book().status_code, 201)
        second = ThemeParkRide.objects.get(ride_name="Java Jamboree")
        self.assertEqual(self.book(ride=second.pk, start_time="10:04:00").status_code, 400)
        self.assertEqual(self.book(ride=second.pk, start_time="10:05:00").status_code, 201)

    def test_capacity_batch_rollback_and_released_seat(self):
        self.ride.ride_capacity = 1
        self.ride.save()
        batch = [{**self.payload, "ticket": ticket.pk} for ticket in self.tickets[:2]]
        response = self.api.post("/api/queue/reservations/", batch, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(RideReservation.objects.exists())
        first = self.book()
        self.assertEqual(first.status_code, 201)
        self.assertEqual(self.book(ticket=self.tickets[1].pk).status_code, 400)
        pk = first.data[0]["reservation_id"]
        self.assertEqual(self.api.delete(f"/api/queue/reservations/{pk}/").status_code, 204)
        self.assertEqual(self.book(ticket=self.tickets[1].pk).status_code, 201)

    def test_capacity_counts_peak_not_total_intersections(self):
        self.ride.ride_capacity = 2
        self.ride.save()
        self.assertEqual(self.book().status_code, 201)
        self.assertEqual(self.book(ticket=self.tickets[1].pk, start_time="10:05:00").status_code, 201)
        # Two adjacent bookings consume only one existing seat at any instant.
        self.assertEqual(self.book(ticket=self.tickets[2].pk, start_time="10:02:00").status_code, 201)

    def test_update_rechecks_rules_and_clients_cannot_admit_themselves(self):
        created = self.book(validated=True, end_time="23:00:00")
        self.assertEqual(created.status_code, 201)
        self.assertFalse(created.data[0]["validated"])
        self.assertEqual(created.data[0]["end_time"], "10:05:00")
        pk = created.data[0]["reservation_id"]
        endpoint = f"/api/queue/reservations/{pk}/"
        for changes in ({"start_time": "08:00:00"}, {"date": None}):
            self.assertEqual(self.api.patch(endpoint, changes, format="json").status_code, 400)
        self.ride.under_maintenance = True
        self.ride.save()
        self.assertEqual(self.api.patch(endpoint, {"start_time": "11:00:00"}).status_code, 400)
        booking = RideReservation.objects.get(pk=pk)
        self.assertEqual(booking.start_time, time(10))
        self.assertEqual(booking.date, self.tickets[0].date_of_visit)

    def test_model_and_admin_path_enforces_booking_rules(self):
        with self.assertRaises(ValidationError):
            RideReservation.objects.create(
                ticket=self.tickets[0], ride=self.ride,
                date=self.tickets[0].date_of_visit, start_time=time(22),
            )
        booking = RideReservation.objects.create(
            ticket=self.tickets[0], ride=self.ride,
            date=self.tickets[0].date_of_visit, start_time=time(10),
        )
        self.ride.ride_duration = 20
        self.ride.save()
        booking.validated = True
        booking.save(update_fields=["validated"])
        booking.refresh_from_db()
        self.assertEqual(booking.end_time, time(10, 5))
        booking.start_time = time(11)
        with self.assertRaises(ValidationError):
            booking.save()

    def test_same_day_past_time_and_bad_filters(self):
        earlier = timezone.now() - timedelta(minutes=1)
        Ticket.objects.filter(pk=self.tickets[0].pk).update(date_of_visit=earlier.date())
        self.assertEqual(self.book(date=str(earlier.date()), start_time=earlier.strftime("%H:%M:%S")).status_code, 400)
        for query in ({"date": "invalid"}, {"hour": "99"}, {"hour": "no"}):
            self.assertEqual(self.api.get("/api/queue/reservations/", query).status_code, 400)


@override_settings(DEBUG=True)
class ConcurrentReservationTest(TransactionTestCase):
    def test_two_connections_compete_for_the_last_seat(self):
        if connection.vendor == "sqlite" and "mode=memory" in connection.settings_dict["NAME"]:
            self.skipTest("Run with DJANGO_TEST_DATABASE_PATH for SQLite's file-lock/timeout behavior.")
        call_command("seed_demo", stdout=StringIO())
        ride = ThemeParkRide.objects.get(ride_name="Python Plunge")
        ride.ride_capacity = 1
        ride.save()
        tickets = list(Ticket.objects.filter(user__username="demo").order_by("pk")[:2])
        barrier = Barrier(2)

        def attempt(ticket):
            close_old_connections()
            try:
                api = APIClient()
                api.force_authenticate(get_user_model().objects.get(pk=ticket.user_id))
                barrier.wait(timeout=10)
                return api.post("/api/queue/reservations/", {
                    "ticket": ticket.pk, "ride": ride.pk,
                    "date": str(ticket.date_of_visit), "start_time": "10:00:00",
                }, format="json").status_code
            finally:
                close_old_connections()

        with ThreadPoolExecutor(max_workers=2) as pool:
            statuses = list(pool.map(attempt, tickets))
        self.assertEqual(sorted(statuses), [201, 400])
        self.assertEqual(RideReservation.objects.count(), 1)
