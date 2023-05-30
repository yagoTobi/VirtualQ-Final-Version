from django.db import models
from rideApp.models import ThemePark, ThemeParkArea

#Definición de selección 
class RestaurantType(models.Model):
    RESTAURANT_TYPES = (
        ('fast_food', 'Fast Food'),
        ('casual_dining', 'Casual Dining'),
        ('fine_dining', 'Fine Dining'),
        ('cafe', 'Cafe'),
        ('buffet', 'Buffet'),
        ('Breakfast', 'Breakfast'), 
        ('Lunch', 'Lunch'), 
        ('Dinner', 'Dinner'), 
        ('American', 'American'), 
        ('Asian', 'Asian'), 
        ('Bakery', 'Bakery'), 
        ('Healthy', 'Healthy'), 
        ('Mediterranean', 'Mediterranean'), 
        ('Mexican', 'Mexican'), 
        ('Steakhouse', 'Steakhouse'), 
        ('Vegetarian', 'Vegetarian')
    )

    type = models.CharField(max_length=20, choices = RESTAURANT_TYPES, unique=True)

    def __str__(self):
        return self.type

class Restaurant(models.Model):

    restaurant_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    brief_text = models.CharField(max_length=250)
    long_description = models.TextField()
    thumbnail = models.ImageField(upload_to='restaurant_thumbnails/', default=None)
    restaurant_types = models.CharField(max_length=250, default=None)
    opening_hour = models.TimeField()
    closing_hour = models.TimeField()
    park = models.ForeignKey(ThemePark, on_delete=models.CASCADE)
    area = models.ForeignKey(ThemeParkArea, on_delete=models.CASCADE)

    def __str__(self):
        return self.name
