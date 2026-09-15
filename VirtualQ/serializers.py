from copy import copy

from django.core.exceptions import ValidationError as ModelValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import serializers


class ModelCleanSerializer(serializers.ModelSerializer):
    """Apply shared model rules to API writes, including partial updates."""

    def validate(self, attrs):
        attrs = super().validate(attrs)
        candidate = copy(self.instance) if self.instance else self.Meta.model()
        for name, value in attrs.items():
            setattr(candidate, name, value)
        try:
            candidate.clean()
        except ModelValidationError as error:
            raise serializers.ValidationError(
                error.message_dict if hasattr(error, "message_dict") else error.messages
            ) from error
        return attrs

    @transaction.atomic
    def save(self, **kwargs):
        from rideApp.models import ThemeParkArea

        # Validation and saving are separate DRF steps. Read the current row and
        # area again inside the write transaction so an intervening move cannot
        # attach a child to an area in another park.
        attrs = {**self.validated_data, **kwargs}
        if self.instance is not None:
            self.instance = get_object_or_404(
                self.Meta.model.objects.select_for_update(), pk=self.instance.pk
            )
        for field in self.Meta.model._meta.fields:
            if field.is_relation and field.related_model is ThemeParkArea:
                area = attrs.get(field.name) or (
                    getattr(self.instance, field.name) if self.instance else None
                )
                if area is not None:
                    current = get_object_or_404(
                        ThemeParkArea.objects.select_for_update(), pk=area.pk
                    )
                    if field.name in attrs:
                        attrs[field.name] = current
                    else:
                        setattr(self.instance, field.name, current)
        self._validated_data = self.validate(attrs)
        return super().save()
