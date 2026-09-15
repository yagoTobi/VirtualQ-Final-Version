import { useState } from "react";
import { router } from "expo-router";
import { Page } from "@/components/page";
import { RequireAuth } from "@/components/require-auth";
import { Field } from "@/components/field";
import { DateField } from "@/components/date-field";
import { ErrorMessage } from "@/components/feedback";
import { Card } from "@/components/ui/card";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { localDate } from "@/lib/dates";

export default function Profile() {
  return (
    <RequireAuth>
      <ProfileForm />
    </RequireAuth>
  );
}

function ProfileForm() {
  const { user, token, refresh } = useAuth();
  const [form, setForm] = useState({
    name: user!.name,
    last_name: user!.last_name,
    email: user!.email,
    dob: user!.dob || "",
    height: user!.height?.toString() || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const change = (key: keyof typeof form) => (value: string) =>
    setForm({ ...form, [key]: value });
  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/clients/update/", token, {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          dob: form.dob || null,
          height: form.height || null,
        }),
      });
      await refresh();
      router.dismissTo("/account");
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title="Your details"
      subtitle="Keep your information ready for your next visit."
    >
      <Card size="sm" className="w-full max-w-lg self-center">
        <Field
          label="First name"
          value={form.name}
          onChangeText={change("name")}
          autoCapitalize="words"
          autoComplete="given-name"
          maxLength={30}
        />
        <Field
          label="Last name"
          value={form.last_name}
          onChangeText={change("last_name")}
          autoCapitalize="words"
          autoComplete="family-name"
          maxLength={150}
        />
        <Field
          label="Email"
          value={form.email}
          onChangeText={change("email")}
          keyboardType="email-address"
          autoComplete="email"
          autoCorrect={false}
        />
        <DateField
          label="Date of birth (optional)"
          value={form.dob}
          onChange={change("dob")}
          maximum={localDate()}
        />
        {!!form.dob && (
          <Button variant="link" onPress={() => change("dob")("")}>
            <ButtonText>Clear date of birth</ButtonText>
          </Button>
        )}
        <Field
          label="Height in cm"
          value={form.height}
          onChangeText={change("height")}
          keyboardType="number-pad"
          maxLength={3}
          hint="Required to reserve height-restricted rides."
        />
        <ErrorMessage error={error} />
        <Button
          onPress={save}
          isDisabled={
            busy ||
            !form.name.trim() ||
            !form.last_name.trim() ||
            !form.email.trim()
          }
        >
          {busy && <ButtonSpinner />}
          <ButtonText>{busy ? "Saving…" : "Save details"}</ButtonText>
        </Button>
        <Button variant="outline" onPress={() => router.dismissTo("/account")}>
          <ButtonText>Cancel</ButtonText>
        </Button>
      </Card>
    </Page>
  );
}
