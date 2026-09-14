from rest_framework import serializers
from .models import Ticket, Guest


# serializers.py
class TicketSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()  # Add this line

    class Meta:
        model = Ticket
        fields = ("id", "user", "date_of_visit", "guest_number", "ticket_id")
        read_only_fields = ("ticket_id",)

    def get_user(self, obj):  # Add this method
        return obj.user.username  # Or obj.user.email


class GuestSerializer(serializers.ModelSerializer):
    def validate_ticket(self, ticket):
        if ticket.user_id != self.context["request"].user.pk:
            raise serializers.ValidationError("Choose one of your own tickets.")
        return ticket

    class Meta:
        model = Guest
        fields = "__all__"
