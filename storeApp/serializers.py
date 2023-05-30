from rest_framework import serializers
from rideApp.models import ThemePark, ThemeParkArea
from storeApp.models import Store, Product

class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'