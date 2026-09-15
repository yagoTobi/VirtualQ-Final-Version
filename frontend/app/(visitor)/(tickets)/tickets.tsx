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
import { Pressable } from "@/components/ui/pressable";
import { Box } from "@/components/ui/box";
import { Icon, ChevronRightIcon, CalendarDaysIcon } from "@/components/ui/icon";
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
  const params = useLocalSearchParams<{ date?: string | string[] }>();
  const dateParam = typeof params.date === "string" ? params.date : undefined;
  const [date, setDate] = useState(visitDate(dateParam));
  const [previousDateParam, setPreviousDateParam] = useState(dateParam);
  // Apply explicit linked dates before rendering children; back links may omit them.
  if (dateParam !== previousDateParam) {
    setPreviousDateParam(dateParam);
    if (dateParam !== undefined) setDate(visitDate(dateParam));
  }
  const { token, user } = useAuth();
  const { data, error, loading, refreshing, reload } = useResource<Ticket[]>(
    `/api/tickets/tickets-view/?date_of_visit=${encodeURIComponent(date)}`,
    token,
  );
  return (
    <Page title="Tickets" refreshing={refreshing && !!data} onRefresh={reload}>
      <VStack space="sm" className="w-full max-w-xl">
        <DateField
          label="Visit date"
          value={date}
          onChange={(value) => {
            const selected = visitDate(value);
            setDate(selected);
            router.setParams({ date: selected });
          }}
        />
        <Button
          className="rounded-full"
          onPress={() =>
            router.push({ pathname: "/book-visit", params: { date } })
          }
        >
          <ButtonText>Book or update a visit</ButtonText>
        </Button>
        <Button
          size="sm"
          variant="link"
          onPress={() => router.push("/scan-ticket")}
        >
          <ButtonText>Find a ticket by code or camera</ButtonText>
        </Button>
      </VStack>
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
        <Pressable
          key={ticket.id}
          accessibilityRole="button"
          accessibilityLabel={`Open ${ticket.guest_number ? `guest ${ticket.guest_number}'s` : "my"} pass`}
          onPress={() =>
            router.push({
              pathname: "/ticket/[id]",
              params: { id: ticket.id },
            })
          }
          className="w-full max-w-xl bg-card rounded-2xl border border-border p-4 data-[active=true]:bg-accent"
        >
          <HStack space="md" className="items-center justify-between">
            <Box className="w-11 h-11 rounded-xl bg-secondary items-center justify-center">
              <Icon as={CalendarDaysIcon} className="text-primary" />
            </Box>
            <VStack space="xs" className="flex-1">
              <Heading size="lg">
                {ticket.guest_number
                  ? `Guest ${ticket.guest_number}`
                  : `${user!.name}'s ticket`}
              </Heading>
              <Text size="sm" className="text-muted-foreground">
                {ticket.guest_number
                  ? "Guest pass & details"
                  : "Park admission"}
              </Text>
            </VStack>
            <Icon as={ChevronRightIcon} className="text-primary" />
          </HStack>
        </Pressable>
      ))}
    </Page>
  );
}
