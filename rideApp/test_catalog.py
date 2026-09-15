from datetime import date, time, timedelta
from decimal import Decimal
from io import StringIO

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework.exceptions import ValidationError as APIValidationError

from adminApp.models import ParkEmployee
from adminApp.serializers import ParkEmployeeSerializer
from queueApp.models import RideReservation
from restaurantApp.models import Restaurant
from restaurantApp.serializers import RestaurantSerializer
from storeApp.models import Product, Store
from storeApp.serializers import ProductSerializer, StoreSerializer
from ticketApp.models import Ticket
from .models import ThemePark, ThemeParkArea, ThemeParkRide
from .serializers import ThemeParkAreaSerializer, ThemeParkRideSerializer


@override_settings(DEBUG=True)
class CatalogIntegrityTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_demo", stdout=StringIO())
        cls.ride = ThemeParkRide.objects.get(ride_name="Python Plunge")
        cls.other_park = ThemePark.objects.create(park_name="Second park")
        cls.other_area = ThemeParkArea.objects.create(area_name="Second area", park_id=cls.other_park)
        cls.store = Store.objects.create(
            park_id=cls.ride.park_id, area_id=cls.ride.area_id, store_name="Demo shop",
            store_description="Souvenirs", store_thumbnail="demo/shop.png",
            opening_hour=time(9), closing_hour=time(20),
        )
        cls.product = Product.objects.create(
            store=cls.store, product_name="Demo cap", product_description="Cap",
            product_image="demo/cap.png", product_price=Decimal("5.00"),
        )
        cls.restaurant = Restaurant.objects.create(
            park=cls.ride.park_id, area=cls.ride.area_id, name="Demo cafe",
            brief_text="Cafe", long_description="Cafe", thumbnail="demo/cafe.png",
            restaurant_types="cafe", opening_hour=time(9), closing_hour=time(20),
        )
        cls.employee = ParkEmployee.objects.create(
            park=cls.ride.park_id, area=cls.ride.area_id, first_name="Demo", last_name="Staff",
            date_of_birth=date(1990, 1, 1), join_date=date(2020, 1, 1),
            shift_start=time(22), shift_end=time(6), gender="O", work_place="ride", job_title="Operator",
        )

    def setUp(self):
        self.api = APIClient()
        self.api.force_authenticate(get_user_model().objects.get(username="demo-admin"))

    def test_partial_catalog_writes_validate_the_combined_record(self):
        for instance, serializer_class, field in (
            (self.ride, ThemeParkRideSerializer, "area_id"),
            (self.store, StoreSerializer, "area_id"),
            (self.restaurant, RestaurantSerializer, "area"),
            (self.employee, ParkEmployeeSerializer, "area"),
        ):
            with self.subTest(model=type(instance).__name__):
                serializer = serializer_class(instance, data={field: self.other_area.pk}, partial=True)
                self.assertFalse(serializer.is_valid())
                self.assertIn(field, serializer.errors)
                # Validation must not mutate an instance being used elsewhere.
                self.assertNotEqual(getattr(instance, f"{field}_id"), self.other_area.pk)
        endpoint = f"/api/parkRides/theme_park_rides/{self.ride.pk}/"
        self.assertEqual(self.api.patch(endpoint, {"park_id": self.other_park.pk}).status_code, 400)
        moved = self.api.patch(endpoint, {"park_id": self.other_park.pk, "area_id": self.other_area.pk})
        self.assertEqual(moved.status_code, 200, moved.data)

    def test_ride_bounds_and_area_moves_are_checked_in_api_and_model(self):
        endpoint = f"/api/parkRides/theme_park_rides/{self.ride.pk}/"
        for data in (
            {"ride_capacity": 0}, {"ride_duration": 0}, {"ride_duration": 10000},
            {"height_restriction": 301}, {"closing_hour": "08:00"},
            {"opening_hour": "20:00"},
        ):
            with self.subTest(data=data):
                response = self.api.patch(endpoint, data)
                self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(self.ride.park_open_hours(), timedelta(hours=11))
        area = self.ride.area_id
        area.park_id = self.other_park
        with self.assertRaises(ValidationError):
            area.clean()

    def test_prices_venue_hours_and_employee_dates(self):
        serializer = ProductSerializer(self.product, data={"product_price": "-0.01"}, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn("product_price", serializer.errors)
        for instance, serializer_class in ((self.store, StoreSerializer), (self.restaurant, RestaurantSerializer)):
            serializer = serializer_class(instance, data={"closing_hour": "09:00"}, partial=True)
            self.assertFalse(serializer.is_valid())
        for data in (
            {"date_of_birth": str(timezone.localdate() + timedelta(days=1))},
            {"join_date": "1989-01-01"},
        ):
            self.assertFalse(ParkEmployeeSerializer(self.employee, data=data, partial=True).is_valid())
        # Closing-time rules must not prohibit overnight employee shifts.
        self.employee.full_clean()

    def test_parent_delete_requires_dependent_permissions_and_confirmation(self):
        staff = get_user_model().objects.create_user(username="park-editor", is_staff=True)
        staff.user_permissions.add(Permission.objects.get(codename="delete_themepark"))
        self.api.force_authenticate(staff)
        endpoint = f"/api/parkRides/theme_parks/{self.ride.park_id_id}/"
        response = self.api.delete(endpoint + "?confirm=true")
        self.assertEqual(response.status_code, 403, response.data)
        self.assertTrue(ThemeParkRide.objects.filter(pk=self.ride.pk).exists())
        self.api.force_authenticate(get_user_model().objects.get(username="demo-admin"))
        response = self.api.delete(endpoint)
        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("affected", response.data)
        response = self.api.delete(endpoint + "?confirm=true")
        self.assertEqual(response.status_code, 204, response.data)

    def test_catalog_delete_preserves_admitted_reservation_history(self):
        ticket = Ticket.objects.get(user__username="demo", guest_number=0)
        reservation = RideReservation.objects.create(
            ticket=ticket, ride=self.ride, date=ticket.date_of_visit, start_time=time(10),
        )
        RideReservation.objects.filter(pk=reservation.pk).update(validated=True)
        response = self.api.delete(f"/api/parkRides/theme_park_rides/{self.ride.pk}/?confirm=true")
        self.assertEqual(response.status_code, 400, response.data)
        self.assertTrue(RideReservation.objects.filter(pk=reservation.pk).exists())

    def test_saving_rechecks_an_area_moved_after_form_validation(self):
        area = ThemeParkArea.objects.create(area_name="Empty area", park_id=self.ride.park_id)
        serializer = StoreSerializer(self.store, data={"area_id": area.pk}, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        area.park_id = self.other_park
        area.save()
        with self.assertRaises(APIValidationError):
            serializer.save()
        self.store.refresh_from_db()
        self.assertNotEqual(self.store.area_id_id, area.pk)

    def test_area_move_is_rechecked_after_a_child_is_added(self):
        area = ThemeParkArea.objects.create(area_name="Empty area", park_id=self.ride.park_id)
        serializer = ThemeParkAreaSerializer(area, data={"park_id": self.other_park.pk}, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.store.area_id = area
        self.store.save()
        with self.assertRaises(APIValidationError):
            serializer.save()
        area.refresh_from_db()
        self.assertEqual(area.park_id_id, self.store.park_id_id)

    def test_hierarchy_audit_detects_bulk_import_mismatches_without_repairing_data(self):
        call_command("audit_park_hierarchy", stdout=StringIO())
        Store.objects.filter(pk=self.store.pk).update(area_id=self.other_area)
        with self.assertRaises(CommandError):
            call_command("audit_park_hierarchy", stdout=StringIO())
        self.store.refresh_from_db()
        self.assertEqual(self.store.area_id_id, self.other_area.pk)
