from django.db import models
from django.contrib.auth.models import User


class CarBrand(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Car(models.Model):
    BODY_CHOICES = [
        ('sedan', 'Sedan'), ('suv', 'SUV'), ('hatchback', 'Hatchback'), ('wagon', 'Wagon'),
        ('coupe', 'Coupe'), ('minivan', 'Minivan'), ('pickup', 'Pickup'), ('other', 'Other'),
    ]
    FUEL_CHOICES = [
        ('petrol', 'Petrol'), ('diesel', 'Diesel'), ('gas', 'Gas'),
        ('hybrid', 'Hybrid'), ('electric', 'Electric'),
    ]
    TRANSMISSION_CHOICES = [
        ('automatic', 'Automatic'), ('manual', 'Manual'), ('robot', 'Robot'), ('cvt', 'CVT'),
    ]
    DRIVE_CHOICES = [('front', 'Front'), ('rear', 'Rear'), ('full', 'Full')]
    STEERING_CHOICES = [('left', 'Left'), ('right', 'Right')]

    title = models.CharField(max_length=200)
    brand = models.ForeignKey(CarBrand, on_delete=models.CASCADE, related_name='cars')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cars', null=True, blank=True)
    price = models.FloatField()
    year = models.IntegerField()
    mileage = models.IntegerField()
    description = models.TextField()
    image_url = models.URLField(blank=True, max_length=500)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # details shown on the car page (like on Kolesa.kz)
    city = models.CharField(max_length=100, blank=True, default='')
    body_type = models.CharField(max_length=20, choices=BODY_CHOICES, blank=True, default='')
    engine_volume = models.FloatField(null=True, blank=True)
    fuel_type = models.CharField(max_length=20, choices=FUEL_CHOICES, blank=True, default='')
    transmission = models.CharField(max_length=20, choices=TRANSMISSION_CHOICES, blank=True, default='')
    drive = models.CharField(max_length=20, choices=DRIVE_CHOICES, blank=True, default='')
    steering = models.CharField(max_length=10, choices=STEERING_CHOICES, default='left')
    customs_cleared = models.BooleanField(default=True)
    phone = models.CharField(max_length=20, blank=True, default='')
    views_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.title

    @property
    def contact_phone(self):
        """Phone of the ad; if it is empty, the phone from the owner's profile."""
        if self.phone:
            return self.phone
        if self.owner_id:
            profile = getattr(self.owner, 'profile', None)
            if profile and profile.phone:
                return profile.phone
        return ''


class CarImage(models.Model):
    """Additional photos of a car (the main photo is Car.image_url)."""
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='images')
    url = models.URLField(max_length=500)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['position', 'id']

    def __str__(self):
        return f"{self.car_id}: {self.url}"


class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='messages')
    text = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username}"
    
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.user.username
