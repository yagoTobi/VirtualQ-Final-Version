from rest_framework import serializers
from .models import RideReservation


class RideReservationSerializer(serializers.ModelSerializer):
    def validate_ticket(self, ticket):
        if ticket.user_id != self.context["request"].user.pk:
            raise serializers.ValidationError("Choose one of your own tickets.")
        return ticket

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
