from rest_framework import viewsets
from rideApp.models import ThemePark, ThemeParkArea
from storeApp.models import Store, Product
from storeApp.serializers import StoreSerializer, ProductSerializer

class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer