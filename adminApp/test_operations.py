from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, time, timedelta
from io import BytesIO, StringIO
from threading import Barrier
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core.management import call_command
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import close_old_connections, connection
from django.test import TestCase, TransactionTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from PIL import Image

from queueApp.models import RideReservation
from rideApp.models import ThemePark, ThemeParkRide
from ticketApp.models import Guest, Ticket


@override_settings(DEBUG=True)
class OperationsTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_demo", stdout=StringIO())
        cls.admin = get_user_model().objects.get(username="demo-admin")
        cls.visitor = get_user_model().objects.get(username="demo")
        cls.ride = ThemeParkRide.objects.get(ride_name="Python Plunge")
        cls.ticket = Ticket.objects.get(user=cls.visitor, guest_number=0)

    def setUp(self):
        self.api = APIClient()
        self.api.force_authenticate(self.admin)

    def reservation(self):
        return RideReservation.objects.create(
            ticket=self.ticket, ride=self.ride, date=self.ticket.date_of_visit, start_time=time(10),
        )

    def test_staff_and_each_model_permission_are_required(self):
        self.api.force_authenticate(None)
        self.assertEqual(self.api.get("/api/operations/").status_code, 401)
        self.api.force_authenticate(self.visitor)
        self.assertEqual(self.api.get("/api/operations/").status_code, 403)
        staff = get_user_model().objects.create_user(username="park-team", is_staff=True)
        self.api.force_authenticate(staff)
        self.assertEqual(self.api.get("/api/operations/").data["resources"], [])
        self.assertEqual(self.api.get("/api/operations/visitors/").status_code, 403)
        staff.user_permissions.add(*Permission.objects.filter(codename__in=("view_themepark", "add_themepark")))
        self.api.force_authenticate(get_user_model().objects.get(pk=staff.pk))
        index = self.api.get("/api/operations/")
        self.assertEqual([item["key"] for item in index.data["resources"]], ["parks"])
        self.assertEqual(index["Cache-Control"], "private, no-store")
        created = self.api.post("/api/operations/parks/", {"park_name": "New park"})
        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(self.api.patch(f'/api/operations/parks/{created.data["park_id"]}/', {"park_name": "Edited"}).status_code, 403)

    def test_search_pagination_filters_and_form_schema(self):
        listing = self.api.get("/api/operations/rides/", {"search": "Python", "page_size": 1})
        self.assertEqual(listing.status_code, 200, listing.data)
        self.assertEqual(listing.data["count"], 1)
        self.assertEqual(listing.data["results"][0]["ride_id"], self.ride.pk)
        maintenance = self.api.get("/api/operations/rides/", {"under_maintenance": "true"})
        self.assertTrue(all(item["under_maintenance"] for item in maintenance.data["results"]))
        self.assertEqual(self.api.get("/api/operations/tickets/", {"date_of_visit": "wrong"}).status_code, 400)
        for resource in self.api.get("/api/operations/").data["resources"]:
            self.assertTrue(resource["description"])
            response = self.api.get(f'/api/operations/{resource["key"]}/schema/')
            self.assertEqual(response.status_code, 200, response.data)
            self.assertTrue(response.data["fields"][response.data["id_field"]]["read_only"])
        schema = self.api.get("/api/operations/rides/schema/").data
        self.assertEqual(schema["fields"]["park_id"]["resource"], "parks")
        self.assertTrue(schema["fields"]["ride_description"]["multiline"])
        self.assertTrue(schema["fields"]["ride_type"]["choices"])
        self.assertFalse(self.api.get("/api/operations/visitors/schema/").data["permissions"]["change"])

    def test_ticket_creation_dates_and_identity_stay_consistent(self):
        new_date = self.ticket.date_of_visit + timedelta(days=3)
        body = {"user": self.visitor.pk, "date_of_visit": str(new_date), "guest_number": 1}
        created = self.api.post("/api/operations/tickets/", body)
        self.assertEqual(created.status_code, 201, created.data)
        ticket = Ticket.objects.get(pk=created.data["id"])
        guest = Guest.objects.get(ticket=ticket)
        code = ticket.ticket_id
        self.assertEqual(self.api.post("/api/operations/tickets/", body).status_code, 400)
        endpoint = f"/api/operations/tickets/{ticket.pk}/"
        changed = self.api.patch(endpoint, {"date_of_visit": str(new_date + timedelta(days=1))})
        self.assertEqual(changed.status_code, 200, changed.data)
        guest.refresh_from_db()
        ticket.refresh_from_db()
        self.assertEqual(guest.date_of_visit, ticket.date_of_visit)
        self.assertEqual(ticket.ticket_id, code)
        for invalid in ({"user": self.admin.pk}, {"guest_number": 0}, {"date_of_visit": "2000-01-01"}):
            self.assertEqual(self.api.patch(endpoint, invalid).status_code, 400)
        self.reservation()
        self.assertEqual(self.api.patch(f"/api/operations/tickets/{self.ticket.pk}/", {"date_of_visit": str(new_date)}).status_code, 400)

    def test_guest_ticket_requires_guest_add_permission_and_delete_confirmation(self):
        staff = get_user_model().objects.create_user(username="ticket-team", is_staff=True)
        staff.user_permissions.add(Permission.objects.get(codename="add_ticket"))
        self.api.force_authenticate(staff)
        count = Ticket.objects.count()
        response = self.api.post("/api/operations/tickets/", {
            "user": self.visitor.pk, "date_of_visit": str(self.ticket.date_of_visit + timedelta(days=1)),
            "guest_number": 1,
        })
        self.assertEqual(response.status_code, 403, response.data)
        self.assertEqual(Ticket.objects.count(), count)
        self.api.force_authenticate(self.admin)
        guest = Guest.objects.first()
        endpoint = f"/api/operations/tickets/{guest.ticket_id}/"
        preview = self.api.get(endpoint + "delete-preview/")
        self.assertEqual(preview.status_code, 200, preview.data)
        self.assertEqual(sum(item["count"] for item in preview.data["affected"]), 2)
        self.assertEqual(self.api.delete(f"/api/operations/guests/{guest.pk}/").status_code, 400)
        self.assertEqual(self.api.delete(endpoint).status_code, 400)
        self.assertEqual(self.api.delete(endpoint + "?confirm=true").status_code, 204)
        self.assertFalse(Guest.objects.filter(pk=guest.pk).exists())

    def test_staff_reservations_use_existing_capacity_and_ownership_independent_rules(self):
        body = {"ticket": self.ticket.pk, "ride": self.ride.pk, "date": str(self.ticket.date_of_visit), "start_time": "10:00"}
        created = self.api.post("/api/operations/reservations/", body)
        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(self.api.post("/api/operations/reservations/", body).status_code, 400)
        endpoint = f'/api/operations/reservations/{created.data["reservation_id"]}/'
        self.assertFalse(self.api.patch(endpoint, {"validated": True}).data["validated"])
        self.assertEqual(self.api.delete(endpoint).status_code, 204)

    def test_venue_forms_require_content_and_accept_image_uploads(self):
        body = {
            "name": "Test cafe", "brief_text": "Lunch", "long_description": "Cafe",
            "opening_hour": "09:00", "closing_hour": "20:00",
            "park": self.ride.park_id_id, "area": self.ride.area_id_id,
        }
        response = self.api.post("/api/operations/restaurants/", body)
        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("thumbnail", response.data)
        self.assertIn("restaurant_types", response.data)
        image = BytesIO()
        Image.new("RGB", (16, 16), "white").save(image, "PNG")
        with TemporaryDirectory() as directory, override_settings(MEDIA_ROOT=directory):
            body.update(restaurant_types="cafe", thumbnail=SimpleUploadedFile("cafe.png", image.getvalue(), content_type="image/png"))
            response = self.api.post("/api/operations/restaurants/", body, format="multipart")
            self.assertEqual(response.status_code, 201, response.data)
            self.assertIn("cafe.png", response.data["thumbnail"])

    def test_optional_employee_contacts_do_not_collide_as_empty_strings(self):
        body = {
            "first_name": "Test", "last_name": "Operator", "date_of_birth": "1990-01-01",
            "join_date": "2020-01-01", "shift_start": "22:00", "shift_end": "06:00",
            "gender": "O", "park": self.ride.park_id_id, "area": self.ride.area_id_id,
            "work_place": "ride", "job_title": "Operator", "email": "", "phone_number": "",
        }
        for _ in range(2):
            response = self.api.post("/api/operations/employees/", body)
            self.assertEqual(response.status_code, 201, response.data)
            self.assertIsNone(response.data["email"])
            self.assertIsNone(response.data["phone_number"])

    def test_admission_requires_change_permission_current_window_and_eligibility(self):
        reservation = self.reservation()
        endpoint = f"/api/operations/reservations/{reservation.pk}/admit/"
        staff = get_user_model().objects.create_user(username="admission-team", is_staff=True)
        staff.user_permissions.add(Permission.objects.get(codename="add_ridereservation"))
        self.api.force_authenticate(staff)
        self.assertEqual(self.api.post(endpoint).status_code, 403)
        staff.user_permissions.add(Permission.objects.get(codename="change_ridereservation"))
        self.api.force_authenticate(get_user_model().objects.get(pk=staff.pk))
        start = timezone.make_aware(datetime.combine(reservation.date, reservation.start_time))
        self.assertEqual(self.api.post(endpoint).status_code, 400)  # Future visit.
        with patch("django.utils.timezone.localdate", return_value=reservation.date):
            for moment in (start - timedelta(seconds=1), start + timedelta(minutes=5)):
                with patch("django.utils.timezone.now", return_value=moment):
                    self.assertEqual(self.api.post(endpoint).status_code, 400)
            with patch("django.utils.timezone.now", return_value=start + timedelta(minutes=1)):
                ThemeParkRide.objects.filter(pk=self.ride.pk).update(under_maintenance=True)
                self.assertEqual(self.api.post(endpoint).status_code, 400)
                ThemeParkRide.objects.filter(pk=self.ride.pk).update(under_maintenance=False)
                get_user_model().objects.filter(pk=self.visitor.pk).update(height=None)
                self.assertEqual(self.api.post(endpoint).status_code, 400)
                get_user_model().objects.filter(pk=self.visitor.pk).update(height=180)
                for _ in range(2):
                    admitted = self.api.post(endpoint)
                    self.assertEqual(admitted.status_code, 200, admitted.data)
                    self.assertTrue(admitted.data["validated"])
        reservation.refresh_from_db()
        self.assertEqual(reservation.end_time, time(10, 5))
        self.api.force_authenticate(self.admin)
        self.assertEqual(self.api.delete(f"/api/operations/reservations/{reservation.pk}/").status_code, 400)
        self.assertTrue(ThemePark.objects.filter(pk=self.ride.park_id_id).exists())


@override_settings(DEBUG=True)
class ConcurrentAdmissionTest(TransactionTestCase):
    def test_two_admissions_share_one_atomic_transition(self):
        if connection.vendor == "sqlite" and connection.settings_dict["NAME"].startswith("file:memorydb"):
            self.skipTest("Use DJANGO_TEST_DATABASE_PATH for SQLite concurrency checks.")
        call_command("seed_demo", stdout=StringIO())
        admin = get_user_model().objects.get(username="demo-admin")
        ticket = Ticket.objects.get(user__username="demo", guest_number=0)
        ride = ThemeParkRide.objects.get(ride_name="Python Plunge")
        reservation = RideReservation.objects.create(ticket=ticket, ride=ride, date=ticket.date_of_visit, start_time=time(10))
        barrier = Barrier(2)

        def admit():
            close_old_connections()
            try:
                api = APIClient()
                api.force_authenticate(get_user_model().objects.get(pk=admin.pk))
                barrier.wait(timeout=10)
                response = api.post(f"/api/operations/reservations/{reservation.pk}/admit/")
                return response.status_code, response.data
            finally:
                close_old_connections()

        moment = reservation.starts_at() + timedelta(minutes=1)
        with patch("django.utils.timezone.now", return_value=moment), patch("django.utils.timezone.localdate", return_value=reservation.date):
            with ThreadPoolExecutor(max_workers=2) as pool:
                results = list(pool.map(lambda _: admit(), range(2)))
        self.assertEqual([status for status, _ in results], [200, 200], results)
        reservation.refresh_from_db()
        self.assertTrue(reservation.validated)
        self.assertEqual(RideReservation.objects.count(), 1)
