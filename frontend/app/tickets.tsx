import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Page } from "@/components/page";
import { RequireAuth } from "@/components/require-auth";
import { DateField } from "@/components/date-field";
import { Loading, ErrorMessage } from "@/components/feedback";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useResource } from "@/lib/use-resource";
import { Ticket } from "@/lib/api";
import { displayDate, visitDate } from "@/lib/dates";

export default function Tickets() {
  return (
    <RequireAuth>
      <TicketList />
    </RequireAuth>
  );
}

function TicketList() {
  const params = useLocalSearchParams<{ date?: string }>();
  const [date, setDate] = useState(visitDate(params.date));
  const { token, user } = useAuth();
  const { data, error, loading, reload } = useResource<Ticket[]>(
    `/api/tickets/tickets-view/?date_of_visit=${encodeURIComponent(date)}`,
    token,
  );
  return (
    <Page
      title="Tickets & your group"
      subtitle="Pick a day to find everyone's park pass."
    >
      <Card size="sm" className="w-full max-w-xl">
        <DateField label="Visit date" value={date} onChange={setDate} />
        <Button
          onPress={() =>
            router.push({ pathname: "/book-visit", params: { date } })
          }
        >
          <ButtonText>Book or update a visit</ButtonText>
        </Button>
      </Card>
      {loading && <Loading label="Finding your tickets…" />}
      <ErrorMessage error={error} retry={reload} />
      {data?.length === 0 && (
        <Card size="sm">
          <Heading size="lg">A park day to look forward to.</Heading>
          <Text className="text-muted-foreground">
            You have no tickets for {displayDate(date)}. Book a visit to start
            planning.
          </Text>
        </Card>
      )}
      {data?.map((ticket) => (
        <Card size="sm" key={ticket.id} className="w-full max-w-xl">
          <HStack space="md" className="items-center justify-between">
            <VStack space="xs" className="flex-1">
              <Heading size="lg">
                {ticket.guest_number
                  ? `Guest ${ticket.guest_number}`
                  : `${user!.name}'s ticket`}
              </Heading>
              <Text size="sm" className="text-muted-foreground">
                {ticket.guest_number
                  ? "Pass & guest details"
                  : "Park admission"}
              </Text>
            </VStack>
            <Button
              variant="outline"
              size="sm"
              accessibilityLabel={`Open ${ticket.guest_number ? `guest ${ticket.guest_number}'s` : "my"} pass`}
              onPress={() =>
                router.push({
                  pathname: "/ticket/[id]",
                  params: { id: ticket.id },
                })
              }
            >
              <ButtonText>Open pass</ButtonText>
            </Button>
          </HStack>
        </Card>
      ))}
    </Page>
  );
}
