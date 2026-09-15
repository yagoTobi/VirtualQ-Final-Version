from datetime import datetime, timedelta
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import RideReservation
from .serializers import RideReservationSerializer
from ticketApp.models import Ticket
from rideApp.models import ThemeParkRide
from ticketApp.qr import qr_png_base64
from .capacity import remaining_capacity


class ReservationFilters(serializers.Serializer):
    date = serializers.DateField(required=False)
    hour = serializers.IntegerField(required=False, min_value=0, max_value=23)
    upcoming = serializers.BooleanField(required=False, default=False)


class OptionsFilters(serializers.Serializer):
    date = serializers.DateField()
    ride = serializers.IntegerField(min_value=1)


class RideReservationViewSet(viewsets.ModelViewSet):
    queryset = RideReservation.objects.select_related("ride", "ticket__user", "ticket__guest").order_by("date", "start_time", "reservation_id")
    serializer_class = RideReservationSerializer

    def get_queryset(self):
        queryset = super().get_queryset().filter(ticket__user=self.request.user)
        filters = ReservationFilters(data=self.request.query_params)
        filters.is_valid(raise_exception=True)
        date = filters.validated_data.get("date")
        hour = filters.validated_data.get("hour")
        if date is not None:
            queryset = queryset.filter(date=date)
        if hour is not None:
            queryset = queryset.filter(start_time__hour=hour)
        if filters.validated_data["upcoming"]:
            now = timezone.localtime()
            queryset = queryset.filter(Q(date__gt=now.date()) | Q(date=now.date(), end_time__gt=now.time()))
        return queryset

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        reservations = request.data
        if not isinstance(reservations, list):
            reservations = [reservations]
        if not reservations:
            raise ValidationError({"detail": "Select at least one visitor."})
        if len(reservations) > 50:
            raise ValidationError({"detail": "Book at most 50 visitors at once."})

        pending = []
        for reservation_data in reservations:
            serializer = self.get_serializer(data=reservation_data)
            serializer.is_valid(raise_exception=True)
            pending.append(serializer)

        # Lock the whole batch in stable order before individual model saves.
        list(Ticket.objects.select_for_update().filter(
            pk__in=[s.validated_data["ticket"].pk for s in pending]
        ).order_by("pk"))
        list(ThemeParkRide.objects.select_for_update().filter(
            pk__in=[s.validated_data["ride"].pk for s in pending]
        ).order_by("pk"))
        created_reservations = []
        for serializer in pending:
            serializer.save()
            created_reservations.append(serializer.data)
        return Response(created_reservations, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        initial = self.get_object()
        get_object_or_404(Ticket.objects.select_for_update(), pk=initial.ticket_id)
        get_object_or_404(ThemeParkRide.objects.select_for_update(), pk=initial.ride_id)
        booking = get_object_or_404(RideReservation.objects.select_for_update(), pk=initial.pk)
        if not booking.can_cancel():
            raise ValidationError({"detail": "Admitted or finished reservations cannot be cancelled."})
        booking.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"])
    def qr(self, request, pk=None):
        booking = self.get_object()
        if not booking.reservation_ticket_id:
            raise ValidationError({"detail": "This reservation has no pass code. Ask the ride team for help."})
        response = Response({
            "reservation": self.get_serializer(booking).data,
            "image": f"data:image/png;base64,{qr_png_base64(booking.reservation_ticket_id)}",
        })
        response["Cache-Control"] = "private, no-store"
        return response

    @action(detail=False, methods=["get"], url_path="booking-options")
    def booking_options(self, request):
        filters = OptionsFilters(data=request.query_params)
        filters.is_valid(raise_exception=True)
        date = filters.validated_data["date"]
        ride = get_object_or_404(ThemeParkRide, pk=filters.validated_data["ride"])
        tickets = list(Ticket.objects.filter(user=request.user, date_of_visit=date).select_related("user", "guest").order_by("guest_number", "pk"))
        bookings = list(RideReservation.objects.filter(date=date).filter(
            Q(ride=ride) | Q(ticket__in=tickets)
        ).values("ticket_id", "ride_id", "start_time", "end_time"))
        ride_intervals = [(b["start_time"], b["end_time"]) for b in bookings if b["ride_id"] == ride.pk]
        own_ids = {t.pk for t in tickets}
        now = timezone.localtime()
        visitors = []
        for ticket in tickets:
            guest = getattr(ticket, "guest", None) if ticket.guest_number else None
            height = guest.height if guest else (None if ticket.guest_number else ticket.user.height)
            eligible = not ride.height_restriction or (height is not None and height >= ride.height_restriction)
            visitors.append({
                "ticket": ticket.pk, "guest_number": ticket.guest_number,
                "name": ((guest.name if guest else None) or f"Guest {ticket.guest_number}") if ticket.guest_number else ticket.user.name,
                "height": height, "eligible": eligible,
                "reason": "" if eligible else f"Recorded height must be at least {ride.height_restriction} cm.",
            })
        slots = []
        if not ride.under_maintenance and ride.ride_duration > 0 and ride.ride_capacity > 0:
            start = timezone.make_aware(datetime.combine(date, ride.opening_hour))
            closing = timezone.make_aware(datetime.combine(date, ride.closing_hour))
            duration = timedelta(minutes=ride.ride_duration)
            while closing - start >= duration:
                end = start + duration
                if start > now:
                    slots.append({
                        "start_time": start.strftime("%H:%M:%S"), "end_time": end.strftime("%H:%M:%S"),
                        "remaining": remaining_capacity(ride_intervals, start.time(), end.time(), ride.ride_capacity),
                        "conflicting_tickets": sorted({
                            b["ticket_id"] for b in bookings if b["ticket_id"] in own_ids
                            and b["start_time"] < end.time() and b["end_time"] > start.time()
                        }),
                    })
                if closing - start < timedelta(minutes=30):
                    break
                start += timedelta(minutes=30)
        return Response({
            "date": date, "today": now.date(), "time_zone": timezone.get_current_timezone_name(),
            "server_time": now.isoformat(), "visitors": visitors, "slots": slots,
        })
