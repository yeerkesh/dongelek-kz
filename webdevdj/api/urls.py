from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('brands/', views.brand_list),
    path('messages/', views.message_list),

    path('register/', views.register_view),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('cars-cbv/', views.CarListCreateAPIView.as_view()),
    path('cars-cbv/<int:pk>/', views.CarDetailAPIView.as_view()),
    path('my-cars/', views.MyCarsAPIView.as_view()),
]