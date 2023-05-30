from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from django_filters import rest_framework as filters
from .models import ThemePark, ThemeParkArea, ThemeParkRide
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

from .serializers import (
    ThemeParkSerializer,
    ThemeParkAreaSerializer,
    ThemeParkRideSerializer,
)


class MultipleChoiceFilter(filters.Filter):
    def filter(self, qs, value):
        if not value:
            return qs

        self.lookup_expr = "in"
        values = value.split(",")
        return super().filter(qs, values)


@permission_classes([AllowAny])
class ThemeParkRideFilter(filters.FilterSet):
    ride_type = MultipleChoiceFilter(field_name="ride_type")
    area_id = MultipleChoiceFilter(field_name="area_id")

    class Meta:
        model = ThemeParkRide
        fields = ["ride_type", "area_id"]


@permission_classes([AllowAny])
class ThemeParkViewSet(viewsets.ModelViewSet):
    queryset = ThemePark.objects.all()
    serializer_class = ThemeParkSerializer


@permission_classes([AllowAny])
class ThemeParkAreaViewSet(viewsets.ModelViewSet):
    queryset = ThemeParkArea.objects.all()
    serializer_class = ThemeParkAreaSerializer


@permission_classes([AllowAny])
class ThemeParkRideViewSet(viewsets.ModelViewSet):
    queryset = ThemeParkRide.objects.all()
    serializer_class = ThemeParkRideSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ThemeParkRideFilter
