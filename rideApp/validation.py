from datetime import date, datetime

from django.core.exceptions import ValidationError


def validate_location(instance, park_field="park_id", area_field="area_id"):
    park_id = getattr(instance, f"{park_field}_id")
    area_id = getattr(instance, f"{area_field}_id")
    if park_id and area_id and getattr(instance, area_field).park_id_id != park_id:
        raise ValidationError({area_field: "Choose an area in the selected park."})


def opening_duration(instance):
    """Catalog hours describe a single park day; employee shifts are separate."""
    if instance.opening_hour is None or instance.closing_hour is None:
        return None
    duration = (
        datetime.combine(date.min, instance.closing_hour)
        - datetime.combine(date.min, instance.opening_hour)
    )
    if duration.total_seconds() <= 0:
        raise ValidationError({"closing_hour": "Closing time must be after opening time."})
    return duration
