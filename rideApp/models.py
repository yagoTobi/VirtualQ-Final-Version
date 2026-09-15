from django.core.exceptions import ValidationError
from django.db import models

from .validation import opening_duration, validate_location


class ThemePark(models.Model):
    park_id = models.AutoField(primary_key=True)
    park_name = models.CharField(max_length=255)

    def __str__(self):
        return self.park_name


class ThemeParkArea(models.Model):
    area_id = models.AutoField(primary_key=True)
    area_name = models.CharField(max_length=255)
    park_id = models.ForeignKey(ThemePark, on_delete=models.CASCADE)

    def __str__(self):
        return self.area_name

    def clean(self):
        super().clean()
        if not self.pk or not self.park_id_id:
            return
        if any((
            self.themeparkride_set.exclude(park_id=self.park_id_id).exists(),
            self.store_set.exclude(park_id=self.park_id_id).exists(),
            self.restaurant_set.exclude(park=self.park_id_id).exists(),
            self.parkemployee_set.exclude(park=self.park_id_id).exists(),
        )):
            raise ValidationError({
                "park_id": "Move this area's rides, shops, restaurants and employees before changing its park."
            })


class ThemeParkRide(models.Model):
    ride_id = models.AutoField(primary_key=True)
    ride_name = models.CharField(max_length=255)
    ride_description = models.TextField()
    ride_thumbnail = models.ImageField(upload_to="media/ride_thumbnails/")
    area_id = models.ForeignKey(ThemeParkArea, on_delete=models.CASCADE)
    park_id = models.ForeignKey(ThemePark, on_delete=models.CASCADE)
    height_restriction = models.PositiveIntegerField()
    ride_capacity = models.PositiveIntegerField()
    ride_duration = models.PositiveIntegerField()
    opening_hour = models.TimeField()
    closing_hour = models.TimeField()
    under_maintenance = models.BooleanField()
    # Accessibility features
    accessibility_wheelchair_access = models.BooleanField(default=False)
    accessibility_audio_description = models.BooleanField(default=False)
    accessibility_braille = models.BooleanField(default=False)
    accessibility_sign_language = models.BooleanField(default=False)
    accessibility_closed_captioning = models.BooleanField(default=False)
    accessibility_tactile_path = models.BooleanField(default=False)
    accessibility_other = models.BooleanField(default=False)

    RIDE_TYPE_CHOICES = [
        ("ROLLER_COASTER", "Roller Coaster"),
        ("BIG_DROPS", "Big Drops"),
        ("SMALL_DROPS", "Small Drops"),
        ("THRILL_RIDES", "Thrill Rides"),
        ("SLOW_RIDES", "Slow Rides"),
        ("STAGE_SHOWS", "Stage Shows"),
        ("FIREWORKS", "Fireworks"),
        ("CHARACTER_EXPERIENCES", "Character Experience"),
        ("PARADES", "Parades"),
        ("WATER_RIDES", "Water Rides"),
        ("SPINNING", "Spinning"),
        ("LIVE", "Live Entertainment"),
        ("DARK", "Dark"),
        ("LOUD", "Loud"),
        ("SCARY", "Scary"),
    ]

    AGE_CHOICES = [
        ("PREESCHOOLERS", "Preeschoolers"),
        ("KIDS", "Kids"),
        ("TEENS", "Teens"),
        ("ADULTS", "Adults"),
        ("TWEENS", "Tweens"),
    ]

    ride_type = models.CharField(max_length=255, choices=RIDE_TYPE_CHOICES)
    age_restriction = models.CharField(max_length=255, choices=AGE_CHOICES)

    def __str__(self):
        return self.ride_name

    def park_open_hours(self):
        return opening_duration(self)

    def clean(self):
        super().clean()
        validate_location(self)
        hours = opening_duration(self)
        errors = {}
        if self.ride_capacity is not None and self.ride_capacity < 1:
            errors["ride_capacity"] = "Capacity must be at least one visitor."
        if self.ride_duration is not None:
            if self.ride_duration < 1:
                errors["ride_duration"] = "Duration must be at least one minute."
            elif hours and self.ride_duration > hours.total_seconds() / 60:
                errors["ride_duration"] = "A ride must fit within its opening hours."
        if self.height_restriction is not None and not 0 <= self.height_restriction <= 300:
            errors["height_restriction"] = "Choose a height between 0 and 300 cm."
        if errors:
            raise ValidationError(errors)

    def get_area_name(self):
        return self.area_id.area_name
