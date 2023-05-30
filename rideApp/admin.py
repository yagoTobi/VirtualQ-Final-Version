from django.contrib import admin
from .models import ThemePark, ThemeParkArea, ThemeParkRide

# Register your models here.


class RideAdminArea(admin.AdminSite):
    site_header = "Ride Manager Area"


class ThemeParkRideAdmin(admin.ModelAdmin):
    list_display = (
        "ride_id",
        "ride_name",
        "area_id",
        "ride_type",
        "ride_capacity",
        "ride_duration",
        "under_maintenance",
        "park_id",
    )
    search_fields = (
        "ride_id",
        "park_id",
        "area_id",
        "ride_name",
        "ride_type",
        "under_maintenance",
        "accessibility_wheelchair_access",
        "accessibility_audio_description",
    )
    list_filter = (
        "ride_id",
        "park_id",
        "area_id",
        "ride_name",
        "ride_type",
        "under_maintenance",
        "accessibility_wheelchair_access",
        "accessibility_audio_description",
    )


class ThemeParkAreaAdmin(admin.ModelAdmin):
    list_display = ("area_id", "area_name", "park_id")
    search_fields = ("area_id", "area_name", "park_id")
    list_filter = ("area_id", "area_name", "park_id")


# Register tables
admin.site.register(ThemePark)
admin.site.register(ThemeParkArea, ThemeParkAreaAdmin)
admin.site.register(ThemeParkRide, ThemeParkRideAdmin)
ride_employee_admin_site = RideAdminArea(name="Ride Administrator")
ride_employee_admin_site.register(ThemeParkRide, ThemeParkRideAdmin)
