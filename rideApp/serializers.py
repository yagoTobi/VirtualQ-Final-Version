from rest_framework import serializers
from VirtualQ.serializers import ModelCleanSerializer
from .models import ThemePark, ThemeParkArea, ThemeParkRide


class ThemeParkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThemePark
        fields = "__all__"


class ThemeParkAreaSerializer(ModelCleanSerializer):
    class Meta:
        model = ThemeParkArea
        fields = "__all__"


class ThemeParkRideSerializer(ModelCleanSerializer):
    area_name = serializers.CharField(source="get_area_name", read_only=True)

    class Meta:
        model = ThemeParkRide
        fields = "__all__"
