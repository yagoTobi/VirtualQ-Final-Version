from django.test import TestCase, Client
from django.urls import reverse
from django.test import override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient
from datetime import timedelta
from .models import CustomUser
from django.contrib.auth.models import Permission
from django.contrib.auth.forms import AdminPasswordChangeForm
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from unittest.mock import patch
from secrets import token_urlsafe
from urllib.parse import parse_qs, urlsplit
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from django.core.cache import cache
from django.db import close_old_connections, connection
from django.test import TransactionTestCase
from django.contrib.auth.views import INTERNAL_RESET_SESSION_TOKEN


class UserTest(TestCase):
    def setUp(self):
        cache.clear()
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

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
        VIRTUALQ_WEB_ORIGIN="https://visitor.example.test",
    )
    def test_reset_password(self):
        response = self.client.post(
            reverse("resetpassword"), {"email": "user1@test.com"}
        )
        self.assertEqual(response.status_code, 200)
        from django.core import mail
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("https://visitor.example.test/set-password#uid=", mail.outbox[0].body)
        self.assertNotIn("testserver", mail.outbox[0].body)
        self.assertNotIn("?uid=", mail.outbox[0].body)
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
        page = self.client.get(url)
        self.assertEqual(page.status_code, 302)
        self.assertIn("no-store", page["Cache-Control"])
        self.assertEqual(page["Referrer-Policy"], "no-referrer")
        destination = urlsplit(page.url)
        self.assertEqual(destination.path, "/set-password")
        self.assertEqual(destination.query, "")
        credentials = {key: values[0] for key, values in parse_qs(destination.fragment).items()}
        checked = self.client.post(reverse("check_password_reset"), credentials)
        self.assertEqual(checked.status_code, 200)
        self.assertEqual(len(checked.json()["password_help"]), 4)
        self.assertIn("no-store", checked["Cache-Control"])
        endpoint = reverse("confirm_password_reset")
        weak = self.client.post(endpoint, {
            **credentials,
            "new_password1": "12345678", "new_password2": "12345678",
        })
        self.assertEqual(weak.status_code, 400)
        self.assertIn("new_password2", weak.json())
        self.assertEqual(self.api_client.get(reverse("user_info")).status_code, 200)
        password = token_urlsafe(24)
        payload = {
            **credentials,
            "new_password1": password, "new_password2": password,
        }
        response = self.client.post(endpoint, payload)
        self.assertEqual(response.status_code, 204)
        self.assertIn("no-store", response["Cache-Control"])
        self.assertEqual(self.api_client.get(reverse("user_info")).status_code, 401)
        replay = self.api_client.post(endpoint, payload)
        self.assertEqual(replay.status_code, 400)
        self.assertIn("token", replay.json())
        self.assertEqual(self.client.post(reverse("check_password_reset"), credentials).status_code, 400)
        self.assertEqual(self.client.post(reverse("login"), {
            "username": "user1", "password": "pass",
        }).status_code, 400)
        signed_in = self.client.post(reverse("login"), {
            "username": "user1", "password": password,
        })
        self.assertEqual(signed_in.status_code, 200)
        self.assertNotEqual(signed_in.json()["token"], key)

    def test_reset_rejects_bad_links_and_mismatched_passwords_without_changing_credentials(self):
        uid = urlsafe_base64_encode(force_bytes(self.user1.pk))
        token = default_token_generator.make_token(self.user1)
        original = self.user1.password
        key = Token.objects.get(user=self.user1).key
        password = token_urlsafe(24)
        payload = {"uid": uid, "token": token, "new_password1": password, "new_password2": password}
        for changes in (
            {"uid": "not-a-user"}, {"uid": urlsafe_base64_encode(b"99999999999999999999999")},
            {"token": "invalid"}, {"uid": urlsafe_base64_encode(force_bytes(self.user2.pk))},
            {"new_password2": token_urlsafe(24)},
        ):
            response = self.client.post(reverse("confirm_password_reset"), {**payload, **changes})
            self.assertEqual(response.status_code, 400)
            if "new_password2" not in changes:
                checked = self.client.post(reverse("check_password_reset"), {**payload, **changes})
                self.assertEqual(checked.status_code, 400)
        with override_settings(PASSWORD_RESET_TIMEOUT=1):
            with patch.object(default_token_generator, "_now", return_value=default_token_generator._now() + timedelta(seconds=2)):
                response = self.client.post(reverse("confirm_password_reset"), payload)
        self.assertEqual(response.status_code, 400)
        self.user1.is_active = False
        self.user1.save(update_fields=["is_active"])
        response = self.client.post(reverse("confirm_password_reset"), payload)
        self.assertEqual(response.status_code, 400)
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.password, original)
        self.assertEqual(Token.objects.get(user=self.user1).key, key)

    @override_settings(VIRTUALQ_WEB_ORIGIN="https://visitor.example.test")
    def test_legacy_reset_session_and_completion_links_reach_the_shared_visitor_app(self):
        token = default_token_generator.make_token(self.user1)
        session = self.client.session
        session[INTERNAL_RESET_SESSION_TOKEN] = token
        session.save()
        url = reverse("password_reset_confirm", kwargs={
            "uidb64": urlsafe_base64_encode(force_bytes(self.user1.pk)), "token": "set-password",
        })
        response = self.client.get(url)
        self.assertEqual(parse_qs(urlsplit(response.url).fragment)["token"], [token])
        self.assertNotIn(INTERNAL_RESET_SESSION_TOKEN, self.client.session)
        self.assertEqual(self.client.get(reverse("password_reset_complete")).url, "https://visitor.example.test/sign-in")

    def test_admin_password_changes_revoke_tokens_but_profile_edits_do_not(self):
        key = Token.objects.get(user=self.user1).key
        self.user1.name = "Updated"
        self.user1.save()
        self.assertEqual(Token.objects.get(user=self.user1).key, key)
        self.user1.set_password(token_urlsafe(24))
        self.user1.save(update_fields=["name"])
        self.assertEqual(Token.objects.get(user=self.user1).key, key)
        self.user1.refresh_from_db()
        password = token_urlsafe(24)
        form = AdminPasswordChangeForm(self.user1, {
            "password1": password,
            "password2": password,
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
            self.user1.set_password(token_urlsafe(24))
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
        self.user1.set_password(token_urlsafe(24))
        with patch("django.db.models.query.QuerySet.delete", side_effect=RuntimeError("revocation failed")):
            with self.assertRaisesMessage(RuntimeError, "revocation failed"):
                self.user1.save(update_fields=["password"])
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.password, original)
        self.assertEqual(Token.objects.get(user=self.user1).key, key)

    def test_in_flight_profile_update_cannot_restore_an_old_password(self):
        stale_user = CustomUser.objects.get(pk=self.user1.pk)
        password = token_urlsafe(24)
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


class ConcurrentPasswordResetTest(TransactionTestCase):
    def test_reset_link_can_only_be_used_once_by_simultaneous_requests(self):
        if connection.vendor == "sqlite" and "mode=memory" in connection.settings_dict["NAME"]:
            self.skipTest("Run with DJANGO_TEST_DATABASE_PATH for file-backed SQLite transactions.")
        cache.clear()
        user = CustomUser.objects.create_user(
            username="reset-race", email="reset-race@example.test", password=token_urlsafe(24),
        )
        credentials = {
            "uid": urlsafe_base64_encode(force_bytes(user.pk)),
            "token": default_token_generator.make_token(user),
        }
        passwords = [token_urlsafe(24), token_urlsafe(24)]
        barrier = Barrier(2)

        def attempt(index):
            close_old_connections()
            try:
                barrier.wait(timeout=10)
                response = APIClient().post(reverse("confirm_password_reset"), {
                    **credentials, "new_password1": passwords[index], "new_password2": passwords[index],
                }, format="json")
                return response.status_code
            finally:
                close_old_connections()

        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(attempt, range(2)))
        self.assertEqual(sorted(results), [204, 400])
        user.refresh_from_db()
        self.assertTrue(user.check_password(passwords[results.index(204)]))
        self.assertFalse(Token.objects.filter(user=user).exists())
