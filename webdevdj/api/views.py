from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import CarBrand, Car, Message, Profile
from .serializers import CarBrandSerializer, CarSerializer, MessageSerializer, ProfileSerializer
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Q, F



# ----------- CAR BRANDS -----------

@api_view(['GET', 'POST'])
def brand_list(request):
    if request.method == 'GET':
        brands = CarBrand.objects.all()
        serializer = CarBrandSerializer(brands, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        # only admins (staff) can add new brands
        if not (request.user.is_authenticated and request.user.is_staff):
            return Response({'error': 'Only admin can add brands'}, status=403)
        serializer = CarBrandSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


# ----------- MESSAGES -----------

@api_view(['GET', 'POST'])
def message_list(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=401)

    if request.method == 'GET':
        messages = Message.objects.filter(
            Q(sender=request.user) | Q(receiver=request.user)
        )
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = MessageSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(sender=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
@api_view(['POST'])
def register_view(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if not username or not email or not password:
        return Response(
            {'error': 'Username, email and password are required', 'code': 'required'},
            status=400
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already exists', 'code': 'username_taken'},
            status=400
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email already exists', 'code': 'email_taken'},
            status=400
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    return Response({
        'message': 'User created successfully',
        'username': user.username,
        'email': user.email
    }, status=201)

def _cars_queryset():
    """Cars with everything the serializer needs (fewer database queries)."""
    return Car.objects.select_related('brand', 'owner', 'owner__profile').prefetch_related('images')


class CarListCreateAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        cars = _cars_queryset()
        serializer = CarSerializer(cars, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)

        serializer = CarSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=400)


class CarDetailAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_object(self, pk):
        return get_object_or_404(_cars_queryset(), pk=pk)

    def get(self, request, pk):
        car = self.get_object(pk)

        # count the view (the owner looking at his own ad is not counted)
        if car.owner_id != (request.user.id if request.user.is_authenticated else None):
            Car.objects.filter(pk=car.pk).update(views_count=F('views_count') + 1)
            car.views_count += 1

        serializer = CarSerializer(car, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        car = self.get_object(pk)

        if car.owner != request.user:
            return Response({'error': 'You can edit only your own car'}, status=403)

        serializer = CarSerializer(car, data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        car = self.get_object(pk)

        if car.owner != request.user:
            return Response({'error': 'You can delete only your own car'}, status=403)

        car.delete()
        return Response(status=204)


class CarPhoneAPIView(APIView):
    """Shows the phone number of the ad (the "Show phone" button)."""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        car = get_object_or_404(_cars_queryset(), pk=pk)
        phone = car.contact_phone
        if not phone:
            return Response({'error': 'No phone number'}, status=404)
        return Response({'phone': phone})


class MyCarsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cars = _cars_queryset().filter(owner=request.user)
        serializer = CarSerializer(cars, many=True, context={'request': request})
        return Response(serializer.data)


class MyMessagesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        messages = Message.objects.filter(receiver=request.user)
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)


class ProfileAPIView(APIView):
    """GET - data of the current user, PUT - update email / phone / city."""
    permission_classes = [IsAuthenticated]

    def _data(self, user):
        profile, _ = Profile.objects.get_or_create(user=user)
        return {
            'username': user.username,
            'email': user.email,
            'phone': profile.phone,
            'city': profile.city,
            'date_joined': user.date_joined,
            'is_staff': user.is_staff,
            'cars_count': Car.objects.filter(owner=user).count(),
        }

    def get(self, request):
        return Response(ProfileSerializer(self._data(request.user)).data)

    def put(self, request):
        serializer = ProfileSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        user = request.user
        profile, _ = Profile.objects.get_or_create(user=user)
        data = serializer.validated_data

        if 'email' in data and data['email'] != user.email:
            if data['email'] and User.objects.filter(email=data['email']).exclude(pk=user.pk).exists():
                return Response({'error': 'Email already exists', 'code': 'email_taken'}, status=400)
            user.email = data['email']
            user.save()
        if 'phone' in data:
            profile.phone = data['phone']
        if 'city' in data:
            profile.city = data['city']
        profile.save()
        return Response(ProfileSerializer(self._data(user)).data)


class ConversationListAPIView(APIView):
    """List of conversations of the current user.
    One conversation = one car + one other person."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        me = request.user
        messages = (
            Message.objects
            .filter(Q(sender=me) | Q(receiver=me))
            .select_related('sender', 'receiver', 'car')
            .order_by('-created_at')
        )

        conversations = {}
        for m in messages:
            other = m.receiver if m.sender_id == me.id else m.sender
            key = (m.car_id, other.id)
            if key not in conversations:
                # messages are sorted from new to old, so the first one is the last message
                conversations[key] = {
                    'car_id': m.car_id,
                    'car_title': m.car.title,
                    'car_image_url': m.car.image_url,
                    'other_user_id': other.id,
                    'other_username': other.username,
                    'last_text': m.text,
                    'last_at': m.created_at,
                    'last_from_me': m.sender_id == me.id,
                    'unread': 0,
                }
            if m.receiver_id == me.id and not m.is_read:
                conversations[key]['unread'] += 1

        return Response(list(conversations.values()))


class ThreadAPIView(APIView):
    """All messages between the current user and another user about one car.
    Opening the thread marks incoming messages as read."""
    permission_classes = [IsAuthenticated]

    def get(self, request, car_id, user_id):
        me = request.user
        car = get_object_or_404(Car, pk=car_id)
        other = get_object_or_404(User, pk=user_id)

        thread = (
            Message.objects
            .filter(car=car)
            .filter(
                Q(sender=me, receiver=other) | Q(sender=other, receiver=me)
            )
            .select_related('sender', 'receiver', 'car')
            .order_by('created_at')
        )

        Message.objects.filter(
            car=car, sender=other, receiver=me, is_read=False
        ).update(is_read=True)

        return Response({
            'car': {
                'id': car.id,
                'title': car.title,
                'image_url': car.image_url,
                'owner': car.owner_id,
            },
            'other_user': {'id': other.id, 'username': other.username},
            'messages': MessageSerializer(thread, many=True).data,
        })


class UnreadCountAPIView(APIView):
    """Number of unread messages (for the red badge in the navbar)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Message.objects.filter(receiver=request.user, is_read=False).count()
        return Response({'count': count})


# ----------- SEARCH -----------

def _norm(text):
    """Lower-case text for comparison. Done in Python because SQLite
    compares only Latin letters case-insensitively (Cyrillic would fail)."""
    return (text or '').casefold()


def _car_card(car):
    return {
        'id': car.id,
        'title': car.title,
        'brand': car.brand_id,
        'brand_name': car.brand.name,
        'price': car.price,
        'year': car.year,
        'mileage': car.mileage,
        'image_url': car.image_url,
        'owner': car.owner_id,
        'city': car.city,
    }


class SearchAPIView(APIView):
    """Global search over three kinds of data: cars, brands and sellers.
    GET /api/search/?q=text"""
    permission_classes = [AllowAny]

    def get(self, request):
        raw = request.query_params.get('q', '').strip()
        q = _norm(raw)
        result = {'query': raw, 'cars': [], 'brands': [], 'sellers': []}
        if len(q) < 2:
            return Response(result)

        active_cars = list(
            Car.objects.filter(is_active=True).select_related('brand', 'owner')
        )

        # --- cars: title (best) > brand / year > description
        scored = []
        for car in active_cars:
            score = 0
            if q in _norm(car.title):
                score += 3
            if q in _norm(car.brand.name):
                score += 2
            if q == str(car.year):
                score += 2
            if q in _norm(car.city):
                score += 1
            if q in _norm(car.description):
                score += 1
            if score:
                scored.append((score, car))
        scored.sort(key=lambda item: (-item[0], -item[1].id))
        result['cars'] = [_car_card(car) for _, car in scored[:30]]

        # --- brands (with the number of active cars)
        counts = {}
        for car in active_cars:
            counts[car.brand_id] = counts.get(car.brand_id, 0) + 1
        for brand in CarBrand.objects.all():
            if q in _norm(brand.name):
                result['brands'].append({
                    'id': brand.id,
                    'name': brand.name,
                    'cars_count': counts.get(brand.id, 0),
                })

        # --- sellers: users who have active cars, by username or city
        sellers = {}
        for car in active_cars:
            if car.owner_id is None:
                continue
            seller = sellers.setdefault(car.owner_id, {'user': car.owner, 'cars_count': 0})
            seller['cars_count'] += 1
        profiles = {p.user_id: p for p in Profile.objects.filter(user_id__in=sellers.keys())}
        for user_id, data in sellers.items():
            profile = profiles.get(user_id)
            city = profile.city if profile else ''
            if q in _norm(data['user'].username) or q in _norm(city):
                result['sellers'].append({
                    'id': user_id,
                    'username': data['user'].username,
                    'city': city,
                    'cars_count': data['cars_count'],
                })
        result['sellers'] = result['sellers'][:10]

        return Response(result)


class SellerAPIView(APIView):
    """Public page of a seller: name, city and his active cars.
    (no email and no phone are shown)"""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        profile = Profile.objects.filter(user=user).first()
        cars = Car.objects.filter(owner=user, is_active=True).select_related('brand').order_by('-id')
        return Response({
            'id': user.id,
            'username': user.username,
            'city': profile.city if profile else '',
            'date_joined': user.date_joined,
            'cars': [_car_card(car) for car in cars],
        })
