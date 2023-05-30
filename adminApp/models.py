from django.db import models
from rideApp.models import ThemePark, ThemeParkArea


class ParkEmployee(models.Model):
    GENDER_CHOICES = (
        ("M", "Male"),
        ("F", "Female"),
        ("O", "Other"),
    )

    WORK_PLACE_CHOICES = (
        ("ride", "Ride"),
        ("shop", "Shop"),
        ("restaurant", "Restaurant"),
    )

    employee_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    date_of_birth = models.DateField()
    join_date = models.DateField()
    shift_start = models.TimeField()
    shift_end = models.TimeField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    park = models.ForeignKey(ThemePark, on_delete=models.CASCADE)
    area = models.ForeignKey(ThemeParkArea, on_delete=models.CASCADE)
    work_place = models.CharField(max_length=15, choices=WORK_PLACE_CHOICES)
    job_title = models.CharField(max_length=100)
    email = models.EmailField(
        unique=True, null=True, blank=True
    )  # Optional email field
    phone_number = models.CharField(
        max_length=15, unique=True, null=True, blank=True
    )  # Optional phone number field

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
