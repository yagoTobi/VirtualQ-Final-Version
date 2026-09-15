from VirtualQ.serializers import ModelCleanSerializer
from rest_framework import serializers
from storeApp.models import Store, Product

class StoreSerializer(ModelCleanSerializer):
    class Meta:
        model = Store
        fields = '__all__'

class ProductSerializer(ModelCleanSerializer):
    store_name = serializers.CharField(source="store.store_name", read_only=True)

    class Meta:
        model = Product
        fields = '__all__'
