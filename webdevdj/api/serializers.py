from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from . import validators as v
from .models import CarBrand, Car, CarImage, Message, Profile


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
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    # additional photos: a list of URLs (the main photo is image_url)
    images = serializers.SerializerMethodField()
    extra_images = serializers.ListField(
        child=serializers.URLField(max_length=500),
        required=False, write_only=True, max_length=10,
    )
    has_phone = serializers.SerializerMethodField()

    class Meta:
        model = Car
        fields = '__all__'
        read_only_fields = ['views_count']

    # ---- limits (see validators.py) ----
    def validate_title(self, value): return v.validate_title(value)
    def validate_year(self, value): return v.validate_year(value)
    def validate_price(self, value): return v.validate_price(value)
    def validate_mileage(self, value): return v.validate_mileage(value)
    def validate_engine_volume(self, value): return v.validate_engine_volume(value)
    def validate_description(self, value): return v.validate_description(value)
    def validate_city(self, value): return v.validate_city(value)
    def validate_phone(self, value): return v.validate_phone(value)
    def validate_image_url(self, value): return v.validate_http_url(value)

    def validate_extra_images(self, value):
        for url in value:
            v.validate_http_url(url)
        return value

    def get_images(self, obj):
        return [img.url for img in obj.images.all()]

    def get_has_phone(self, obj):
        return bool(obj.contact_phone)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # the phone number is not sent to everybody:
        # visitors get it by pressing "Show phone", the owner sees it in the edit form
        request = self.context.get('request')
        is_owner = bool(
            request and request.user.is_authenticated and instance.owner_id == request.user.id
        )
        if not is_owner:
            data.pop('phone', None)
        return data

    def _save_images(self, car, urls):
        car.images.all().delete()
        CarImage.objects.bulk_create(
            [CarImage(car=car, url=url, position=i) for i, url in enumerate(urls)]
        )

    def create(self, validated_data):
        urls = validated_data.pop('extra_images', [])
        car = super().create(validated_data)
        self._save_images(car, urls)
        return car

    def update(self, instance, validated_data):
        urls = validated_data.pop('extra_images', None)
        car = super().update(instance, validated_data)
        if urls is not None:
            self._save_images(car, urls)
        return car


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)
    car_title = serializers.CharField(source='car.title', read_only=True)

    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['sender', 'is_read']

    def validate_text(self, value):
        return v.validate_message_text(value)

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
    email = serializers.EmailField(required=False, allow_blank=True, max_length=254)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    city = serializers.CharField(required=False, allow_blank=True, max_length=100)

    def validate_phone(self, value): return v.validate_phone(value)
    def validate_city(self, value): return v.validate_city(value)
    date_joined = serializers.DateTimeField(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)
    cars_count = serializers.IntegerField(read_only=True)
