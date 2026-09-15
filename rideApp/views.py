from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from django_filters import rest_framework as filters
from .models import ThemePark, ThemeParkArea, ThemeParkRide
from VirtualQ.permissions import PublicReadStaffWrite

from .serializers import (
    ThemeParkSerializer,
    ThemeParkAreaSerializer,
    ThemeParkRideSerializer,
)


class ThemeParkRideFilter(filters.FilterSet):
    ride_type = filters.BaseInFilter(field_name="ride_type")
    area_id = filters.BaseInFilter(field_name="area_id")

    class Meta:
        model = ThemeParkRide
        fields = ["ride_type", "area_id"]


class ThemeParkViewSet(viewsets.ModelViewSet):
    permission_classes = [PublicReadStaffWrite]
    queryset = ThemePark.objects.all()
    serializer_class = ThemeParkSerializer


class ThemeParkAreaViewSet(viewsets.ModelViewSet):
    permission_classes = [PublicReadStaffWrite]
    queryset = ThemeParkArea.objects.all()
    serializer_class = ThemeParkAreaSerializer


class ThemeParkRideViewSet(viewsets.ModelViewSet):
    permission_classes = [PublicReadStaffWrite]
    queryset = ThemeParkRide.objects.select_related("area_id", "park_id").all()
    serializer_class = ThemeParkRideSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ThemeParkRideFilter
