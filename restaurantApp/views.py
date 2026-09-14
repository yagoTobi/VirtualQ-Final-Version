from rest_framework import viewsets
from restaurantApp.models import Restaurant
from restaurantApp.serializers import RestaurantSerializer
from VirtualQ.permissions import PublicReadStaffWrite

# Create your views here.
class RestaurantViewSet(viewsets.ModelViewSet):
    permission_classes = [PublicReadStaffWrite]
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
