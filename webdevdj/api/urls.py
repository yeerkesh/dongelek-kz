from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views
from .serializers import CustomTokenObtainPairSerializer

urlpatterns = [
    path('brands/', views.brand_list),
    path('messages/', views.message_list),
    path('register/', views.register_view),
    path('login/', TokenObtainPairView.as_view(serializer_class=CustomTokenObtainPairSerializer), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('my-messages/', views.MyMessagesAPIView.as_view()),
    path('conversations/', views.ConversationListAPIView.as_view()),
    path('conversations/<int:car_id>/<int:user_id>/', views.ThreadAPIView.as_view()),
    path('unread-count/', views.UnreadCountAPIView.as_view()),
    path('cars-cbv/', views.CarListCreateAPIView.as_view()),
    path('cars-cbv/<int:pk>/', views.CarDetailAPIView.as_view()),
    path('my-cars/', views.MyCarsAPIView.as_view()),
    path('profile/', views.ProfileAPIView.as_view()),
]
