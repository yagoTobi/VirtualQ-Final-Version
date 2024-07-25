from django.test import TestCase, Client
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient
from datetime import date
from .models import CustomUser


class UserTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.api_client = APIClient()
        self.user1 = CustomUser.objects.create_user(
            username="user1", password="pass", email="user1@test.com"
        )
        self.user2 = CustomUser.objects.create_user(
            username="user2", password="pass", email="user2@test.com"
        )

    def test_create_user(self):
        user_data = {
            "username": "testuser",
            "email": "testuser@test.com",
            "password": "testpassword",
            "name": "Test",
            "last_name": "User",
            "dob": "1990-01-01",
        }
        response = self.client.post(reverse("signup"), user_data)
        self.assertEqual(response.status_code, 201)
        self.assertTrue(CustomUser.objects.filter(username="testuser").exists())

    def test_login_user(self):
        login_data = {"username": "user1", "password": "pass"}
        response = self.client.post(reverse("login"), login_data)
        self.assertEqual(response.status_code, 302)

    def test_get_user_info(self):
        self.api_client.force_authenticate(user=self.user1)
        response = self.api_client.get(reverse("user_info"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "user1")

    def test_user_update(self):
        self.api_client.force_authenticate(user=self.user1)
        user_update_data = {
            "name": "User1Updated",
            "last_name": "User",
            "username": "user1",
            "email": "user1updated@test.com",
            "dob": "1990-01-01",
        }
        response = self.api_client.put(reverse("user_update"), user_update_data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "User1Updated")

    def test_reset_password(self):
        response = self.client.post(
            reverse("resetpassword"), {"email": "user1@test.com"}
        )
        self.assertEqual(response.status_code, 200)
