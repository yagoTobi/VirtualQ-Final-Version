from rest_framework import serializers
from django.core.exceptions import ValidationError as ModelValidationError
from .models import RideReservation


class RideReservationSerializer(serializers.ModelSerializer):
    def validate_ticket(self, ticket):
        if ticket.user_id != self.context["request"].user.pk:
            raise serializers.ValidationError("Choose one of your own tickets.")
        return ticket

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except ModelValidationError as error:
            raise serializers.ValidationError(
                error.message_dict if hasattr(error, "message_dict") else error.messages
            ) from error

    def update(self, instance, validated_data):
        try:
            return super().update(instance, validated_data)
        except ModelValidationError as error:
            raise serializers.ValidationError(
                error.message_dict if hasattr(error, "message_dict") else error.messages
            ) from error

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
        read_only_fields = ("end_time", "reservation_ticket_id", "validated")
        extra_kwargs = {"date": {"required": True, "allow_null": False}}
