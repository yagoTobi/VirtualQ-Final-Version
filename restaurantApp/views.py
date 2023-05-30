from rest_framework import viewsets
from restaurantApp.models import Restaurant
from restaurantApp.serializers import RestaurantSerializer

# Create your views here.


class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
