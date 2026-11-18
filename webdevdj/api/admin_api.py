"""API of the admin panel (only for users with the role "admin" = is_staff).
Everything is under /api/manage/ :
  stats/            - numbers for the dashboard
  brands/           - CRUD of brands
  cars/             - read, update, delete of any ad
  users/            - CRUD of users (roles, blocking)
  messages/         - read and delete messages
"""
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password as check_password_strength
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Count, Sum
from rest_framework import mixins, serializers, viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from . import validators as v
from .models import Car, CarBrand, Message
from .serializers import CarSerializer, MessageSerializer


class AdminPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


def filter_by_text(queryset, text, *lookups):
    """Search in Python, because SQLite compares only Latin letters
    case-insensitively (a search for "ерке" would not find "Ерке")."""
    text = (text or '').strip().casefold()
    if not text:
        return queryset
    ids = [
        row[0] for row in queryset.values_list('id', *lookups)
        if any(text in str(value or '').casefold() for value in row[1:])
    ]
    return queryset.filter(id__in=ids)


def error(message, code, status=400):
    return Response({'error': message, 'code': code}, status=status)


# ---------------- stats ----------------

class AdminStatsAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        cars = Car.objects.all()
        by_brand = (
            CarBrand.objects.annotate(count=Count('cars'))
            .filter(count__gt=0).order_by('-count', 'name')[:8]
        )
        return Response({
            'users': User.objects.count(),
            'admins': User.objects.filter(is_staff=True).count(),
            'blocked_users': User.objects.filter(is_active=False).count(),
            'cars': cars.count(),
            'active_cars': cars.filter(is_active=True).count(),
            'brands': CarBrand.objects.count(),
            'messages': Message.objects.count(),
            'total_views': cars.aggregate(total=Sum('views_count'))['total'] or 0,
            'cars_by_brand': [{'name': b.name, 'count': b.count} for b in by_brand],
            'latest_users': [
                {'id': u.id, 'username': u.username, 'date_joined': u.date_joined}
                for u in User.objects.order_by('-date_joined')[:5]
            ],
            'latest_cars': [
                {'id': c.id, 'title': c.title, 'price': c.price,
                 'owner_username': c.owner.username if c.owner else ''}
                for c in cars.select_related('owner').order_by('-id')[:5]
            ],
        })


# ---------------- brands ----------------

class AdminBrandSerializer(serializers.ModelSerializer):
    cars_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = CarBrand
        fields = ['id', 'name', 'cars_count']

    def validate_name(self, value):
        value = ' '.join(value.split())
        if not 1 <= len(value) <= 100:
            raise serializers.ValidationError('Name must have 1-100 characters.')
        duplicates = CarBrand.objects.filter(name__iexact=value)
        if self.instance:
            duplicates = duplicates.exclude(pk=self.instance.pk)
        if duplicates.exists():
            raise serializers.ValidationError('This brand already exists.')
        return value


class AdminBrandViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminBrandSerializer
    pagination_class = AdminPagination

    def get_queryset(self):
        qs = CarBrand.objects.annotate(cars_count=Count('cars')).order_by('name')
        return filter_by_text(qs, self.request.query_params.get('q'), 'name')

    def destroy(self, request, *args, **kwargs):
        brand = self.get_object()
        if brand.cars.exists():
            return error('The brand has ads, delete or move them first.', 'brand_has_cars')
        return super().destroy(request, *args, **kwargs)


# ---------------- cars ----------------

class AdminCarViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = CarSerializer
    pagination_class = AdminPagination

    def get_queryset(self):
        qs = Car.objects.select_related('brand', 'owner', 'owner__profile') \
            .prefetch_related('images').order_by('-id')
        status = self.request.query_params.get('status')
        if status == 'active':
            qs = qs.filter(is_active=True)
        elif status == 'inactive':
            qs = qs.filter(is_active=False)
        return filter_by_text(
            qs, self.request.query_params.get('q'),
            'title', 'city', 'brand__name', 'owner__username',
        )


# ---------------- users ----------------

class AdminUserSerializer(serializers.ModelSerializer):
    cars_count = serializers.IntegerField(read_only=True)
    password = serializers.CharField(
        write_only=True, required=False, min_length=v.PASSWORD_MIN, max_length=v.PASSWORD_MAX)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'is_active',
                  'date_joined', 'last_login', 'cars_count', 'password']
        read_only_fields = ['date_joined', 'last_login']

    def validate_password(self, value):
        try:
            check_password_strength(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def validate_username(self, value):
        value = value.strip()
        if not v.USERNAME_MIN <= len(value) <= v.USERNAME_MAX or not v.USERNAME_RE.match(value):
            raise serializers.ValidationError('Invalid username.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'Password is required.'})
        return User.objects.create_user(password=password, **validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class AdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserSerializer
    pagination_class = AdminPagination

    def get_queryset(self):
        qs = User.objects.annotate(cars_count=Count('cars')).order_by('id')
        return filter_by_text(qs, self.request.query_params.get('q'), 'username', 'email')

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        # an admin cannot lock himself out
        if user.pk == request.user.pk and (
                request.data.get('is_staff') is False or request.data.get('is_active') is False):
            return error('You cannot remove your own admin role or block yourself.',
                         'cannot_change_self')
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.pk == request.user.pk:
            return error('You cannot delete yourself.', 'cannot_delete_self')
        return super().destroy(request, *args, **kwargs)


# ---------------- messages ----------------

class AdminMessageViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                          mixins.DestroyModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = MessageSerializer
    pagination_class = AdminPagination

    def get_queryset(self):
        qs = Message.objects.select_related('sender', 'receiver', 'car').order_by('-id')
        return filter_by_text(
            qs, self.request.query_params.get('q'),
            'text', 'sender__username', 'receiver__username', 'car__title',
        )
