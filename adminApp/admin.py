from django.contrib import admin
from .models import ParkEmployee


class ParkEmployeeAdmin(admin.ModelAdmin):
    list_display = (
        "first_name",
        "last_name",
        "job_title",
        "park",
        "area",
        "work_place",
        "join_date",
    )
    search_fields = ("first_name", "last_name", "job_title")
    list_filter = ("work_place", "park", "area", "join_date")


admin.site.register(ParkEmployee, ParkEmployeeAdmin)
