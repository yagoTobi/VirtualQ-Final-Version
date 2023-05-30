from rest_framework import viewsets, status
from rest_framework.response import Response
from datetime import datetime, timedelta
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import RideReservation
from .serializers import RideReservationSerializer

CustomUser = get_user_model()


class RideReservationViewSet(viewsets.ModelViewSet):
    queryset = RideReservation.objects.all()
    serializer_class = RideReservationSerializer

    def create(self, request):
        reservations = request.data
        if not isinstance(reservations, list):
            reservations = [reservations]

        created_reservations = []
        with transaction.atomic():
            for reservation_data in reservations:
                serializer = self.serializer_class(data=reservation_data)

                if serializer.is_valid():
                    ticket = serializer.validated_data["ticket"]
                    ride = serializer.validated_data["ride"]
                    date = serializer.validated_data["date"]
                    start_time = serializer.validated_data["start_time"]

                    # Combine date and time to create datetime
                    datetime_start = datetime.combine(date, start_time)

                    # Calculate end time
                    datetime_end = datetime_start + timedelta(
                        minutes=ride.ride_duration
                    )
                    end_time = datetime_end.time()  # This is the corrected end_time

                    # Checks before we allow the creation of a ride reservation
                    # 1. Check if the ride is under maintenance
                    if ride.under_maintenance:
                        raise ValidationError(
                            {
                                "detail": "The ride is currently under maintenance. Please look out for notifications in the case that the issue is fixed"
                            }
                        )

                    # 2. Check if the ticket is valid for the date of the reservation
                    if ticket.date_of_visit != date:
                        raise ValidationError(
                            {"detail": "The ticket is not valid for this date."}
                        )

                    # 3. Check if a reservation exists within 20 minutes of this reservation #Do not let other reservations at
                    # the same time period.
                    start_time = datetime_start.time()

                    existing_reservations = RideReservation.objects.filter(
                        ticket=ticket,
                        start_time=start_time,
                        date=date,
                    )

                    if existing_reservations.exists():
                        raise ValidationError(
                            {
                                "detail": "There is another reservation for the same ticket at this time slot. Please pick a different time slot or day."
                            }
                        )

                    # 6. In case all of those conditions aren't met, create reservation
                    reservation = serializer.save()
                    created_reservations.append(serializer.data)
                else:
                    return Response(
                        serializer.errors, status=status.HTTP_400_BAD_REQUEST
                    )

            return Response(created_reservations, status=status.HTTP_201_CREATED)

    def list(self, request):
        queryset = self.queryset

        date = request.query_params.get("date", None)
        if date is not None:
            queryset = queryset.filter(start_time__date=date)

        hour = request.query_params.get("hour", None)
        if hour is not None:
            queryset = queryset.filter(start_time__hour=hour)

        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        reservation = self.get_object()
        serializer = self.serializer_class(reservation)
        return Response(serializer.data)
