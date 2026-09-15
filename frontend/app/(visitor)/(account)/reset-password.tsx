import { useState } from "react";
import { router } from "expo-router";
import { Page } from "@/components/page";
import { Field } from "@/components/field";
import { ErrorMessage } from "@/components/feedback";
import { Card } from "@/components/ui/card";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Alert, AlertText } from "@/components/ui/alert";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/clients/reset-password/", null, {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
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
          <Heading size="2xl">
            {sent ? "Check your inbox." : "Reset your password."}
          </Heading>
          <Text className="text-muted-foreground">
            Get a link to choose a new password.
          </Text>
        </VStack>
        {sent ? (
          <Alert aria-live="polite">
            <AlertText>
              If an account uses that email, a password reset link has been
              sent.
            </AlertText>
          </Alert>
        ) : (
          <>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              autoCorrect={false}
              onSubmitEditing={submit}
              returnKeyType="send"
            />
            <ErrorMessage error={error} />
            <Button onPress={submit} isDisabled={busy || !email.trim()}>
              {busy && <ButtonSpinner />}
              <ButtonText>
                {busy ? "Sending link…" : "Send reset link"}
              </ButtonText>
            </Button>
          </>
        )}
        <Button variant="outline" onPress={() => router.replace("/sign-in")}>
          <ButtonText>Back to sign in</ButtonText>
        </Button>
      </Card>
    </Page>
  );
}
