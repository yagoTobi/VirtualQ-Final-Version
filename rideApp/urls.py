from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ThemeParkViewSet, ThemeParkAreaViewSet, ThemeParkRideViewSet

router = DefaultRouter()
router.register(r'theme_parks', ThemeParkViewSet)
router.register(r'theme_park_areas', ThemeParkAreaViewSet)
router.register(r'theme_park_rides', ThemeParkRideViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
