from django.db import transaction
from rest_framework import viewsets, status, serializers
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import RideReservation
from .serializers import RideReservationSerializer
from ticketApp.models import Ticket
from rideApp.models import ThemeParkRide


class ReservationFilters(serializers.Serializer):
    date = serializers.DateField(required=False)
    hour = serializers.IntegerField(required=False, min_value=0, max_value=23)


class RideReservationViewSet(viewsets.ModelViewSet):
    queryset = RideReservation.objects.select_related("ride", "ticket__user").order_by("date", "start_time", "reservation_id")
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
