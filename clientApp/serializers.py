from rest_framework import serializers
from django.contrib.auth import get_user_model


CustomUser = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = (
            "id",
            "username",
            "email",
            "password",
            "name",
            "last_name",
            "dob",
        )  # Include first_name and last_name here
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = CustomUser.objects.create(
            username=validated_data["username"],
            email=validated_data["email"],
            name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            dob=validated_data["dob"],
        )
        user.set_password(validated_data["password"])
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = (
            "name",
            "last_name",
            "username",
            "email",
            "dob",
        )

    def update(self, instance, validated_data):
        instance.name = validated_data.get("name", instance.first_name)
        instance.last_name = validated_data.get("last_name", instance.last_name)
        instance.username = validated_data.get("username", instance.username)
        instance.email = validated_data.get("email", instance.email)
        instance.dob = validated_data.get("dob", instance.dob)
        instance.save()
        return instance

    def validate_username(self, value):
        if self.instance:
            if (
                CustomUser.objects.filter(username=value)
                .exclude(pk=self.instance.pk)
                .exists()
            ):
                raise serializers.ValidationError("Username already exists")
        else:
            if CustomUser.objects.filter(username=value).exists():
                raise serializers.ValidationError("Username already exists")
        return value

    def validate_email(self, value):
        if self.instance:
            if (
                CustomUser.objects.filter(email=value)
                .exclude(pk=self.instance.pk)
                .exists()
            ):
                raise serializers.ValidationError("Email already exists")
        else:
            if CustomUser.objects.filter(email=value).exists():
                raise serializers.ValidationError("Email already exists")
        return value
