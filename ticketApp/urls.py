from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from .views import (
    TicketCreateView,
    TicketValidationView,
    book_visit,
    login_view,
    logout_view,
    UserTicketsListAPIView,
    GuestViewSet,
    AvatarURLsView,
    get_guest_by_ticket
)

router = routers.DefaultRouter()
router.register(r"guests", GuestViewSet)

urlpatterns = [
    path("tickets/", TicketCreateView.as_view(), name="create_ticket"),
    path("tickets/validate/", TicketValidationView.as_view(), name="validate_ticket"),
    path("book_visit/", book_visit, name="book_visit"),
    path("login/", login_view, name="login"),
    path("logout/", logout_view, name="logout"),
    path("tickets-view/", UserTicketsListAPIView.as_view(), name="user-tickets"),
    path("guests/", include(router.urls)),
    path("guests/guest-view/", get_guest_by_ticket),
    path("avatar_urls/", AvatarURLsView.as_view(), name="avatar_urls"),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
