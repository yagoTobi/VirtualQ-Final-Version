from django.contrib.auth import get_user_model, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers

CustomUser = get_user_model()


class UserUpdateSerializer(serializers.ModelSerializer):
    height = serializers.IntegerField(min_value=1, max_value=300, allow_null=True, required=False)

    class Meta:
        model = CustomUser
        fields = ("id", "name", "last_name", "username", "email", "dob", "height")
        read_only_fields = ("id",)

    def validate_dob(self, value):
        if value and value > timezone.localdate():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value


class UserSerializer(UserUpdateSerializer):
    class Meta(UserUpdateSerializer.Meta):
        fields = (*UserUpdateSerializer.Meta.fields, "password")
        extra_kwargs = {"password": {"write_only": True}}

    def validate(self, attrs):
        try:
            password_validation.validate_password(
                attrs["password"], CustomUser(**{k: v for k, v in attrs.items() if k != "password"})
            )
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": exc.messages})
        return attrs

    def create(self, validated_data):
        return CustomUser.objects.create_user(**validated_data)
