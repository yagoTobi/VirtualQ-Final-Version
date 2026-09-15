from VirtualQ.serializers import ModelCleanSerializer
from .models import ParkEmployee


class ParkEmployeeSerializer(ModelCleanSerializer):
    def validate_email(self, value):
        return value or None

    def validate_phone_number(self, value):
        return value or None

    class Meta:
        model = ParkEmployee
        fields = "__all__"
