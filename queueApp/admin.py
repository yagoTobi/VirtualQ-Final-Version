from django.contrib import admin
from .models import RideReservation


class QueueAdminArea(admin.AdminSite):
    site_header = "Queueing Manager Area"


class RideReservationAdmin(admin.ModelAdmin):
    list_display = (
        "ride",
        "start_time",
        "reservation_id",
        "end_time",
        "validated",
        "ticket",
    )
    search_fields = (
        "ticket__user__email",
        "ride__ride_name",  # assuming ride_name exists in ride model
        "start_time",
        "reservation_id",
    )
    list_filter = (
        "ticket",  # this will allow filtering by ticket id
        "ride",
        "start_time",
        "end_time",
        "reservation_id",
        "validated",
    )

admin.site.register(RideReservation, RideReservationAdmin)