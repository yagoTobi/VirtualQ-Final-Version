from copy import copy

from django.core.exceptions import ValidationError as ModelValidationError
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
