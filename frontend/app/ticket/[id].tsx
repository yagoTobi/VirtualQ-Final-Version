import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Page } from "@/components/page";
import { RequireAuth } from "@/components/require-auth";
import { Loading, ErrorMessage } from "@/components/feedback";
import { Field } from "@/components/field";
import { Card } from "@/components/ui/card";
import { VStack } from "@/components/ui/vstack";
import { Image } from "@/components/ui/image";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { Alert, AlertText } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth";
import { api, Ticket, Guest } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { displayDate, localDate } from "@/lib/dates";

type Pass = { ticket: Ticket; guest: Guest | null; image: string };

export default function TicketDetail() {
  return (
    <RequireAuth>
      <TicketPass />
    </RequireAuth>
  );
}

function TicketPass() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const { data, error, loading, reload } = useResource<Pass>(
    `/api/tickets/tickets/${encodeURIComponent(id)}/qr/`,
    token,
  );
  return (
    <Page
      title="Your park pass"
      subtitle={data ? displayDate(data.ticket.date_of_visit) : undefined}
    >
      {loading && <Loading label="Opening your pass…" />}
      <ErrorMessage error={error} retry={reload} />
      {data && (
        <>
          <Card size="sm" className="w-full max-w-lg self-center items-center">
            <Heading size="xl">{data.guest?.name || user!.name}</Heading>
            <Text className="text-muted-foreground">
              {data.ticket.guest_number
                ? `Guest ${data.ticket.guest_number}`
                : "Account holder"}{" "}
              · Park admission
            </Text>
            <Image
              source={{ uri: data.image }}
              alt="Park admission QR code"
              accessibilityLabel="Park admission QR code. Ask staff for help if you cannot scan this pass."
              className="w-64 h-64"
              resizeMode="contain"
            />
            <Text size="sm" className="text-muted-foreground text-center">
              Show this code at the entrance. Keep your pass private.
            </Text>
            {data.ticket.date_of_visit < localDate() && (
              <Alert>
                <AlertText>This pass is for a previous visit.</AlertText>
              </Alert>
            )}
          </Card>
          {data.guest ? (
            <GuestForm
              key={data.guest.guest_id}
              guest={data.guest}
              onSaved={reload}
            />
          ) : (
            <Button variant="outline" onPress={() => router.push("/profile")}>
              <ButtonText>Edit my details</ButtonText>
            </Button>
          )}
          <Button
            variant="outline"
            onPress={() =>
              router.replace({
                pathname: "/tickets",
                params: { date: data.ticket.date_of_visit },
              })
            }
          >
            <ButtonText>Back to your group</ButtonText>
          </Button>
        </>
      )}
    </Page>
  );
}

function GuestForm({ guest, onSaved }: { guest: Guest; onSaved: () => void }) {
  const { token } = useAuth();
  const [name, setName] = useState(guest.name || "");
  const [age, setAge] = useState(guest.age?.toString() || "");
  const [height, setHeight] = useState(guest.height?.toString() || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/tickets/guests/guests/${guest.guest_id}/`, token, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          age: age || null,
          height: height || null,
        }),
      });
      onSaved();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card size="sm" className="w-full max-w-lg self-center">
      <VStack space="sm">
        <Heading size="lg">Guest details</Heading>
        <Text className="text-muted-foreground">
          Add their height before reserving height-restricted rides.
        </Text>
      </VStack>
      <Field
        label="Guest name"
        value={name}
        onChangeText={setName}
        maxLength={20}
        autoCapitalize="words"
      />
      <Field
        label="Age (optional)"
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
        maxLength={3}
      />
      <Field
        label="Height in cm"
        value={height}
        onChangeText={setHeight}
        keyboardType="number-pad"
        maxLength={3}
      />
      <ErrorMessage error={error} />
      <Button onPress={save} isDisabled={busy || !name.trim()}>
        {busy && <ButtonSpinner />}
        <ButtonText>{busy ? "Saving…" : "Save guest details"}</ButtonText>
      </Button>
    </Card>
  );
}
