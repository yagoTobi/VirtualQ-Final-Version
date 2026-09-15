from rest_framework import serializers
from django.core.exceptions import ValidationError as ModelValidationError
from django.utils import timezone
from .models import RideReservation


class RideReservationSerializer(serializers.ModelSerializer):
    ride_name = serializers.CharField(source="ride.ride_name", read_only=True)
    ride_thumbnail = serializers.ImageField(source="ride.ride_thumbnail", read_only=True)
    visitor_name = serializers.SerializerMethodField()
    guest_number = serializers.IntegerField(source="ticket.guest_number", read_only=True)
    starts_at = serializers.DateTimeField(read_only=True)
    ends_at = serializers.DateTimeField(read_only=True)
    can_cancel = serializers.BooleanField(read_only=True)
    time_zone = serializers.SerializerMethodField()

    def get_visitor_name(self, obj):
        return (getattr(getattr(obj.ticket, "guest", None), "name", None) or f"Guest {obj.ticket.guest_number}") if obj.ticket.guest_number else obj.ticket.user.name

    def get_time_zone(self, obj):
        return timezone.get_current_timezone_name()

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
            "ride_name", "ride_thumbnail", "visitor_name", "guest_number",
            "starts_at", "ends_at", "can_cancel", "time_zone",
        ]
        read_only_fields = ("end_time", "reservation_ticket_id", "validated")
        extra_kwargs = {"date": {"required": True, "allow_null": False}}
