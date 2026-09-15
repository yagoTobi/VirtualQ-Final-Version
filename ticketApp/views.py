import qrcode
import io
import base64
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

from .forms import VisitForm
from .models import Ticket, Guest
from .serializers import TicketSerializer, GuestSerializer
from .services import set_visit_party


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
        if not Ticket.objects.filter(
            user=request.user, ticket_id=request.data.get("ticket_id")
        ).exists():
            raise ValidationError({"detail": "Invalid ticket"})
        return Response({"message": "Ticket is valid"})


class TicketQRView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        ticket = get_object_or_404(Ticket.objects.select_related("user", "guest"), pk=pk, user=request.user)
        guest = getattr(ticket, "guest", None)
        return Response({
            "ticket": TicketSerializer(ticket).data,
            "guest": GuestSerializer(guest).data if guest else None,
            "image": f"data:image/png;base64,{_generate_qr_code(ticket.ticket_id)}",
        })


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
                    {"form": form, "qr_codes": [_generate_qr_code(ticket.ticket_id) for ticket in tickets]},
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
    img.save(buffered, format="PNG")
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
