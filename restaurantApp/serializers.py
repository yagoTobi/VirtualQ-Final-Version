from VirtualQ.serializers import ModelCleanSerializer
from restaurantApp.models import Restaurant


class RestaurantSerializer(ModelCleanSerializer):
    class Meta:
        model = Restaurant
        fields = '__all__'
