from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from queueApp.models import RideReservation
from queueApp.serializers import RideReservationSerializer
from ticketApp.models import Guest, Ticket
from ticketApp.serializers import GuestSerializer


class VisitorLookupSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ("id", "username", "name", "last_name", "email", "is_active")
        read_only_fields = fields


class OperationsTicketSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    visitor_name = serializers.SerializerMethodField()
    guest_number = serializers.IntegerField(min_value=0, max_value=49, default=0)

    class Meta:
        model = Ticket
        fields = ("id", "user", "username", "visitor_name", "date_of_visit", "guest_number", "ticket_id")
        read_only_fields = ("ticket_id",)

    def get_visitor_name(self, ticket):
        return (
            getattr(getattr(ticket, "guest", None), "name", None) or f"Guest {ticket.guest_number}"
        ) if ticket.guest_number else ticket.user.name

    def _save(self, attrs, instance=None):
        owner = attrs.get("user") or instance.user
        # Match the visitor party service: account first, then existing ticket.
        get_object_or_404(get_user_model().objects.select_for_update(), pk=owner.pk)
        if instance:
            instance = get_object_or_404(Ticket.objects.select_for_update(), pk=instance.pk)
            if owner.pk != instance.user_id or attrs.get("guest_number", instance.guest_number) != instance.guest_number:
                raise serializers.ValidationError("A ticket's owner and party position cannot be changed. Create a separate ticket instead.")
        visit_date = attrs.get("date_of_visit", instance.date_of_visit if instance else None)
        number = attrs.get("guest_number", instance.guest_number if instance else 0)
        if not instance or visit_date != instance.date_of_visit:
            if visit_date < timezone.localdate():
                raise serializers.ValidationError({"date_of_visit": "Choose today or a future visit date."})
            if instance and RideReservation.objects.filter(ticket=instance).exists():
                raise serializers.ValidationError({"date_of_visit": "This ticket has ride reservations. Resolve them before changing its visit date."})
        position = Q(guest_number=number)
        if number in (0, None):
            position = Q(guest_number=0) | Q(guest_number__isnull=True)
        if Ticket.objects.filter(position, user=owner, date_of_visit=visit_date).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError({"guest_number": "This account already has a ticket in that position for this date."})
        if number and not Guest.objects.filter(ticket=instance).exists():
            if not self.context["request"].user.has_perm("ticketApp.add_guest"):
                raise PermissionDenied("Creating a guest ticket also requires permission to add guests.")
        if instance:
            instance = super().update(instance, attrs)
            Guest.objects.filter(ticket=instance).update(date_of_visit=instance.date_of_visit)
            return instance
        return super().create(attrs)

    @transaction.atomic
    def create(self, validated_data):
        return self._save(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        return self._save(validated_data, instance)


class OperationsGuestSerializer(GuestSerializer):
    username = serializers.CharField(source="ticket.user.username", read_only=True)
    guest_number = serializers.IntegerField(source="ticket.guest_number", read_only=True)

    def validate_ticket(self, ticket):
        if not ticket.guest_number or ticket.guest_number < 0:
            raise serializers.ValidationError("Choose a guest ticket.")
        if self.instance and ticket.pk != self.instance.ticket_id:
            raise serializers.ValidationError("A guest cannot be moved to another ticket.")
        return ticket


class OperationsReservationSerializer(RideReservationSerializer):
    username = serializers.CharField(source="ticket.user.username", read_only=True)

    def validate_ticket(self, ticket):
        return ticket

    class Meta(RideReservationSerializer.Meta):
        fields = [*RideReservationSerializer.Meta.fields, "username"]
