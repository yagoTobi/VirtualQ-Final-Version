from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from .models import Ticket

MAX_ADDITIONAL_GUESTS = 49


@transaction.atomic
def set_visit_party(user, date_of_visit, additional_guests=0, confirm_removal=False):
    """Create/reuse one ticket per party position, preserving existing details."""
    if date_of_visit < timezone.localdate():
        raise ValidationError({"date_of_visit": "The date of visit cannot be in the past."})
    if not 0 <= additional_guests <= MAX_ADDITIONAL_GUESTS:
        raise ValidationError({"additional_guests": "Choose between 0 and 49 additional guests."})

    # The account lock also covers a new date with no existing ticket rows to lock.
    get_user_model().objects.select_for_update().get(pk=user.pk)
    existing = list(Ticket.objects.select_for_update().filter(
        user=user, date_of_visit=date_of_visit
    ).order_by("guest_number", "pk"))
    by_number = {}
    for ticket in existing:
        number = ticket.guest_number if ticket.guest_number is not None else 0
        if number < 0 or number in by_number:
            raise ValidationError("This visit has duplicate or invalid ticket positions. Ask staff to review it.")
        by_number[number] = ticket

    removed = [ticket for number, ticket in by_number.items() if number > additional_guests]
    if removed:
        from queueApp.models import RideReservation

        reservations = RideReservation.objects.filter(ticket__in=removed)
        if reservations.filter(validated=True).exists():
            raise ValidationError("Tickets with admitted ride reservations cannot be removed.")
        if not confirm_removal:
            raise ValidationError({
                "confirm_removal": f"Confirm removing {len(removed)} ticket(s) and cancelling "
                f"{reservations.count()} ride reservation(s)."
            })
        Ticket.objects.filter(pk__in=[ticket.pk for ticket in removed]).delete()

    created = False
    for number in range(additional_guests + 1):
        if number not in by_number:
            Ticket.objects.create(user=user, date_of_visit=date_of_visit, guest_number=number)
            created = True
    return list(Ticket.objects.filter(
        user=user, date_of_visit=date_of_visit
    ).select_related("user").order_by("guest_number", "pk")), created
