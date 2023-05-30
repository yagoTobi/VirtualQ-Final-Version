from rest_framework import serializers
from .models import ThemePark, ThemeParkArea, ThemeParkRide


class ThemeParkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThemePark
        fields = "__all__"


class ThemeParkAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThemeParkArea
        fields = "__all__"


class ThemeParkRideSerializer(serializers.ModelSerializer):
    area_name = serializers.CharField(source="get_area_name", read_only=True)

    class Meta:
        model = ThemeParkRide
        fields = "__all__"
