from rest_framework import viewsets
from rideApp.models import ThemePark, ThemeParkArea
from storeApp.models import Store, Product
from storeApp.serializers import StoreSerializer, ProductSerializer
from VirtualQ.permissions import PublicReadStaffWrite

class StoreViewSet(viewsets.ModelViewSet):
    permission_classes = [PublicReadStaffWrite]
    queryset = Store.objects.all()
    serializer_class = StoreSerializer

class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [PublicReadStaffWrite]
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
