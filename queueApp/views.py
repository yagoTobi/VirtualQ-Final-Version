from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import RideReservation
from .serializers import RideReservationSerializer


class RideReservationViewSet(viewsets.ModelViewSet):
    queryset = RideReservation.objects.all()
    serializer_class = RideReservationSerializer

    def get_queryset(self):
        queryset = super().get_queryset().filter(ticket__user=self.request.user)
        date = self.request.query_params.get("date")
        hour = self.request.query_params.get("hour")
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

        created_reservations = []
        for reservation_data in reservations:
            serializer = self.get_serializer(data=reservation_data)
            serializer.is_valid(raise_exception=True)
            ticket = serializer.validated_data["ticket"]
            ride = serializer.validated_data["ride"]
            date = serializer.validated_data["date"]
            start_time = serializer.validated_data["start_time"]

            if ride.under_maintenance:
                raise ValidationError({"detail": "The ride is currently under maintenance."})
            if ticket.date_of_visit != date:
                raise ValidationError({"detail": "The ticket is not valid for this date."})
            if RideReservation.objects.filter(
                ticket=ticket, start_time=start_time, date=date
            ).exists():
                raise ValidationError({
                    "detail": "This visitor already has a reservation at this time."
                })

            serializer.save()
            created_reservations.append(serializer.data)
        return Response(created_reservations, status=status.HTTP_201_CREATED)
