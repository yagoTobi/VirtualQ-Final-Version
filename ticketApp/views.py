import qrcode
import io
import base64
import hashlib
from rest_framework import generics, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import api_view
from rest_framework import status

from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.http import JsonResponse
from django.templatetags.static import static
from django.utils.dateparse import parse_date

from clientApp.models import CustomUser

from .forms import VisitForm
from .models import Ticket, Guest
from .serializers import TicketSerializer, GuestSerializer


# Create your views here.
# Tickets
class TicketCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ticket_id = request.data.get("ticket_id")
        username = request.data.get("user")
        user = CustomUser.objects.get(
            username=username
        )  # Get User object from username
        try:
            ticket = Ticket.objects.get(user=user)
        except Ticket.DoesNotExist:
            raise ValidationError("Ticket does not exist")


class TicketValidationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ticket_id = request.data.get("ticket_id")  # this comes from the scanned QR code
        user = request.data.get(
            "user"
        )  # this should come from the user's information, not the QR code

        # Look up the ticket in the database
        try:
            ticket = Ticket.objects.get(user=user)
        except Ticket.DoesNotExist:
            raise ValidationError("Ticket does not exist")

        # Recreate the hash
        msg = f"{ticket.salt}_{user}_{ticket.date_of_visit}_{ticket.additional_guests}"
        expected_ticket_id = hashlib.sha256(msg.encode()).hexdigest()

        if expected_ticket_id != ticket_id:
            raise ValidationError("Invalid ticket")

        return Response({"message": "Ticket is valid"})


@login_required
def book_visit(request):
    if request.method == "POST":
        form = VisitForm(request.POST)
        if form.is_valid():
            date_of_visit = form.cleaned_data["date_of_visit"]
            additional_guests = form.cleaned_data["additional_guests"]
            additional_guests = int(additional_guests) if additional_guests else 0

            # Get existing tickets for the same day
            existing_tickets = Ticket.objects.filter(
                user=request.user, date_of_visit=date_of_visit
            )

            # If there are more existing tickets than needed, delete the extras
            if existing_tickets.count() > additional_guests + 1:  # +1 for the main user
                tickets_to_delete = existing_tickets.filter(
                    guest_number__gt=additional_guests
                )
                tickets_to_delete.delete()

            # If there are fewer existing tickets than needed, create the additional ones
            elif (
                existing_tickets.count() < additional_guests + 1
            ):  # +1 for the main user
                for i in range(
                    existing_tickets.count(), additional_guests + 1
                ):  # +1 for the main user
                    guest_ticket = Ticket.objects.create(
                        user=request.user,
                        date_of_visit=date_of_visit,
                        guest_number=i,
                    )

            # Generate QR codes for all tickets
            qr_codes = []
            for ticket in Ticket.objects.filter(
                user=request.user, date_of_visit=date_of_visit
            ):
                qr_codes.append(_generate_qr_code(ticket.ticket_id))

            return render(
                request,
                "ticketApp/book_visit.html",
                {"form": form, "qr_codes": qr_codes},
            )

    else:
        form = VisitForm()

    return render(request, "ticketApp/book_visit.html", {"form": form})


def _generate_qr_code(ticket_id):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(str(ticket_id))
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    # Convert PIL Image to base64 for use in HTML
    buffered = io.BytesIO()
    img.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return img_str


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
    return redirect("login_view")


class UserTicketsListAPIView(generics.ListAPIView):
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        date_of_visit_str = self.request.query_params.get("date_of_visit", None)
        date_of_visit = parse_date(date_of_visit_str) if date_of_visit_str else None

        if date_of_visit:
            return Ticket.objects.filter(user=user, date_of_visit=date_of_visit)
        else:
            return Ticket.objects.filter(user=user)


class GuestViewSet(viewsets.ModelViewSet):
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer


@api_view(["GET"])
def get_guest_by_ticket(request):
    ticket_id = request.GET.get("ticket_id", None)
    if ticket_id is not None:
        try:
            guest = Guest.objects.get(ticket__id=ticket_id)
            serializer = GuestSerializer(guest)
            return Response(serializer.data)
        except ObjectDoesNotExist:
            return Response(
                {"error": "No guest found for this ticket id"},
                status=status.HTTP_404_NOT_FOUND,
            )
    else:
        return Response(
            {"error": "No ticket_id provided"}, status=status.HTTP_400_BAD_REQUEST
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
