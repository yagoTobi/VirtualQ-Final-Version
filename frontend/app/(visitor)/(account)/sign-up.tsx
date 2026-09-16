import { useRef, useState } from "react";
import { Keyboard, type TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Page } from "@/components/page";
import { Field } from "@/components/field";
import { ErrorMessage } from "@/components/feedback";
import { AuthPanel } from "@/components/auth-panel";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { afterAuth } from "@/lib/after-auth";

export default function SignUp() {
  const { signIn } = useAuth();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const fields = useRef<(TextInput | null)[]>([]);
  const [form, setForm] = useState({
    name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    height: "",
  });
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const change = (field: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  async function submit() {
    if (busy) return;
    Keyboard.dismiss();
    if (form.password !== confirmation) {
      setError(new Error("The passwords do not match."));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { token } = await api<{ token: string }>(
        "/api/clients/signup/",
        null,
        {
          method: "POST",
          body: JSON.stringify({
            ...form,
            name: form.name.trim(),
            last_name: form.last_name.trim(),
            username: form.username.trim(),
            email: form.email.trim(),
            height: form.height || null,
          }),
        },
      );
      await signIn(token);
      router.dismissTo("/account");
      const destination = afterAuth(next);
      if (destination !== "/account") router.navigate(destination);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page>
      <AuthPanel>
        <VStack space="sm">
          <Heading size="2xl">Your next park day.</Heading>
          <Text className="text-muted-foreground">
            Create an account to keep your tickets and plans together.
          </Text>
        </VStack>
        <Field
          label="First name"
          ref={(field) => {
            fields.current[0] = field;
          }}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => fields.current[1]?.focus()}
          value={form.name}
          onChangeText={change("name")}
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
          maxLength={30}
        />
        <Field
          label="Last name"
          ref={(field) => {
            fields.current[1] = field;
          }}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => fields.current[2]?.focus()}
          value={form.last_name}
          onChangeText={change("last_name")}
          autoCapitalize="words"
          autoComplete="family-name"
          textContentType="familyName"
          maxLength={150}
        />
        <Field
          label="Username"
          ref={(field) => {
            fields.current[2] = field;
          }}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => fields.current[3]?.focus()}
          value={form.username}
          onChangeText={change("username")}
          autoComplete="username-new"
          textContentType="username"
          autoCorrect={false}
          maxLength={150}
        />
        <Field
          label="Email"
          ref={(field) => {
            fields.current[3] = field;
          }}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => fields.current[4]?.focus()}
          value={form.email}
          onChangeText={change("email")}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          autoCorrect={false}
        />
        <Field
          label="Password"
          ref={(field) => {
            fields.current[4] = field;
          }}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => fields.current[5]?.focus()}
          value={form.password}
          onChangeText={change("password")}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          hint="Use at least 8 characters. Avoid common passwords and personal details."
        />
        <Field
          label="Confirm password"
          ref={(field) => {
            fields.current[5] = field;
          }}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => fields.current[6]?.focus()}
          value={confirmation}
          onChangeText={setConfirmation}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <Field
          label="Height in cm (optional)"
          ref={(field) => {
            fields.current[6] = field;
          }}
          value={form.height}
          onChangeText={change("height")}
          keyboardType="number-pad"
          maxLength={3}
          hint="You will need a recorded height to book height-restricted rides."
          onSubmitEditing={submit}
        />
        <ErrorMessage error={error} />
        <Button
          onPress={submit}
          isDisabled={
            busy ||
            !form.name.trim() ||
            !form.last_name.trim() ||
            !form.username.trim() ||
            !form.email.trim() ||
            !form.password ||
            !confirmation
          }
        >
          {busy && <ButtonSpinner />}
          <ButtonText>
            {busy ? "Creating account…" : "Create account"}
          </ButtonText>
        </Button>
        <Button
          variant="link"
          onPress={() =>
            router.replace({ pathname: "/sign-in", params: { next } })
          }
        >
          <ButtonText>Already have an account? Sign in</ButtonText>
        </Button>
      </AuthPanel>
    </Page>
  );
}
