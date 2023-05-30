from rest_framework import serializers
from .models import RideReservation


class RideReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = RideReservation
        fields = [
            "reservation_id",
            "ticket",
            "ride",
            "date",
            "start_time",
            "end_time",
            "reservation_ticket_id",
            "validated",
        ]