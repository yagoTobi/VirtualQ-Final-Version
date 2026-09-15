from VirtualQ.serializers import ModelCleanSerializer
from .models import ParkEmployee


class ParkEmployeeSerializer(ModelCleanSerializer):
    class Meta:
        model = ParkEmployee
        fields = "__all__"
