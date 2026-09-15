from rest_framework import generics
from .models import ParkEmployee
from .serializers import ParkEmployeeSerializer
from VirtualQ.permissions import StaffModelPermissions

class ParkEmployeeListCreateView(generics.ListCreateAPIView):
    permission_classes = [StaffModelPermissions]
    queryset = ParkEmployee.objects.all()
    serializer_class = ParkEmployeeSerializer

class ParkEmployeeRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [StaffModelPermissions]
    queryset = ParkEmployee.objects.all()
    serializer_class = ParkEmployeeSerializer
