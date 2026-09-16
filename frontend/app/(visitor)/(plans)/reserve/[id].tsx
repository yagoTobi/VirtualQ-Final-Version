import { useState } from "react";
import { Platform } from "react-native";
import { router, useLocalSearchParams, useSegments } from "expo-router";
import { Page } from "@/components/page";
import { RequireAuth } from "@/components/require-auth";
import { DateField } from "@/components/date-field";
import { ErrorMessage, Loading } from "@/components/feedback";
import { Card } from "@/components/ui/card";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import {
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckboxLabel,
} from "@/components/ui/checkbox";
import { CheckIcon } from "@/components/ui/icon";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { Alert, AlertText } from "@/components/ui/alert";
import { api, BookingOptions, Ride } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useResource } from "@/lib/use-resource";
import { displayDate, visitDate } from "@/lib/dates";

export default function Reserve({ fromMap = false }: { fromMap?: boolean }) {
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>();
  return (
    <RequireAuth>
      <ReservationForm key={`${id}:${date || ""}`} fromMap={fromMap} />
    </RequireAuth>
  );
}

function ReservationForm({ fromMap }: { fromMap: boolean }) {
  const segments: readonly string[] = useSegments();
  const currentTab = segments[1];
  function leave(href: Parameters<typeof router.navigate>[0], targetTab: string) {
    if (currentTab === targetTab) {
      router.dismissTo(href);
    } else {
      // POP_TO is a stack action; switch tabs with NAVIGATE.
      router.navigate(href);
    }
  }
  const params = useLocalSearchParams<{ id: string; date?: string }>();
  const { token } = useAuth();
  const [date, setDate] = useState(visitDate(params.date));
  const [chosen, setChosen] = useState<number[]>([]);
  const [time, setTime] = useState("");
  const [period, setPeriod] = useState("all");
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const ride = useResource<Ride>(
    `/api/parkRides/theme_park_rides/${encodeURIComponent(params.id)}/`,
  );
  const options = useResource<BookingOptions>(
    `/api/queue/reservations/booking-options/?ride=${encodeURIComponent(params.id)}&date=${encodeURIComponent(date)}`,
    token,
  );
  const data = options.data;
  const selected =
    data?.visitors.filter(
      (visitor) => chosen.includes(visitor.ticket) && visitor.eligible,
    ) || [];
  const selectedIds = selected.map((visitor) => visitor.ticket);
  const fits = (slot: BookingOptions["slots"][number]) =>
    selected.length > 0 &&
    slot.remaining >= selected.length &&
    selectedIds.every((id) => !slot.conflicting_tickets.includes(id));
  const slot = data?.slots.find((item) => item.start_time === time);
  const visibleSlots =
    data?.slots.filter(
      (item) =>
        period === "all" ||
        (period === "morning"
          ? item.start_time < "12:00"
          : period === "afternoon"
            ? item.start_time >= "12:00" && item.start_time < "17:00"
            : item.start_time >= "17:00"),
    ) || [];
  const ready = !!slot && fits(slot) && !ride.data?.under_maintenance;
  async function book() {
    if (busy || booked || !ready) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/queue/reservations/", token, {
        method: "POST",
        body: JSON.stringify(
          selectedIds.map((ticket) => ({
            ticket,
            ride: Number(params.id),
            date,
            start_time: time,
          })),
        ),
      });
      setBooked(true);
      leave("/plans", "(plans)");
    } catch (err) {
      setError(err);
      setReview(false);
      options.reload();
    } finally {
      setBusy(false);
    }
  }
  if (booked) {
    return (
      <Page title="Ride reserved">
        <Card size="sm" className="w-full max-w-xl self-center">
          <Heading size="xl">Your places are reserved.</Heading>
          <Text>
            {ride.data?.ride_name} · {displayDate(date)} · {time.slice(0, 5)} UTC
          </Text>
          <Alert accessibilityRole="alert">
            <AlertText>Each visitor’s ride pass is ready in Plans.</AlertText>
          </Alert>
          <Button onPress={() => router.navigate("/plans")}>
            <ButtonText>Open ride passes</ButtonText>
          </Button>
          <Button
            variant="outline"
            onPress={() => router.dismissTo(fromMap ? "/map" : "/")}
          >
            <ButtonText>{fromMap ? "Back to map" : "Back to Explore"}</ButtonText>
          </Button>
        </Card>
      </Page>
    );
  }
  return (
    <Page
      title={ride.data?.ride_name || "Reserve a ride"}
      subtitle={
        data
          ? `Booking times are in park time (${data.time_zone}).`
          : "Choose your visitors and a time together."
      }
    >
      <ErrorMessage error={ride.error} retry={ride.reload} />
      <ErrorMessage error={error} />
      {!ride.data && !ride.error && <Loading />}
      {ride.data && (
        <Card size="sm" className="w-full max-w-xl self-center">
          <DateField
            label="Visit date"
            value={date}
            minimum={data?.today}
            onChange={(value) => {
              setDate(value);
              setChosen([]);
              setTime("");
              setReview(false);
            }}
          />
          <Text size="sm" className="text-muted-foreground">
            {ride.data.ride_duration} min · {ride.data.height_restriction} cm
            minimum · {ride.data.opening_hour.slice(0, 5)}–
            {ride.data.closing_hour.slice(0, 5)}
          </Text>
          {ride.data.under_maintenance && (
            <Alert>
              <AlertText>
                This ride is under maintenance. Choose another adventure.
              </AlertText>
            </Alert>
          )}
          {options.loading && <Loading label="Checking visitors and times…" />}
          <ErrorMessage error={options.error} retry={options.reload} />
          {data?.visitors.length === 0 && (
            <VStack space="md">
              <Text>No tickets for {displayDate(date)} yet.</Text>
              <Button
                onPress={() =>
                  router.push({ pathname: "/book-visit", params: { date } })
                }
              >
                <ButtonText>Book a park visit</ButtonText>
              </Button>
            </VStack>
          )}
          {!!data?.visitors.length && (
            <>
              <Heading size="lg">Who’s riding?</Heading>
              {data.visitors.map((visitor) => (
                <VStack space="xs" key={visitor.ticket}>
                  <Checkbox
                    value={String(visitor.ticket)}
                    aria-label={`${visitor.name}${visitor.guest_number ? `, guest ${visitor.guest_number}` : ", you"}`}
                    isChecked={selectedIds.includes(visitor.ticket)}
                    isDisabled={!visitor.eligible || busy}
                    className="min-h-12"
                    onChange={(checked: boolean) => {
                      setChosen((ids) =>
                        checked
                          ? [...ids, visitor.ticket]
                          : ids.filter((id) => id !== visitor.ticket),
                      );
                      setReview(false);
                      setTime("");
                    }}
                  >
                    <CheckboxIndicator>
                      <CheckboxIcon as={CheckIcon} />
                    </CheckboxIndicator>
                    <CheckboxLabel>
                      {visitor.name}
                      {visitor.guest_number
                        ? ` · Guest ${visitor.guest_number}`
                        : " · You"}
                    </CheckboxLabel>
                  </Checkbox>
                  {!visitor.eligible && (
                    <>
                      <Text size="sm" className="text-muted-foreground">
                        {visitor.reason}
                      </Text>
                      <Button
                        size="sm"
                        variant="link"
                        className="self-start"
                        onPress={() =>
                          router.push(
                            visitor.guest_number
                              ? {
                                  pathname: "/ticket/[id]",
                                  params: { id: visitor.ticket },
                                }
                              : "/profile",
                          )
                        }
                      >
                        <ButtonText>Update details</ButtonText>
                      </Button>
                    </>
                  )}
                </VStack>
              ))}
              <Heading size="lg">Choose a time</Heading>
              <Text size="sm" className="text-muted-foreground">
                {selected.length
                  ? `${selected.length} visitor${selected.length === 1 ? "" : "s"} selected. Times are checked again when you confirm.`
                  : "Select at least one visitor to see times that fit your group."}
              </Text>
              <HStack space="sm" className="flex-wrap">
                {["all", "morning", "afternoon", "evening"].map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={period === value ? "secondary" : "ghost"}
                    accessibilityState={{ selected: period === value }}
                    onPress={() => setPeriod(value)}
                  >
                    <ButtonText>
                      {value[0].toUpperCase() + value.slice(1)}
                    </ButtonText>
                  </Button>
                ))}
              </HStack>
              <Box className="flex-row flex-wrap gap-2">
                {visibleSlots.map((slot) => (
                  <Button
                    key={slot.start_time}
                    size="sm"
                    variant={time === slot.start_time ? "default" : "outline"}
                    isDisabled={!fits(slot) || busy}
                    accessibilityState={{
                      selected: time === slot.start_time,
                    }}
                    accessibilityLabel={`${slot.start_time.slice(0, 5)}, ${fits(slot) ? "available" : "unavailable for this group"}`}
                    onPress={() => {
                      setTime(slot.start_time);
                      setReview(false);
                    }}
                  >
                    <ButtonText>{slot.start_time.slice(0, 5)}</ButtonText>
                  </Button>
                ))}
              </Box>
              {!visibleSlots.length && (
                <Text className="text-muted-foreground">
                  {data.slots.length
                    ? "No times in this part of the day. Choose another time filter."
                    : "No bookable times remain for this day. Try another date or ride."}
                </Text>
              )}
              {review && ready && (
                <Alert>
                  <AlertText>
                    {selected.map((v) => v.name).join(", ")} ·{" "}
                    {displayDate(date)} · {time.slice(0, 5)}–
                    {slot?.end_time.slice(0, 5)} {data.time_zone}
                  </AlertText>
                </Alert>
              )}
              <Button
                isDisabled={!ready || busy}
                onPress={() => (review ? book() : setReview(true))}
              >
                {busy && <ButtonSpinner />}
                <ButtonText>
                  {busy
                    ? "Reserving…"
                    : review
                      ? "Confirm reservation"
                      : "Review reservation"}
                </ButtonText>
              </Button>
            </>
          )}
        </Card>
      )}
      {Platform.OS === "web" && (
        <Button
          variant="link"
          onPress={() =>
            leave(
              {
                pathname: fromMap
                  ? "/(visitor)/(map)/ride/[id]"
                  : "/(visitor)/(explore)/ride/[id]",
                params: { id: params.id },
              },
              fromMap ? "(map)" : "(explore)",
            )
          }
        >
          <ButtonText>Back to ride details</ButtonText>
        </Button>
      )}
    </Page>
  );
}
