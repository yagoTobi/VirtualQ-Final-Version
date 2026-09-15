from VirtualQ.serializers import ModelCleanSerializer
from restaurantApp.models import Restaurant


class RestaurantSerializer(ModelCleanSerializer):
    class Meta:
        model = Restaurant
        fields = '__all__'
        # Legacy model defaults use None for two non-nullable fields.
        extra_kwargs = {"thumbnail": {"required": True}, "restaurant_types": {"required": True}}
