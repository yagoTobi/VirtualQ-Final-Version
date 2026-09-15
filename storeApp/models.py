from django.db import models
from django.core.exceptions import ValidationError
import datetime
from rideApp.models import ThemePark, ThemeParkArea
from rideApp.validation import opening_duration, validate_location

# Create your models here.
class Store(models.Model):
    park_id = models.ForeignKey(ThemePark, on_delete=models.CASCADE)
    area_id = models.ForeignKey(ThemeParkArea, on_delete=models.CASCADE)
    store_id = models.AutoField(primary_key=True)
    store_name = models.CharField(max_length=100, unique=True)
    store_description = models.TextField()
    store_thumbnail = models.ImageField(upload_to='store_thumbnail/')
    opening_hour = models.TimeField(default=datetime.time(22, 0))
    closing_hour = models.TimeField(default=datetime.time(22, 0))

    def __str__(self):
        return self.store_name

    def clean(self):
        super().clean()
        validate_location(self)
        opening_duration(self)


class Product(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='products')
    product_id = models.AutoField(primary_key = True)
    product_name = models.CharField(max_length = 100)
    product_description = models.TextField()
    product_image = models.ImageField(upload_to = 'product_image/')
    product_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.product_name

    def clean(self):
        super().clean()
        if self.product_price is not None and self.product_price < 0:
            raise ValidationError({"product_price": "Price cannot be negative."})
