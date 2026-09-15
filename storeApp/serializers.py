from VirtualQ.serializers import ModelCleanSerializer
from storeApp.models import Store, Product

class StoreSerializer(ModelCleanSerializer):
    class Meta:
        model = Store
        fields = '__all__'

class ProductSerializer(ModelCleanSerializer):
    class Meta:
        model = Product
        fields = '__all__'
