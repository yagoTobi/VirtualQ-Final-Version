import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Page } from "@/components/page";
import { RequireAuth } from "@/components/require-auth";
import { DateField } from "@/components/date-field";
import { Field } from "@/components/field";
import { ErrorMessage, Loading } from "@/components/feedback";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { Alert, AlertText } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth";
import { api, ApiError, Ticket } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { localDate, visitDate } from "@/lib/dates";

export default function BookVisit() {
  return (
    <RequireAuth>
      <BookingForm />
    </RequireAuth>
  );
}

function BookingForm() {
  const { token } = useAuth();
  const params = useLocalSearchParams<{ date?: string }>();
  const [date, setDate] = useState(
    visitDate(params.date) < localDate() ? localDate() : visitDate(params.date),
  );
  const [editedGuests, setEditedGuests] = useState<{
    date: string;
    value: string;
  } | null>(null);
  const visit = useResource<Ticket[]>(
    `/api/tickets/tickets-view/?date_of_visit=${encodeURIComponent(date)}`,
    token,
  );
  const guests =
    editedGuests?.date === date
      ? editedGuests.value
      : String(
          Math.max(
            0,
            ...(visit.data || []).map((ticket) => ticket.guest_number || 0),
          ),
        );
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function book(confirmed = false) {
    if (busy || visit.loading || visit.error) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/tickets/tickets/", token, {
        method: "POST",
        body: JSON.stringify({
          date_of_visit: date,
          additional_guests: Number(guests),
          confirm_removal: confirmed,
        }),
      });
      router.replace({ pathname: "/tickets", params: { date } });
    } catch (err) {
      setError(err);
      setConfirm(
        err instanceof ApiError &&
          !!(err.details as Record<string, unknown>)?.confirm_removal,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title="Plan your park day" subtitle="One visit, everyone together.">
      <Card size="sm" className="w-full max-w-lg self-center">
        <DateField
          label="Visit date"
          value={date}
          minimum={localDate()}
          onChange={(value) => {
            setDate(value);
            setConfirm(false);
            setError(null);
          }}
        />
        {visit.loading && <Loading label="Checking your group…" />}
        <ErrorMessage error={visit.error} retry={visit.reload} />
        <Field
          label="Additional guests"
          value={guests}
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={(value) => {
            setEditedGuests({ date, value });
            setConfirm(false);
            setError(null);
          }}
          hint="Your ticket is included. Add up to 49 guests."
        />
        <Text className="text-muted-foreground">
          Already booked this date? Existing tickets and guest details are kept
          when you update the group.
        </Text>
        <ErrorMessage error={error} />
        {confirm && (
          <Alert variant="destructive">
            <AlertText>
              Removing guests also cancels their ride reservations. This cannot
              be undone.
            </AlertText>
          </Alert>
        )}
        <Button
          onPress={() => book(confirm)}
          variant={confirm ? "destructive" : "default"}
          isDisabled={
            busy ||
            visit.loading ||
            !!visit.error ||
            !date ||
            !/^\d+$/.test(guests) ||
            Number(guests) > 49
          }
        >
          {busy && <ButtonSpinner />}
          <ButtonText>
            {busy
              ? "Saving visit…"
              : confirm
                ? "Confirm removal"
                : "Save visit"}
          </ButtonText>
        </Button>
        <Button
          variant="outline"
          onPress={() =>
            router.replace({ pathname: "/tickets", params: { date } })
          }
        >
          <ButtonText>
            {confirm ? "Keep current group" : "Back to tickets"}
          </ButtonText>
        </Button>
      </Card>
    </Page>
  );
}
