from rest_framework import generics
from .models import ParkEmployee
from .serializers import ParkEmployeeSerializer

class ParkEmployeeListCreateView(generics.ListCreateAPIView):
    queryset = ParkEmployee.objects.all()
    serializer_class = ParkEmployeeSerializer

class ParkEmployeeRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ParkEmployee.objects.all()
    serializer_class = ParkEmployeeSerializer
