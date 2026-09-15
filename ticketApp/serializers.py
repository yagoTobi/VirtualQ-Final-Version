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
    age = serializers.IntegerField(min_value=0, max_value=130, allow_null=True, required=False)
    height = serializers.IntegerField(min_value=1, max_value=300, allow_null=True, required=False)

    def validate_ticket(self, ticket):
        if ticket.user_id != self.context["request"].user.pk:
            raise serializers.ValidationError("Choose one of your own tickets.")
        if not ticket.guest_number or ticket.guest_number < 0:
            raise serializers.ValidationError("Use a guest ticket, not the account holder's ticket.")
        if self.instance and ticket.pk != self.instance.ticket_id:
            raise serializers.ValidationError("A guest cannot be moved to another ticket.")
        return ticket

    class Meta:
        model = Guest
        fields = "__all__"
