from rest_framework import generics, viewsets, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import api_view
from rest_framework import status

from django.core.exceptions import ObjectDoesNotExist, ValidationError as ModelValidationError
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.http import JsonResponse
from django.templatetags.static import static
from django.utils import timezone

from .forms import VisitForm
from .models import Ticket, Guest
from .serializers import TicketSerializer, GuestSerializer
from .services import set_visit_party
from .qr import qr_png_base64


# Create your views here.
# Tickets
class TicketCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        form = VisitForm(request.data)
        if not form.is_valid():
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            tickets, created = set_visit_party(request.user, **form.cleaned_data)
        except ModelValidationError as error:
            raise ValidationError(
                error.message_dict if hasattr(error, "message_dict") else error.messages
            ) from error
        return Response(
            TicketSerializer(tickets, many=True).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class TicketValidationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        form = TicketCode(data=request.data)
        form.is_valid(raise_exception=True)
        try:
            ticket = Ticket.objects.select_related("user", "guest").get(
                user=request.user, ticket_id=form.validated_data["ticket_id"],
            )
        except Ticket.DoesNotExist:
            raise ValidationError({"detail": "No park-entry ticket with this code was found in your account."})
        except Ticket.MultipleObjectsReturned:
            raise ValidationError({"detail": "This code matches more than one ticket. Ask the park team for help."})
        guest = getattr(ticket, "guest", None) if ticket.guest_number else None
        today = timezone.localdate()
        response = Response({
            "message": "Ticket found. Check the visit date before entry.",
            "ticket": TicketSerializer(ticket).data,
            "visitor_name": (guest.name if guest and guest.name else f"Guest {ticket.guest_number}") if ticket.guest_number else ticket.user.name,
            "visit_status": "today" if ticket.date_of_visit == today else "upcoming" if ticket.date_of_visit > today else "past",
        })
        response["Cache-Control"] = "private, no-store"
        return response


class TicketCode(serializers.Serializer):
    ticket_id = serializers.CharField(max_length=200, trim_whitespace=True)


class TicketQRView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        ticket = get_object_or_404(Ticket.objects.select_related("user", "guest"), pk=pk, user=request.user)
        guest = getattr(ticket, "guest", None)
        response = Response({
            "ticket": TicketSerializer(ticket).data,
            "guest": GuestSerializer(guest).data if guest else None,
            "image": f"data:image/png;base64,{qr_png_base64(ticket.ticket_id)}",
        })
        response["Cache-Control"] = "private, no-store"
        return response


@login_required
def book_visit(request):
    if request.method == "POST":
        form = VisitForm(request.POST)
        if form.is_valid():
            try:
                tickets, _ = set_visit_party(request.user, **form.cleaned_data)
            except ModelValidationError as error:
                form.add_error(None, error)
            else:
                return render(
                    request,
                    "ticketApp/book_visit.html",
                    {"form": form, "qr_codes": [qr_png_base64(ticket.ticket_id) for ticket in tickets]},
                )

    else:
        form = VisitForm()

    return render(request, "ticketApp/book_visit.html", {"form": form})


def login_view(request):
    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get("username")
            password = form.cleaned_data.get("password")
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect("book_visit")
    else:
        form = AuthenticationForm()
    return render(request, "ticketApp/login.html", {"form": form})


def logout_view(request):
    logout(request)
    return redirect("ticket_login")


class UserTicketsListAPIView(generics.ListAPIView):
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tickets = Ticket.objects.filter(user=self.request.user).select_related("user")
        if "date_of_visit" in self.request.query_params:
            date = serializers.DateField().run_validation(self.request.query_params["date_of_visit"])
            tickets = tickets.filter(date_of_visit=date)
        return tickets.order_by("-date_of_visit", "guest_number", "pk")


class GuestViewSet(viewsets.ModelViewSet):
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer

    def get_queryset(self):
        return super().get_queryset().filter(ticket__user=self.request.user)


@api_view(["GET"])
def get_guest_by_ticket(request):
    ticket_id = serializers.IntegerField(min_value=1).run_validation(request.GET.get("ticket_id"))
    if ticket_id:
        try:
            guest = Guest.objects.get(ticket__id=ticket_id, ticket__user=request.user)
            serializer = GuestSerializer(guest)
            return Response(serializer.data)
        except ObjectDoesNotExist:
            return Response(
                {"error": "No guest found for this ticket id"},
                status=status.HTTP_404_NOT_FOUND,
            )


class AvatarURLsView(APIView):
    def get(self, request, *args, **kwargs):
        PICTURE_CHOICES = [
            ("boy_1", "Boy 1"),
            ("boy_2", "Boy 2"),
            ("boy", "Boy"),
            ("catwoman", "Catwoman"),
            ("girl_1", "Girl 1"),
            ("girl_2", "Girl 2"),
            ("girl", "Girl"),
            ("punk", "Punk"),
            ("woman", "Woman"),
        ]
        urls = {
            id: request.build_absolute_uri(static(f"ticketApp/profile_icons/{id}.png"))
            for id, _ in PICTURE_CHOICES
        }
        return JsonResponse(urls)
