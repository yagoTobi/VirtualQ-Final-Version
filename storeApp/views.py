from rest_framework import viewsets
from storeApp.models import Store, Product
from storeApp.serializers import StoreSerializer, ProductSerializer
from VirtualQ.permissions import PublicReadStaffWrite
from VirtualQ.deletion import SafeDestroyMixin

class StoreViewSet(SafeDestroyMixin, viewsets.ModelViewSet):
    permission_classes = [PublicReadStaffWrite]
    queryset = Store.objects.all()
    serializer_class = StoreSerializer

class ProductViewSet(SafeDestroyMixin, viewsets.ModelViewSet):
    permission_classes = [PublicReadStaffWrite]
    queryset = Product.objects.select_related("store")
    serializer_class = ProductSerializer
