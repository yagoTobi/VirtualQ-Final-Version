from django.test import TestCase
from django.contrib.auth import get_user_model
from datetime import date
from .models import Ticket, Guest

CustomUser = get_user_model()


class TicketModelTestCase(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="testuser", password="testpassword"
        )
        self.ticket = Ticket.objects.create(
            user=self.user, date_of_visit=date.today(), guest_number=2
        )

    def test_ticket_creation(self):
        self.assertEqual(self.ticket.user, self.user)
        self.assertEqual(self.ticket.date_of_visit, date.today())
        self.assertEqual(self.ticket.guest_number, 2)

    def test_ticket_generate_ticket_id(self):
        self.assertIsNotNone(self.ticket.ticket_id)

    def test_guest_creation(self):
        guest = Guest.objects.create(
            ticket=self.ticket, name="John Doe", age=30, height=180
        )
        self.assertEqual(guest.ticket, self.ticket)
        self.assertEqual(guest.name, "John Doe")
        self.assertEqual(guest.age, 30)
        self.assertEqual(guest.height, 180)


class GuestModelTestCase(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="testuser", password="testpassword"
        )
        self.ticket = Ticket.objects.create(
            user=self.user, date_of_visit=date.today(), guest_number=1
        )

    def test_guest_creation(self):
        guest = Guest.objects.create(
            ticket=self.ticket, name="John Doe", age=30, height=180
        )
        self.assertEqual(guest.ticket, self.ticket)
        self.assertEqual(guest.name, "John Doe")
        self.assertEqual(guest.age, 30)
        self.assertEqual(guest.height, 180)


class TicketGuestIntegrationTestCase(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="testuser", password="testpassword"
        )
        self.ticket = Ticket.objects.create(
            user=self.user, date_of_visit=date.today(), guest_number=1
        )

    def test_guest_creation_with_ticket(self):
        self.assertEqual(self.ticket.guest_number, 1)
        guest = self.ticket.guest
        self.assertEqual(guest.ticket, self.ticket)

    def test_guest_update(self):
        guest = self.ticket.guest
        guest.name = "Jane Doe"
        guest.age = 25
        guest.height = 160
        guest.save()
        updated_guest = Guest.objects.get(pk=guest.pk)
        self.assertEqual(updated_guest.name, "Jane Doe")
        self.assertEqual(updated_guest.age, 25)
        self.assertEqual(updated_guest.height, 160)
