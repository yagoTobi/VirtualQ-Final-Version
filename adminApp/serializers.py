from rest_framework import serializers
from .models import ParkEmployee


class ParkEmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParkEmployee
        fields = "__all__"
