import { useState } from "react";
import { router } from "expo-router";
import { Page } from "@/components/page";
import { RequireAuth } from "@/components/require-auth";
import { ErrorMessage, Loading } from "@/components/feedback";
import { FlatList } from "@/components/ui/flat-list";
import { Card } from "@/components/ui/card";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Badge, BadgeText } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useResource } from "@/lib/use-resource";
import { Reservation } from "@/lib/api";
import { displayDate } from "@/lib/dates";

export default function Plans() {
  return (
    <RequireAuth>
      <PlanList />
    </RequireAuth>
  );
}
function PlanList() {
  const { token } = useAuth();
  const [upcoming, setUpcoming] = useState(true);
  const { data, error, loading, reload } = useResource<Reservation[]>(
    `/api/queue/reservations/${upcoming ? "?upcoming=true" : ""}`,
    token,
  );
  return (
    <Page
      title="Your park plans"
      subtitle="Everyone’s rides, in one place."
      scroll={false}
    >
      <HStack space="sm">
        <Button
          size="sm"
          variant={upcoming ? "default" : "outline"}
          onPress={() => setUpcoming(true)}
          accessibilityState={{ selected: upcoming }}
        >
          <ButtonText>Upcoming</ButtonText>
        </Button>
        <Button
          size="sm"
          variant={!upcoming ? "default" : "outline"}
          onPress={() => setUpcoming(false)}
          accessibilityState={{ selected: !upcoming }}
        >
          <ButtonText>All visits</ButtonText>
        </Button>
      </HStack>
      <ErrorMessage error={error} retry={reload} />
      {loading ? (
        <Loading label="Finding your plans…" />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => String(item.reservation_id)}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshing={false}
          onRefresh={reload}
          ListEmptyComponent={
            !error ? (
              <Card size="sm">
                <Heading size="lg">Make room for a great ride.</Heading>
                <Text className="text-muted-foreground">
                  Your reservations will appear here.
                </Text>
                <Button onPress={() => router.push("/")}>
                  <ButtonText>Explore rides</ButtonText>
                </Button>
              </Card>
            ) : null
          }
          renderItem={({ item }) => (
            <Card size="sm" className="mb-3 w-full max-w-xl">
              <HStack space="md" className="items-center justify-between">
                <VStack space="xs" className="flex-1">
                  <Heading size="lg">{item.ride_name}</Heading>
                  <Text size="sm" className="text-muted-foreground">
                    {item.visitor_name} · {displayDate(item.date)}
                  </Text>
                  <Text bold size="sm">
                    {item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)}{" "}
                    {item.time_zone}
                  </Text>
                </VStack>
                <Button
                  size="sm"
                  variant="outline"
                  accessibilityLabel={`Open ${item.visitor_name}'s ${item.ride_name} reservation`}
                  onPress={() =>
                    router.push({
                      pathname: "/reservation/[id]",
                      params: { id: item.reservation_id },
                    })
                  }
                >
                  <ButtonText>Open pass</ButtonText>
                </Button>
              </HStack>
              {item.validated && (
                <Badge variant="secondary" className="self-start">
                  <BadgeText>Admitted</BadgeText>
                </Badge>
              )}
            </Card>
          )}
        />
      )}
    </Page>
  );
}
