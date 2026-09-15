from concurrent.futures import ThreadPoolExecutor
from datetime import time, timedelta
from io import StringIO
import base64
from threading import Barrier

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db import close_old_connections, connection
from django.test import TestCase, TransactionTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from queueApp.models import RideReservation
from rideApp.models import ThemeParkRide
from .models import Ticket, Guest


@override_settings(DEBUG=True)
class VisitBookingTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_demo", stdout=StringIO())

    def setUp(self):
        self.user = get_user_model().objects.get(username="demo")
        self.api = APIClient()
        self.api.force_authenticate(self.user)
        self.visit = timezone.localdate() + timedelta(days=1)
        self.tickets = list(Ticket.objects.filter(user=self.user).order_by("guest_number"))

    def book(self, **changes):
        return self.api.post("/api/tickets/tickets/", {
            "date_of_visit": str(self.visit), "additional_guests": 2, **changes,
        }, format="json")

    def test_create_and_repeat_preserve_ticket_codes_and_guest_details(self):
        self.visit += timedelta(days=1)
        created = self.book()
        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(len(created.data), 3)
        guest = Guest.objects.get(ticket_id=created.data[1]["id"])
        guest.name = "Alex"
        guest.height = 165
        guest.save()
        repeated = self.book(user="demo-admin")
        self.assertEqual(repeated.status_code, 200, repeated.data)
        self.assertEqual(created.data, repeated.data)
        guest.refresh_from_db()
        self.assertEqual((guest.name, guest.height), ("Alex", 165))
        self.assertFalse(Ticket.objects.filter(user__username="demo-admin").exists())

    def test_invalid_dates_and_party_limits_do_not_write(self):
        count = Ticket.objects.count()
        for changes in (
            {"date_of_visit": "not-a-date"},
            {"date_of_visit": str(timezone.localdate() - timedelta(days=1))},
            {"additional_guests": -1},
            {"additional_guests": 50},
            {"additional_guests": "many"},
        ):
            with self.subTest(changes=changes):
                self.assertEqual(self.book(**changes).status_code, 400)
        self.assertEqual(Ticket.objects.count(), count)

    def test_reduction_requires_confirmation_and_cancels_only_removed_guests(self):
        reservation = RideReservation.objects.create(
            ticket=self.tickets[2],
            ride=ThemeParkRide.objects.get(ride_name="Python Plunge"),
            date=self.visit, start_time=time(10),
        )
        response = self.book(additional_guests=1)
        self.assertEqual(response.status_code, 400)
        self.assertIn("1 ride reservation", str(response.data))
        self.assertEqual(Ticket.objects.count(), 3)
        self.assertTrue(RideReservation.objects.filter(pk=reservation.pk).exists())
        response = self.book(additional_guests=1, confirm_removal=True)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual([row["id"] for row in response.data], [t.pk for t in self.tickets[:2]])
        self.assertFalse(RideReservation.objects.exists())
        self.assertEqual(Guest.objects.count(), 1)

    def test_admitted_reservations_block_ticket_removal(self):
        RideReservation.objects.create(
            ticket=self.tickets[2],
            ride=ThemeParkRide.objects.get(ride_name="Python Plunge"),
            date=self.visit, start_time=time(10), validated=True,
        )
        self.assertEqual(self.book(additional_guests=0, confirm_removal=True).status_code, 400)
        self.assertEqual(Ticket.objects.count(), 3)

    def test_guest_cannot_be_reassigned_or_given_invalid_measurements(self):
        guest = self.tickets[1].guest
        endpoint = f"/api/tickets/guests/guests/{guest.pk}/"
        vacant = Ticket.objects.create(user=self.user, date_of_visit=self.visit, guest_number=3)
        vacant.guest.delete()
        for changes in (
            {"ticket": self.tickets[0].pk},
            {"ticket": vacant.pk},
            {"height": 0},
            {"height": 301},
            {"age": -1},
        ):
            self.assertEqual(self.api.patch(endpoint, changes, format="json").status_code, 400)
        self.assertEqual(self.api.patch(endpoint, {"name": "Sam", "height": 160, "age": 12}).status_code, 200)
        guest.refresh_from_db()
        self.assertEqual(guest.ticket_id, self.tickets[1].pk)

    def test_web_reduction_uses_the_same_confirmation_rule(self):
        self.client.force_login(self.user)
        response = self.client.post("/api/tickets/book_visit/", {
            "date_of_visit": str(self.visit), "additional_guests": 0,
        })
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Confirm removing")
        self.assertEqual(Ticket.objects.count(), 3)
        response = self.client.post("/api/tickets/book_visit/", {
            "date_of_visit": str(self.visit), "additional_guests": 0, "confirm_removal": "on",
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Ticket.objects.count(), 1)

    def test_ticket_qr_is_png_and_owner_only(self):
        path = f"/api/tickets/tickets/{self.tickets[0].pk}/qr/"
        response = self.api.get(path)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(base64.b64decode(response.data["image"].split(",")[1]).startswith(b"\x89PNG\r\n\x1a\n"))
        self.api.force_authenticate(get_user_model().objects.get(username="demo-admin"))
        self.assertEqual(self.api.get(path).status_code, 404)
        self.api.force_authenticate(None)
        self.assertEqual(self.api.get(path).status_code, 401)

    def test_ticket_lookup_identifies_owner_and_date_without_admitting(self):
        path = "/api/tickets/tickets/validate/"
        ticket = self.tickets[1]
        for offset, state in ((1, "upcoming"), (0, "today"), (-1, "past")):
            Ticket.objects.filter(pk=ticket.pk).update(date_of_visit=timezone.localdate() + timedelta(days=offset))
            response = self.api.post(path, {"ticket_id": f" {ticket.ticket_id} "}, format="json")
            self.assertEqual(response.status_code, 200, response.data)
            self.assertEqual(response.data["ticket"]["id"], ticket.pk)
            self.assertEqual(response.data["visit_status"], state)
            self.assertEqual(response.data["visitor_name"], ticket.guest.name)
            self.assertIn("no-store", response["Cache-Control"])
        self.assertFalse(RideReservation.objects.exists())
        self.api.force_authenticate(get_user_model().objects.get(username="demo-admin"))
        foreign = self.api.post(path, {"ticket_id": ticket.ticket_id}, format="json")
        unknown = self.api.post(path, {"ticket_id": "unknown"}, format="json")
        self.assertEqual(foreign.status_code, 400)
        self.assertEqual(foreign.data, unknown.data)
        self.api.force_authenticate(None)
        self.assertEqual(self.api.post(path, {"ticket_id": ticket.ticket_id}).status_code, 401)

    def test_ticket_lookup_rejects_malformed_and_ambiguous_codes(self):
        path = "/api/tickets/tickets/validate/"
        for data in ({}, {"ticket_id": None}, {"ticket_id": ""}, {"ticket_id": "x" * 201}, {"ticket_id": []}, []):
            with self.subTest(data=data):
                self.assertEqual(self.api.post(path, data, format="json").status_code, 400)
        Ticket.objects.filter(pk=self.tickets[1].pk).update(ticket_id=self.tickets[0].ticket_id)
        self.assertEqual(self.api.post(path, {"ticket_id": self.tickets[0].ticket_id}).status_code, 400)

    def test_malformed_filters_return_validation_errors(self):
        for date in ("2026-02-30", "yesterday", ""):
            self.assertEqual(self.api.get("/api/tickets/tickets-view/", {"date_of_visit": date}).status_code, 400)
        for ticket_id in ("hello", -1, ""):
            self.assertEqual(self.api.get("/api/tickets/guests/guest-view/", {"ticket_id": ticket_id}).status_code, 400)


@override_settings(DEBUG=True)
class ConcurrentVisitBookingTest(TransactionTestCase):
    def test_repeated_simultaneous_requests_reuse_the_same_tickets(self):
        if connection.vendor == "sqlite" and "mode=memory" in connection.settings_dict["NAME"]:
            self.skipTest("Run with DJANGO_TEST_DATABASE_PATH for SQLite's file-lock/timeout behavior.")
        call_command("seed_demo", stdout=StringIO())
        user_id = get_user_model().objects.get(username="demo").pk
        visit = timezone.localdate() + timedelta(days=2)
        barrier = Barrier(2)

        def attempt(_):
            close_old_connections()
            try:
                api = APIClient()
                api.force_authenticate(get_user_model().objects.get(pk=user_id))
                barrier.wait(timeout=10)
                response = api.post("/api/tickets/tickets/", {
                    "date_of_visit": str(visit), "additional_guests": 2,
                }, format="json")
                return response.status_code, [row["id"] for row in response.data]
            finally:
                close_old_connections()

        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(attempt, range(2)))
        self.assertEqual(sorted(status for status, _ in results), [200, 201])
        self.assertEqual(results[0][1], results[1][1])
        self.assertEqual(Ticket.objects.filter(user_id=user_id, date_of_visit=visit).count(), 3)
