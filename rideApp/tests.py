from datetime import date, timedelta
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from queueApp.models import RideReservation
from ticketApp.models import Ticket, Guest
from .models import ThemeParkRide


@override_settings(DEBUG=True)
class LocalDemoTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_demo", stdout=StringIO())

    def setUp(self):
        self.user = get_user_model().objects.get(username="demo")
        self.api = APIClient()
        login = self.api.post(reverse("login"), {
            "username": "demo", "password": "VirtualQ-demo-2026!"
        })
        self.assertEqual(login.status_code, 200)
        self.api.credentials(HTTP_AUTHORIZATION=f'Token {login.data["token"]}')
        self.ticket = Ticket.objects.get(user=self.user, guest_number=0)
        self.ride = ThemeParkRide.objects.get(ride_name="Python Plunge")
        self.reservation = {
            "ticket": self.ticket.pk,
            "ride": self.ride.pk,
            "date": str(self.ticket.date_of_visit),
            "start_time": "10:00:00",
        }

    def test_demo_is_repeatable_without_resetting_passwords(self):
        self.user.set_password("changed-password")
        self.user.save()
        call_command("seed_demo", stdout=StringIO())
        self.assertEqual(ThemeParkRide.objects.count(), 3)
        self.assertEqual(Ticket.objects.count(), 3)
        self.assertEqual(Guest.objects.count(), 2)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("changed-password"))

    def test_browse_book_view_validate_and_cancel(self):
        self.assertEqual(self.client.get(
            "/api/parkRides/theme_park_rides/?ride_type=ROLLER_COASTER"
        ).status_code, 200)
        self.assertEqual(len(self.api.get("/api/tickets/tickets-view/").data), 3)
        self.assertEqual(len(self.api.get("/api/tickets/guests/guests/").data), 2)
        created = self.api.post("/api/queue/reservations/", [self.reservation], format="json")
        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(created.data[0]["end_time"], "10:05:00")
        listing = self.api.get("/api/queue/reservations/", {
            "date": self.reservation["date"], "hour": "10"
        })
        self.assertEqual(len(listing.data), 1)
        validation = self.api.post(reverse("validate_ticket"), {
            "ticket_id": self.ticket.ticket_id
        })
        self.assertEqual(validation.status_code, 200)
        pk = created.data[0]["reservation_id"]
        self.assertEqual(self.api.delete(f"/api/queue/reservations/{pk}/").status_code, 204)

    def test_invalid_batch_rolls_back_and_duplicates_return_400(self):
        invalid = {**self.reservation, "ticket": -1}
        response = self.api.post("/api/queue/reservations/", [self.reservation, invalid], format="json")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(RideReservation.objects.exists())
        self.api.post("/api/queue/reservations/", self.reservation, format="json")
        response = self.api.post("/api/queue/reservations/", self.reservation, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(RideReservation.objects.count(), 1)

    def test_maintenance_and_wrong_visit_date_are_rejected(self):
        closed = ThemeParkRide.objects.get(under_maintenance=True)
        for invalid in (
            {**self.reservation, "ride": closed.pk},
            {**self.reservation, "date": str(date.today() + timedelta(days=3))},
        ):
            response = self.api.post("/api/queue/reservations/", invalid, format="json")
            self.assertEqual(response.status_code, 400)
        self.assertFalse(RideReservation.objects.exists())

    def test_accounts_cannot_use_each_others_tickets(self):
        other = get_user_model().objects.get(username="demo-admin")
        self.api.force_authenticate(user=other)
        self.assertEqual(self.api.get("/api/tickets/guests/guests/").data, [])
        self.assertEqual(self.api.post(reverse("validate_ticket"), {
            "ticket_id": self.ticket.ticket_id
        }).status_code, 400)
        self.assertEqual(self.api.post("/api/queue/reservations/", self.reservation, format="json").status_code, 400)
        self.api.force_authenticate(user=self.user)
        created = self.api.post("/api/queue/reservations/", self.reservation, format="json")
        self.api.force_authenticate(user=other)
        self.assertEqual(self.api.get("/api/queue/reservations/").data, [])
        pk = created.data[0]["reservation_id"]
        self.assertEqual(self.api.delete(f"/api/queue/reservations/{pk}/").status_code, 404)

    def test_web_ticket_booking_and_admin_login(self):
        response = self.client.get(reverse("book_visit"))
        self.assertRedirects(response, reverse("ticket_login") + "?next=" + reverse("book_visit"))
        self.client.force_login(self.user)
        response = self.client.post(reverse("book_visit"), {
            "date_of_visit": str(date.today() + timedelta(days=2)),
            "additional_guests": 1,
        })
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "data:image")
        ticket = Ticket.objects.filter(user=self.user, guest_number=1).first()
        ticket.save()
        self.assertEqual(Guest.objects.filter(ticket=ticket).count(), 1)
        self.assertRedirects(self.client.get(reverse("ticket_logout")), reverse("ticket_login"))
        self.client.force_login(get_user_model().objects.get(username="demo-admin"))
        self.assertEqual(self.client.get("/admin/").status_code, 200)

    def test_catalog_writes_require_staff_and_model_permission(self):
        from django.contrib.auth.models import Permission
        endpoint = f"/api/parkRides/theme_park_rides/{self.ride.pk}/"
        self.assertEqual(self.client.patch(endpoint, data='{"under_maintenance": true}',
                                           content_type="application/json").status_code, 401)
        self.assertEqual(self.api.patch(endpoint, {"under_maintenance": True}).status_code, 403)
        self.user.is_staff = True
        self.user.save()
        self.assertEqual(self.api.patch(endpoint, {"under_maintenance": True}).status_code, 403)
        self.user.user_permissions.add(Permission.objects.get(codename="change_themeparkride"))
        self.assertEqual(self.api.patch(endpoint, {"under_maintenance": True}).status_code, 200)
        self.ride.refresh_from_db()
        self.assertTrue(self.ride.under_maintenance)
        # A ride editor cannot read employee records without that separate permission.
        self.assertEqual(self.api.get("/api/employees/employees/").status_code, 403)
