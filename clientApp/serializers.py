from django.contrib.auth import get_user_model, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers

CustomUser = get_user_model()

class ResetLinkSerializer(serializers.Serializer):
    uid = serializers.CharField(max_length=128)
    token = serializers.CharField(max_length=128, write_only=True)


class PasswordResetSerializer(ResetLinkSerializer):
    new_password1 = serializers.CharField(trim_whitespace=False, write_only=True)
    new_password2 = serializers.CharField(trim_whitespace=False, write_only=True)


class UserUpdateSerializer(serializers.ModelSerializer):
    height = serializers.IntegerField(min_value=1, max_value=300, allow_null=True, required=False)
    permissions = serializers.SerializerMethodField()

    def get_permissions(self, user):
        return sorted(user.get_all_permissions()) if user.is_staff else []

    class Meta:
        model = CustomUser
        fields = ("id", "name", "last_name", "username", "email", "dob", "height",
                  "is_staff", "permissions")
        read_only_fields = ("id", "is_staff", "permissions")

    def validate_dob(self, value):
        if value and value > timezone.localdate():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        # An in-flight profile edit must not restore stale authentication fields.
        instance.save(update_fields=validated_data.keys())
        return instance


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
