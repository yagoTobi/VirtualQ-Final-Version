import { useState } from "react";
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
    <Page
      title={`Hello, ${user.name}.`}
      subtitle="Your next great day out starts here."
    >
      <Card className="max-w-xl">
        <Heading size="xl">Your account</Heading>
        <Text>
          {user.name} {user.last_name}
        </Text>
        <Text className="text-muted-foreground">{user.email}</Text>
        <Button onPress={() => router.push("/tickets")}>
          <ButtonText>Tickets & your group</ButtonText>
        </Button>
        <Button variant="outline" onPress={() => router.push("/profile")}>
          <ButtonText>Edit your details</ButtonText>
        </Button>
        <ErrorMessage error={error} />
        <Button
          variant="outline"
          isDisabled={busy}
          onPress={async () => {
            setBusy(true);
            setError(null);
            try {
              await signOut();
              router.replace("/");
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
