from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import CarBrand, Car, Message, Profile
from .serializers import CarBrandSerializer, CarSerializer, MessageSerializer, ProfileSerializer
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q



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
            {'error': 'Username, email and password are required'},
            status=400
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Такой логин уже существует'},
            status=400
        )

    if User.objects.filter(email=email).exists():
        return Response(
           {'error': 'Такой email уже существует'},
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

class CarListCreateAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        cars = Car.objects.all()
        serializer = CarSerializer(cars, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)

        serializer = CarSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=400)


class CarDetailAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_object(self, pk):
        return get_object_or_404(Car, pk=pk)

    def get(self, request, pk):
        car = self.get_object(pk)
        serializer = CarSerializer(car)
        return Response(serializer.data)

    def put(self, request, pk):
        car = self.get_object(pk)

        if car.owner != request.user:
            return Response({'error': 'You can edit only your own car'}, status=403)

        serializer = CarSerializer(car, data=request.data)
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
    
class MyCarsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cars = Car.objects.filter(owner=request.user)
        serializer = CarSerializer(cars, many=True)
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
                return Response({'error': 'Такой email уже существует'}, status=400)
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
