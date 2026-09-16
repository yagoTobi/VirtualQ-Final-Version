from django.test import TestCase, Client
from django.urls import reverse
from django.test import override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient
from datetime import date
from .models import CustomUser
from django.contrib.auth.models import Permission
from django.contrib.auth.forms import AdminPasswordChangeForm
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from unittest.mock import patch


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
            "password": "Good-visitor-password-2026!",
            "name": "Test",
            "last_name": "User",
            "dob": "1990-01-01",
        }
        response = self.client.post(reverse("signup"), user_data)
        self.assertEqual(response.status_code, 201)
        self.assertTrue(CustomUser.objects.filter(username="testuser").exists())
        self.assertEqual(CustomUser.objects.get(username="testuser").name, "Test")

    def test_login_user(self):
        login_data = {"username": "user1", "password": "pass"}
        response = self.client.post(reverse("login"), login_data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.json())

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

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_reset_password(self):
        response = self.client.post(
            reverse("resetpassword"), {"email": "user1@test.com"}
        )
        self.assertEqual(response.status_code, 200)
        from django.core import mail
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("/reset-password/", mail.outbox[0].body)
        self.assertNotIn("token", response.json())
        self.assertNotIn("uid", response.json())
        unknown = self.client.post(reverse("resetpassword"), {"email": "missing@example.test"})
        self.assertEqual(response.json(), unknown.json())

    def test_weak_password_and_future_birth_date_are_rejected(self):
        for data in (
            {"password": "12345678"},
            {"dob": "2999-01-01", "password": "Good-visitor-password-2026!"},
        ):
            response = self.client.post(reverse("signup"), {
                "username": "new", "name": "New", "last_name": "Visitor",
                "email": "new@example.test", **data,
            })
            self.assertEqual(response.status_code, 400)
        self.assertFalse(CustomUser.objects.filter(username="new").exists())

    def test_logout_revokes_token(self):
        key = Token.objects.get(user=self.user1).key
        self.api_client.credentials(HTTP_AUTHORIZATION=f"Token {key}")
        self.assertEqual(self.api_client.post(reverse("logout")).status_code, 204)
        self.assertEqual(self.api_client.get(reverse("user_info")).status_code, 401)

    def test_password_reset_revokes_api_token_and_cannot_be_replayed(self):
        key = Token.objects.get(user=self.user1).key
        self.api_client.credentials(HTTP_AUTHORIZATION=f"Token {key}")
        url = reverse("password_reset_confirm", kwargs={
            "uidb64": urlsafe_base64_encode(force_bytes(self.user1.pk)),
            "token": default_token_generator.make_token(self.user1),
        })
        form_url = self.client.get(url).url
        weak = self.client.post(form_url, {
            "new_password1": "12345678", "new_password2": "12345678",
        })
        self.assertEqual(weak.status_code, 200)
        self.assertTrue(weak.context["form"].errors)
        self.assertEqual(self.api_client.get(reverse("user_info")).status_code, 200)
        password = "New-visitor-password-2026!"
        response = self.client.post(form_url, {
            "new_password1": password, "new_password2": password,
        })
        self.assertRedirects(response, reverse("password_reset_complete"))
        self.assertEqual(self.api_client.get(reverse("user_info")).status_code, 401)
        replay = Client().get(url)
        self.assertFalse(replay.context["validlink"])
        self.assertEqual(self.client.post(reverse("login"), {
            "username": "user1", "password": "pass",
        }).status_code, 400)
        signed_in = self.client.post(reverse("login"), {
            "username": "user1", "password": password,
        })
        self.assertEqual(signed_in.status_code, 200)
        self.assertNotEqual(signed_in.json()["token"], key)

    def test_admin_password_changes_revoke_tokens_but_profile_edits_do_not(self):
        key = Token.objects.get(user=self.user1).key
        self.user1.name = "Updated"
        self.user1.save()
        self.assertEqual(Token.objects.get(user=self.user1).key, key)
        self.user1.set_password("Not-saved-yet-2026!")
        self.user1.save(update_fields=["name"])
        self.assertEqual(Token.objects.get(user=self.user1).key, key)
        self.user1.refresh_from_db()
        form = AdminPasswordChangeForm(self.user1, {
            "password1": "Admin-changed-password-2026!",
            "password2": "Admin-changed-password-2026!",
            "usable_password": "true",
        })
        self.assertTrue(form.is_valid(), form.errors)
        form.save()
        self.assertFalse(Token.objects.filter(user=self.user1).exists())

        Token.objects.create(user=self.user1)
        self.user1.set_unusable_password()
        self.user1.save(update_fields=["password"])
        self.assertFalse(Token.objects.filter(user=self.user1).exists())

    def test_login_cannot_issue_a_token_after_password_changes_during_authentication(self):
        stale_user = CustomUser.objects.get(pk=self.user1.pk)

        def reset_before_issuing_token(**kwargs):
            self.user1.set_password("Password-changed-during-login-2026!")
            self.user1.save(update_fields=["password"])
            return stale_user

        with patch("clientApp.views.authenticate", side_effect=reset_before_issuing_token):
            response = self.client.post(reverse("login"), {
                "username": "user1", "password": "pass",
            })
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Token.objects.filter(user=self.user1).exists())

    def test_password_change_and_token_revocation_roll_back_together(self):
        original = self.user1.password
        key = Token.objects.get(user=self.user1).key
        self.user1.set_password("Must-not-survive-rollback-2026!")
        with patch("django.db.models.query.QuerySet.delete", side_effect=RuntimeError("revocation failed")):
            with self.assertRaisesMessage(RuntimeError, "revocation failed"):
                self.user1.save(update_fields=["password"])
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.password, original)
        self.assertEqual(Token.objects.get(user=self.user1).key, key)

    def test_in_flight_profile_update_cannot_restore_an_old_password(self):
        stale_user = CustomUser.objects.get(pk=self.user1.pk)
        password = "Password-reset-before-profile-save-2026!"
        self.user1.set_password(password)
        self.user1.save(update_fields=["password"])
        self.api_client.force_authenticate(user=stale_user)
        response = self.api_client.patch(reverse("user_update"), {"name": "Updated"})
        self.assertEqual(response.status_code, 200)
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.name, "Updated")
        self.assertTrue(self.user1.check_password(password))
        self.assertFalse(Token.objects.filter(user=self.user1).exists())

    def test_staff_capabilities_are_read_only_and_match_model_permissions(self):
        permission = Permission.objects.get(
            content_type__app_label="rideApp", codename="view_themeparkride",
        )
        self.user1.is_staff = True
        self.user1.save(update_fields=["is_staff"])
        self.user1.user_permissions.add(permission)
        self.api_client.force_authenticate(user=self.user1)
        response = self.api_client.get(reverse("user_info"))
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["is_staff"])
        self.assertEqual(response.data["permissions"], ["rideApp.view_themeparkride"])

        self.api_client.force_authenticate(user=self.user2)
        response = self.api_client.patch(reverse("user_update"), {
            "is_staff": True, "is_superuser": True,
            "permissions": ["rideApp.delete_themeparkride"],
            "user_permissions": [permission.pk],
        }, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["is_staff"])
        self.assertEqual(response.data["permissions"], [])
        self.user2.refresh_from_db()
        self.assertFalse(self.user2.is_staff)
        self.assertFalse(self.user2.is_superuser)
        self.assertFalse(self.user2.user_permissions.exists())

    def test_signup_cannot_assign_staff_privileges(self):
        response = self.api_client.post(reverse("signup"), {
            "username": "visitor-only", "name": "New", "last_name": "Visitor",
            "email": "visitor-only@example.test",
            "password": "Good-visitor-password-2026!",
            "is_staff": True, "is_superuser": True,
            "permissions": ["rideApp.change_themeparkride"],
        }, format="json")
        self.assertEqual(response.status_code, 201)
        user = CustomUser.objects.get(username="visitor-only")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.user_permissions.exists())
