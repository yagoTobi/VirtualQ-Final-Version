import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Keyboard, type TextInput } from "react-native";
import { router, useLocalSearchParams, useNavigation, type NativeStackNavigationProp } from "expo-router";
import { Page } from "@/components/page";
import { AuthPanel } from "@/components/auth-panel";
import { Field } from "@/components/field";
import { ErrorMessage, Loading } from "@/components/feedback";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Alert, AlertText } from "@/components/ui/alert";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { readResetLink } from "@/lib/reset-link";

type ResetLink = NonNullable<ReturnType<typeof readResetLink>>;
const subscribe = () => () => {};

export default function SetPassword() {
  const { "#": fragment } = useLocalSearchParams<{ "#": string }>();
  const navigation = useNavigation<NativeStackNavigationProp<{
    "set-password": { "#": string };
  }>>();
  const [captured, setCaptured] = useState(fragment);
  if (fragment && fragment !== captured) setCaptured(fragment);
  // Static HTML cannot contain a URL fragment. Keep hydration's first render identical.
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  useEffect(() => {
    if (fragment) {
      // The credential stays in memory, never browser/native persistent storage.
      navigation.setParams({ "#": "" });
    }
  }, [fragment, navigation]);
  const link = readResetLink(captured);
  return (
    <Page>
      {!isClient ? (
        <Loading label="Opening your reset link…" />
      ) : (
        <PasswordForm
          key={link ? `${link.uid}:${link.token}` : "missing"}
          link={link}
        />
      )}
    </Page>
  );
}

function PasswordForm({ link }: { link: ResetLink | null }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [checked, setChecked] = useState<{ password_help: string[] } | null>(
    null,
  );
  const [checkError, setCheckError] = useState<unknown>(null);
  const [revision, setRevision] = useState(0);
  const confirmField = useRef<TextInput>(null);
  const uid = link?.uid;
  const token = link?.token;
  useEffect(() => {
    if (!uid || !token) return;
    const controller = new AbortController();
    api<{ password_help: string[] }>(
      "/api/clients/reset-password/check/",
      null,
      {
        method: "POST",
        body: JSON.stringify({ uid, token }),
        signal: controller.signal,
      },
    )
      .then((data) => {
        if (!controller.signal.aborted) setChecked(data);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setCheckError(err);
      });
    return () => controller.abort();
  }, [uid, token, revision]);
  const details =
    error instanceof ApiError &&
    error.details &&
    typeof error.details === "object"
      ? (error.details as Record<string, unknown>)
      : {};
  const firstError = Array.isArray(details.new_password1)
    ? details.new_password1.join(" ")
    : undefined;
  const secondError = Array.isArray(details.new_password2)
    ? details.new_password2.join(" ")
    : undefined;
  const invalid =
    !link ||
    !!details.token ||
    (checkError instanceof ApiError && checkError.status === 400);

  async function submit() {
    if (busy || !link || !checked || !password || !confirmation) return;
    if (password !== confirmation) {
      setError(
        new ApiError(400, { new_password2: ["The passwords do not match."] }),
      );
      confirmField.current?.focus();
      return;
    }
    Keyboard.dismiss();
    setBusy(true);
    setError(null);
    try {
      await api("/api/clients/reset-password/confirm/", null, {
        method: "POST",
        body: JSON.stringify({
          ...link,
          new_password1: password,
          new_password2: confirmation,
        }),
      });
      setPassword("");
      setConfirmation("");
      setSaved(true);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPanel>
      <VStack space="sm">
        <Heading size="2xl">
          {saved
            ? "Password updated."
            : invalid
              ? "Open a fresh reset link."
              : "Choose a new password."}
        </Heading>
        <Text className="text-muted-foreground">
          {saved
            ? "Your other app sessions have ended. Sign in with your new password."
            : invalid
              ? "This link is missing, has expired or has already been used. Request a new email to continue."
              : "Keep your account and park plans secure."}
        </Text>
      </VStack>
      {saved ? (
        <Alert accessibilityRole="alert">
          <AlertText>Your password has been changed successfully.</AlertText>
        </Alert>
      ) : invalid ? (
        <Button onPress={() => router.replace("/reset-password")}>
          <ButtonText>Request a new link</ButtonText>
        </Button>
      ) : checkError ? (
        <ErrorMessage
          error={checkError}
          retry={() => {
            setCheckError(null);
            setRevision((value) => value + 1);
          }}
        />
      ) : !checked ? (
        <Loading label="Checking your reset link…" />
      ) : (
        <>
          <Field
            label="New password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError(null);
            }}
            error={firstError}
            hint={checked.password_help.join(" ")}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            autoCorrect={false}
            editable={!busy}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => confirmField.current?.focus()}
          />
          <Field
            label="Confirm new password"
            ref={confirmField}
            value={confirmation}
            onChangeText={(value) => {
              setConfirmation(value);
              setError(null);
            }}
            error={secondError}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            autoCorrect={false}
            editable={!busy}
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <ErrorMessage error={firstError || secondError ? null : error} />
          <Button
            onPress={submit}
            isDisabled={busy || !password || !confirmation}
          >
            {busy && <ButtonSpinner />}
            <ButtonText>
              {busy ? "Updating password…" : "Update password"}
            </ButtonText>
          </Button>
        </>
      )}
      <Button
        variant={saved ? "default" : "outline"}
        isDisabled={busy}
        onPress={() => router.replace("/sign-in")}
      >
        <ButtonText>{saved ? "Sign in" : "Back to sign in"}</ButtonText>
      </Button>
    </AuthPanel>
  );
}
