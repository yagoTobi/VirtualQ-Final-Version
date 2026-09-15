import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Page } from "@/components/page";
import { RequireAuth } from "@/components/require-auth";
import { ErrorMessage, Loading } from "@/components/feedback";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { Alert, AlertText } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth";
import { useResource } from "@/lib/use-resource";
import { api, Reservation } from "@/lib/api";
import { displayDate } from "@/lib/dates";

export default function ReservationPass() {
  return (
    <RequireAuth>
      <Pass />
    </RequireAuth>
  );
}
function Pass() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { data, loading, error, reload } = useResource<{
    reservation: Reservation;
    image: string;
  }>(`/api/queue/reservations/${encodeURIComponent(id)}/qr/`, token);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  async function cancel() {
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      await api(`/api/queue/reservations/${encodeURIComponent(id)}/`, token, {
        method: "DELETE",
      });
      router.replace("/plans");
    } catch (err) {
      setFailure(err);
      setConfirm(false);
      reload();
    } finally {
      setBusy(false);
    }
  }
  const booking = data?.reservation;
  return (
    <Page
      title={booking?.ride_name || "Your ride pass"}
      subtitle={
        booking
          ? `${displayDate(booking.date)} · ${booking.start_time.slice(0, 5)}–${booking.end_time.slice(0, 5)} ${booking.time_zone}`
          : undefined
      }
    >
      {loading && <Loading label="Opening your reservation…" />}
      <ErrorMessage error={error} retry={reload} />
      <ErrorMessage error={failure} />
      {booking && (
        <Card size="sm" className="w-full max-w-lg self-center items-center">
          <Heading size="xl">{booking.visitor_name}</Heading>
          <Text className="text-muted-foreground">
            {booking.validated
              ? "Already admitted"
              : !booking.ends_at
                ? "Ask the ride team to confirm this pass’s date"
                : booking.can_cancel
                  ? "Your ride is reserved"
                  : "This visit has finished"}
          </Text>
          <Image
            source={{ uri: data.image }}
            alt="Ride reservation QR code"
            className="w-64 h-64"
            resizeMode="contain"
          />
          <Text size="sm" className="text-muted-foreground text-center">
            Show this pass to the ride team. Keep the code private.
          </Text>
        </Card>
      )}
      {booking?.can_cancel &&
        (confirm ? (
          <Card size="sm" className="w-full max-w-lg self-center">
            <Alert variant="destructive">
              <AlertText>
                Cancel {booking.visitor_name}’s reservation for{" "}
                {booking.ride_name}? This releases their seat. Other visitors
                keep their reservations.
              </AlertText>
            </Alert>
            <Button variant="destructive" isDisabled={busy} onPress={cancel}>
              {busy && <ButtonSpinner />}
              <ButtonText>
                {busy ? "Cancelling…" : "Confirm cancellation"}
              </ButtonText>
            </Button>
            <Button
              variant="outline"
              isDisabled={busy}
              onPress={() => setConfirm(false)}
            >
              <ButtonText>Keep reservation</ButtonText>
            </Button>
          </Card>
        ) : (
          <Button variant="outline" onPress={() => setConfirm(true)}>
            <ButtonText>Cancel this reservation</ButtonText>
          </Button>
        ))}
      <Button variant="link" onPress={() => router.replace("/plans")}>
        <ButtonText>Back to plans</ButtonText>
      </Button>
    </Page>
  );
}
