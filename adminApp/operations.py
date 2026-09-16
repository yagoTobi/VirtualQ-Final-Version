from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.metadata import SimpleMetadata
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.routers import DefaultRouter
from rest_framework.views import APIView

from VirtualQ.deletion import SafeDestroyMixin, deletion_summary
from VirtualQ.permissions import StaffModelPermissions
from queueApp.models import RideReservation
from restaurantApp.models import Restaurant
from restaurantApp.serializers import RestaurantSerializer
from rideApp.models import ThemePark, ThemeParkArea, ThemeParkRide
from rideApp.serializers import ThemeParkSerializer, ThemeParkAreaSerializer, ThemeParkRideSerializer
from storeApp.models import Store, Product
from storeApp.serializers import StoreSerializer, ProductSerializer
from ticketApp.models import Ticket, Guest
from .models import ParkEmployee
from .serializers import ParkEmployeeSerializer
from .operations_serializers import (
    VisitorLookupSerializer, OperationsTicketSerializer,
    OperationsGuestSerializer, OperationsReservationSerializer,
)


class OperationsPermissions(StaffModelPermissions):
    def has_permission(self, request, view):
        if getattr(view, "action", None) == "admit":
            return bool(request.user.is_authenticated and request.user.is_staff
                        and request.user.has_perm("queueApp.change_ridereservation"))
        return super().has_permission(request, view)


class PrivateResponseMixin:
    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "private, no-store"
        return response


class OperationsPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class OperationsViewSet(PrivateResponseMixin, SafeDestroyMixin, viewsets.ModelViewSet):
    permission_classes = [OperationsPermissions]
    pagination_class = OperationsPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering = ("pk",)
    ordering_fields = ("pk",)
    columns = ()
    resource_description = ""
    can_delete = True

    def capabilities(self, user):
        opts = self.queryset.model._meta
        return {
            action: user.has_perm(f"{opts.app_label}.{action}_{opts.model_name}")
            and (action != "delete" or self.can_delete)
            and (action == "view" or "post" in self.http_method_names)
            for action in ("view", "add", "change", "delete")
        }

    @action(detail=False, methods=["get"])
    def schema(self, request):
        serializer = self.get_serializer()
        fields = SimpleMetadata().get_serializer_info(serializer)
        for name, field in serializer.fields.items():
            if name not in fields:
                continue
            fields[name]["multiline"] = field.style.get("base_template") == "textarea.html"
            fields[name]["allow_null"] = field.allow_null
            fields[name]["allow_blank"] = getattr(field, "allow_blank", False)
            fields[name]["immutable"] = (
                self.queryset.model is Ticket and name in ("user", "guest_number")
            ) or (
                self.queryset.model is Guest and name == "ticket"
            )
            if isinstance(field, serializers.PrimaryKeyRelatedField) and field.queryset is not None:
                fields[name]["resource"] = next(
                    (key for key, view in RESOURCES if view.queryset.model is field.queryset.model), None
                )
            if field.default is not serializers.empty and not callable(field.default):
                fields[name]["default"] = field.default
        # Choose a location from the top of the hierarchy before its details.
        parent_order = {"parks": 0, "areas": 1, "stores": 2}
        fields = dict(sorted(fields.items(), key=lambda item: parent_order.get(item[1].get("resource"), 3)))
        return Response({
            "id_field": self.queryset.model._meta.pk.name,
            "fields": fields, "columns": self.columns,
            "filters": getattr(self, "filterset_fields", ()),
            "permissions": self.capabilities(request.user),
        })

    @action(detail=True, methods=["get"], url_path="delete-preview")
    def delete_preview(self, request, pk=None):
        if not self.can_delete:
            raise ValidationError("Remove the associated ticket to remove this guest and its reservations.")
        return Response({"affected": deletion_summary(self.get_object(), request.user)})


class ParkOperations(OperationsViewSet):
    queryset = ThemePark.objects.all()
    serializer_class = ThemeParkSerializer
    search_fields = ("park_name",)
    columns = ("park_name",)
    resource_description = "Park names and the places that belong to them."


class AreaOperations(OperationsViewSet):
    queryset = ThemeParkArea.objects.select_related("park_id")
    serializer_class = ThemeParkAreaSerializer
    search_fields = ("area_name", "park_id__park_name")
    filterset_fields = ("park_id",)
    columns = ("area_name", "park_name")
    resource_description = "Organize each park into areas."


class RideOperations(OperationsViewSet):
    queryset = ThemeParkRide.objects.select_related("area_id", "park_id")
    serializer_class = ThemeParkRideSerializer
    search_fields = ("ride_name", "area_id__area_name", "park_id__park_name")
    filterset_fields = ("park_id", "area_id", "under_maintenance", "ride_type")
    columns = ("ride_name", "area_name", "ride_capacity", "ride_duration", "under_maintenance")
    resource_description = "Manage ride details, availability and maintenance."


class RestaurantOperations(OperationsViewSet):
    queryset = Restaurant.objects.select_related("park", "area")
    serializer_class = RestaurantSerializer
    search_fields = ("name", "restaurant_types", "park__park_name", "area__area_name")
    filterset_fields = ("park", "area")
    columns = ("name", "restaurant_types", "opening_hour", "closing_hour")
    resource_description = "Dining locations, menus and opening hours."


class StoreOperations(OperationsViewSet):
    queryset = Store.objects.select_related("park_id", "area_id")
    serializer_class = StoreSerializer
    search_fields = ("store_name", "park_id__park_name", "area_id__area_name")
    filterset_fields = ("park_id", "area_id")
    columns = ("store_name", "opening_hour", "closing_hour")
    resource_description = "Park shops and their opening hours."


class ProductOperations(OperationsViewSet):
    queryset = Product.objects.select_related("store")
    serializer_class = ProductSerializer
    search_fields = ("product_name", "store__store_name")
    filterset_fields = ("store",)
    columns = ("product_name", "store_name", "product_price")
    resource_description = "Store products, photos and prices."


class EmployeeOperations(OperationsViewSet):
    queryset = ParkEmployee.objects.select_related("park", "area")
    serializer_class = ParkEmployeeSerializer
    search_fields = ("first_name", "last_name", "email", "job_title")
    filterset_fields = ("park", "area", "work_place")
    columns = ("first_name", "last_name", "job_title", "work_place", "shift_start", "shift_end")
    resource_description = "Staff assignments and shifts. Employee records do not grant account access."


class TicketOperations(OperationsViewSet):
    queryset = Ticket.objects.select_related("user", "guest")
    serializer_class = OperationsTicketSerializer
    search_fields = ("user__username", "user__name", "guest__name", "=ticket_id")
    filterset_fields = ("user", "date_of_visit", "guest_number")
    columns = ("visitor_name", "username", "date_of_visit", "guest_number")
    resource_description = "Visit tickets and party members. Existing codes stay unchanged."


class GuestOperations(OperationsViewSet):
    queryset = Guest.objects.select_related("ticket__user")
    serializer_class = OperationsGuestSerializer
    search_fields = ("name", "ticket__user__username")
    filterset_fields = ("ticket", "date_of_visit")
    columns = ("name", "username", "age", "height", "date_of_visit")
    resource_description = "Guest details and eligibility. Remove a guest through their ticket."
    can_delete = False

    def perform_destroy(self, instance):
        raise ValidationError("Remove this guest's ticket to keep the party and reservations consistent.")


class ReservationOperations(OperationsViewSet):
    queryset = RideReservation.objects.select_related("ride", "ticket__user", "ticket__guest")
    serializer_class = OperationsReservationSerializer
    search_fields = ("ride__ride_name", "ticket__user__username", "ticket__guest__name", "=reservation_ticket_id")
    filterset_fields = ("ride", "ticket", "date", "validated")
    columns = ("visitor_name", "ride_name", "date", "start_time", "end_time", "validated")
    resource_description = "Ride bookings and admission. Times use the park time zone."

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def admit(self, request, pk=None):
        selected = self.get_object()
        ticket = get_object_or_404(Ticket.objects.select_for_update(), pk=selected.ticket_id)
        ride = get_object_or_404(ThemeParkRide.objects.select_for_update(), pk=selected.ride_id)
        reservation = get_object_or_404(RideReservation.objects.select_for_update(), pk=selected.pk)
        if (reservation.ticket_id, reservation.ride_id) != (ticket.pk, ride.pk):
            raise ValidationError("This reservation changed. Refresh it before admitting the visitor.")
        if not reservation.validated:
            now = timezone.now()
            if reservation.date != timezone.localdate() or ticket.date_of_visit != reservation.date:
                raise ValidationError("This reservation and its park ticket must be valid today.")
            if not reservation.starts_at() <= now < reservation.ends_at():
                raise ValidationError("Admission is available only during the booked time window.")
            if ride.under_maintenance:
                raise ValidationError("This ride is under maintenance.")
            height = getattr(getattr(ticket, "guest", None), "height", None) if ticket.guest_number else ticket.user.height
            if ride.height_restriction and (height is None or height < ride.height_restriction):
                raise ValidationError("The visitor's recorded height does not meet this ride's restriction.")
            reservation.validated = True
            reservation.save(update_fields=["validated"])
        return Response(self.get_serializer(reservation).data)


class VisitorOperations(OperationsViewSet):
    queryset = get_user_model().objects.all()
    serializer_class = VisitorLookupSerializer
    http_method_names = ["get", "head", "options"]
    search_fields = ("username", "name", "last_name", "email")
    columns = ("username", "name", "last_name", "email", "is_active")
    resource_description = "Find an account when helping with a visit."
    can_delete = False


RESOURCES = (
    ("parks", ParkOperations), ("areas", AreaOperations), ("rides", RideOperations),
    ("restaurants", RestaurantOperations), ("stores", StoreOperations), ("products", ProductOperations),
    ("employees", EmployeeOperations), ("tickets", TicketOperations),
    ("guests", GuestOperations), ("reservations", ReservationOperations), ("visitors", VisitorOperations),
)


class OperationsIndex(PrivateResponseMixin, APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        resources = []
        for key, view in RESOURCES:
            instance = view()
            permissions = instance.capabilities(request.user)
            if permissions["view"]:
                resources.append({
                    "key": key, "label": key.capitalize(), "description": view.resource_description,
                    "count": view.queryset.count(), "permissions": permissions,
                })
        return Response({"resources": resources, "time_zone": timezone.get_current_timezone_name()})


router = DefaultRouter()
for key, view in RESOURCES:
    router.register(key, view, basename=f"operations-{key}")
