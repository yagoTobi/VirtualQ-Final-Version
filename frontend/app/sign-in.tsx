import { useRef, useState } from "react";
import type { TextInput } from "react-native";
import { router } from "expo-router";
import { Page } from "@/components/page";
import { Field } from "@/components/field";
import { ErrorMessage } from "@/components/feedback";
import { Card } from "@/components/ui/card";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function SignIn() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const passwordField = useRef<TextInput>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { token } = await api<{ token: string }>(
        "/api/clients/login/",
        null,
        {
          method: "POST",
          body: JSON.stringify({ username: username.trim(), password }),
        },
      );
      await signIn(token);
      router.replace("/account");
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Card size="sm" className="w-full max-w-lg self-center p-5 md:p-8">
        <VStack space="sm">
          <Heading size="2xl">Welcome back.</Heading>
          <Text className="text-muted-foreground">
            Your tickets, group and plans in one place.
          </Text>
        </VStack>
        <Field
          label="Username"
          value={username}
          onChangeText={setUsername}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordField.current?.focus()}
        />
        <Field
          label="Password"
          ref={passwordField}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={submit}
          returnKeyType="go"
        />
        <ErrorMessage error={error} />
        <Button
          onPress={submit}
          isDisabled={busy || !username.trim() || !password}
        >
          {busy && <ButtonSpinner />}
          <ButtonText>{busy ? "Signing in…" : "Sign in"}</ButtonText>
        </Button>
        <Button variant="outline" onPress={() => router.replace("/sign-up")}>
          <ButtonText>Create an account</ButtonText>
        </Button>
        <Button
          variant="link"
          onPress={() => router.replace("/reset-password")}
        >
          <ButtonText>Forgot your password?</ButtonText>
        </Button>
      </Card>
    </Page>
  );
}
