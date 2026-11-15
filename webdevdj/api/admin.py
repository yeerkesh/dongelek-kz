from django.contrib import admin
from .models import CarBrand, Car, CarImage, Message, Profile


class CarImageInline(admin.TabularInline):
    model = CarImage
    extra = 0


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ('title', 'brand', 'owner', 'price', 'year', 'city', 'is_active', 'views_count')
    list_filter = ('brand', 'is_active', 'transmission', 'body_type')
    search_fields = ('title', 'description', 'city')
    inlines = [CarImageInline]


admin.site.register(CarBrand)
admin.site.register(Message)
admin.site.register(Profile)
