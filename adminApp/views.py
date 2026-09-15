from rest_framework import generics
from .models import ParkEmployee
from .serializers import ParkEmployeeSerializer
from VirtualQ.permissions import StaffModelPermissions
from VirtualQ.deletion import SafeDestroyMixin

class ParkEmployeeListCreateView(generics.ListCreateAPIView):
    permission_classes = [StaffModelPermissions]
    queryset = ParkEmployee.objects.all()
    serializer_class = ParkEmployeeSerializer

class ParkEmployeeRetrieveUpdateDestroyView(SafeDestroyMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [StaffModelPermissions]
    queryset = ParkEmployee.objects.all()
    serializer_class = ParkEmployeeSerializer
