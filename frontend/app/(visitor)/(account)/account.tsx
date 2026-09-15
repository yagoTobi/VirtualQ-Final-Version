import { useState } from "react";
import { Platform } from "react-native";
import { Redirect, router } from "expo-router";
import { Page } from "@/components/page";
import { Loading, ErrorMessage } from "@/components/feedback";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function Account() {
  const { user, ready, signOut } = useAuth();
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  if (!ready)
    return (
      <Page>
        <Loading />
      </Page>
    );
  if (!user) return <Redirect href="/sign-in" />;
  return (
    <Page title="You">
      <Card className="max-w-xl">
        <Heading size="xl">Your account</Heading>
        <Text>
          {user.name} {user.last_name}
        </Text>
        <Text className="text-muted-foreground">{user.email}</Text>
        <Button variant="outline" onPress={() => router.push("/profile")}>
          <ButtonText>Edit your details</ButtonText>
        </Button>
        {Platform.OS === "web" && user.is_staff && (
          <Button
            variant="secondary"
            onPress={() => router.navigate("/operations")}
          >
            <ButtonText>Open staff portal</ButtonText>
          </Button>
        )}
        <ErrorMessage error={error} />
        <Button
          variant="outline"
          isDisabled={busy}
          onPress={async () => {
            setBusy(true);
            setError(null);
            try {
              await signOut();
              router.navigate("/");
            } catch (err) {
              setError(err);
            } finally {
              setBusy(false);
            }
          }}
        >
          <ButtonText>{busy ? "Signing out…" : "Sign out"}</ButtonText>
        </Button>
      </Card>
    </Page>
  );
}
