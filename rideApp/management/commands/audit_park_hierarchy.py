from django.core.management.base import BaseCommand, CommandError
from django.db import connection, IntegrityError
from django.db.models import F

from adminApp.models import ParkEmployee
from restaurantApp.models import Restaurant
from storeApp.models import Store
from rideApp.models import ThemeParkRide


class Command(BaseCommand):
    help = "Check foreign keys and park/area consistency without changing data."

    def handle(self, *args, **options):
        try:
            connection.check_constraints()
        except IntegrityError as error:
            raise CommandError(f"Broken foreign key: {error}") from error
        failures = 0
        for model, park, area in (
            (ThemeParkRide, "park_id", "area_id"),
            (Restaurant, "park", "area"),
            (Store, "park_id", "area_id"),
            (ParkEmployee, "park", "area"),
        ):
            count = model.objects.exclude(**{park: F(f"{area}__park_id")}).count()
            failures += count
            self.stdout.write(f"{model._meta.label}: {count} park/area mismatches")
        if failures:
            raise CommandError(f"{failures} inconsistent locations; review before moving or deleting records.")
        self.stdout.write(self.style.SUCCESS("Park hierarchy is consistent. No data changed."))
