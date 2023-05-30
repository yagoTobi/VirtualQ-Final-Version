from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import RideReservationViewSet

router = DefaultRouter()
router.register(r"reservations", RideReservationViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
