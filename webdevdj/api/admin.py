from django.contrib import admin
from .models import CarBrand, Car, Message, Profile

admin.site.register(CarBrand)
admin.site.register(Car)
admin.site.register(Message)
admin.site.register(Profile)