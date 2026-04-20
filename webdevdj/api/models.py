from django.db import models
from django.contrib.auth.models import User


class CarBrand(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Car(models.Model):
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

    def __str__(self):
        return self.title


class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='messages')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username}"
    
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.user.username
