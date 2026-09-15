from rest_framework import viewsets
from restaurantApp.models import Restaurant
from restaurantApp.serializers import RestaurantSerializer
from VirtualQ.permissions import PublicReadStaffWrite
from VirtualQ.deletion import SafeDestroyMixin

# Create your views here.
class RestaurantViewSet(SafeDestroyMixin, viewsets.ModelViewSet):
    permission_classes = [PublicReadStaffWrite]
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
