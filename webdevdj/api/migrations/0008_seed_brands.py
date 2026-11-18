from django.db import migrations

# Popular car brands in Kazakhstan. Brands that already exist are skipped
# (the check ignores upper / lower case), so nothing is duplicated.
BRANDS = [
    'Acura', 'Alfa Romeo', 'Audi', 'Bentley', 'BMW', 'Buick', 'BYD', 'Cadillac',
    'Changan', 'Chery', 'Chevrolet', 'Chrysler', 'Citroen', 'Daewoo', 'Dodge',
    'Dongfeng', 'Exeed', 'FAW', 'Ferrari', 'Fiat', 'Ford', 'Foton', 'GAZ', 'Geely',
    'Genesis', 'Great Wall', 'Haval', 'Honda', 'Hyundai', 'Infiniti', 'Isuzu', 'JAC',
    'Jaguar', 'Jeep', 'Kia', 'Lada (VAZ)', 'Lamborghini', 'Land Rover', 'Lexus',
    'Lifan', 'Lincoln', 'Maserati', 'Mazda', 'Mini', 'Mitsubishi', 'Nissan', 'Opel',
    'Peugeot', 'Porsche', 'Ravon', 'Renault', 'Rolls-Royce', 'Seat', 'Skoda', 'Smart',
    'SsangYong', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'UAZ', 'Volkswagen', 'Volvo',
    'Zeekr',
]


def add_brands(apps, schema_editor):
    CarBrand = apps.get_model('api', 'CarBrand')
    for name in BRANDS:
        if not CarBrand.objects.filter(name__iexact=name).exists():
            CarBrand.objects.create(name=name)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_carbrand_ordering'),
    ]

    operations = [
        migrations.RunPython(add_brands, migrations.RunPython.noop),
    ]
