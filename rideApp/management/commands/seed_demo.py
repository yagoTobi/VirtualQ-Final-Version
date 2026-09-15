from datetime import date, time, timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from rideApp.models import ThemePark, ThemeParkArea, ThemeParkRide
from ticketApp.models import Ticket, Guest


class Command(BaseCommand):
    help = "Create local demo accounts, rides, and tomorrow's tickets (safe to rerun)."

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("Demo data is only available with DEBUG=true.")

        User = get_user_model()
        for username, staff in (("demo", False), ("demo-admin", True)):
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@example.test",
                    "name": "Demo",
                    "last_name": "Visitor",
                    "dob": date(1990, 1, 1),
                    "height": 170,
                    "is_staff": staff,
                    "is_superuser": staff,
                },
            )
            if created:
                user.set_password("VirtualQ-demo-2026!")
                user.save()

        park, _ = ThemePark.objects.get_or_create(park_name="Virtual Q Demo Park")
        area, _ = ThemeParkArea.objects.get_or_create(
            park_id=park, area_name="Technology Land"
        )
        for name, image, maintenance in (
            ("Python Plunge", "PythonPlunge.jpg", False),
            ("Java Jamboree", "JavaJamboree.jpg", False),
            ("Looping Logic", "LoopingLogic.jpg", True),
        ):
            ThemeParkRide.objects.get_or_create(
                ride_name=name,
                park_id=park,
                defaults={
                    "ride_description": f"Explore {name} at our demo park.",
                    "ride_thumbnail": f"media/ride_thumbnails/{image}",
                    "area_id": area,
                    "height_restriction": 120,
                    "ride_capacity": 20,
                    "ride_duration": 5,
                    "opening_hour": time(9),
                    "closing_hour": time(20),
                    "under_maintenance": maintenance,
                    "ride_type": "ROLLER_COASTER",
                    "age_restriction": "ADULTS",
                },
            )

        visitor = User.objects.get(username="demo")
        visit = date.today() + timedelta(days=1)
        for number in range(3):
            ticket, _ = Ticket.objects.get_or_create(
                user=visitor, date_of_visit=visit, guest_number=number
            )
            if number:
                Guest.objects.filter(ticket=ticket, name="Visitor").update(
                    name=f"Guest {number}", age=25, height=170
                )

        self.stdout.write(self.style.SUCCESS(
            f"Demo ready. Tickets: {visit}. Accounts: demo / demo-admin. "
            "Initial password: VirtualQ-demo-2026! Existing passwords are unchanged."
        ))
