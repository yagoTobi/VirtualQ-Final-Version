from django.urls import path, include
from rest_framework.routers import DefaultRouter
from storeApp.views import StoreViewSet, ProductViewSet

router = DefaultRouter()
router.register(r"stores", StoreViewSet)
router.register(r"products", ProductViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
