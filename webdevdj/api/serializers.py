from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CarBrand, Car, Message, Profile


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds the username and role into the JWT so the frontend can show them."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_staff'] = user.is_staff
        return token


class CarBrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarBrand
        fields = '__all__'


class CarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Car
        fields = '__all__'


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)
    car_title = serializers.CharField(source='car.title', read_only=True)

    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['sender', 'is_read']

    def validate(self, attrs):
        request = self.context.get('request')
        if request is None:
            return attrs

        sender = request.user
        receiver = attrs['receiver']
        car = attrs['car']

        if car.owner_id is None:
            raise serializers.ValidationError('This car has no owner.')
        if receiver.id == sender.id:
            raise serializers.ValidationError('You cannot write to yourself.')

        if sender.id == car.owner_id:
            # the owner can only REPLY to a person who already wrote about this car
            has_written = Message.objects.filter(
                car=car, sender=receiver, receiver=sender
            ).exists()
            if not has_written:
                raise serializers.ValidationError('There is no conversation with this user.')
        elif receiver.id != car.owner_id:
            # a buyer can only write to the owner of the car
            raise serializers.ValidationError('You can write only to the owner of the car.')

        return attrs


class ProfileSerializer(serializers.Serializer):
    """Profile of the current user (User + Profile data)."""
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    city = serializers.CharField(required=False, allow_blank=True, max_length=100)
    date_joined = serializers.DateTimeField(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)
    cars_count = serializers.IntegerField(read_only=True)
