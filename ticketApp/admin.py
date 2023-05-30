from django.contrib import admin
from .models import Ticket, Guest


class TicketAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "date_of_visit",
        "guest_number",
        "ticket_id",
    )
    list_filter = ("date_of_visit", "user")
    search_fields = ("user__email", "ticket_id")


admin.site.register(Ticket, TicketAdmin)


class GuestAdmin(admin.ModelAdmin):
    list_display = (
        "guest_id",
        "ticket",
        "name",
        "age",
        "height",
        "date_of_visit"
    )
    list_filter = ("ticket", "age", "height", "date_of_visit")
    search_fields = ("guest_id", "ticket", "name")


admin.site.register(Guest, GuestAdmin)
