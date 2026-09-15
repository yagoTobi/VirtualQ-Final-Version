import { useState } from "react";
import { router } from "expo-router";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Image } from "@/components/ui/image";
import { ScrollView } from "@/components/ui/scroll-view";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { RepeatIcon, ChevronRightIcon } from "@/components/ui/icon";
import { ErrorMessage, Loading } from "@/components/feedback";
import { Ride } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { MapSchematic } from "./schematic";

export default function ParkMap() {
  const {
    data: rides,
    error,
    refreshing,
    reload,
  } = useResource<Ride[]>("/api/parkRides/theme_park_rides/");
  const [selected, setSelected] = useState<number | null>(null);
  const active = rides?.find((ride) => ride.ride_id === selected) ?? rides?.[0];
  if (!rides?.length)
    return (
      <VStack space="lg" className="flex-1 justify-center bg-background p-6">
        <ErrorMessage error={error} retry={reload} />
        {!rides && !error && <Loading label="Loading the park…" />}
        {rides?.length === 0 && (
          <>
            <Heading size="xl">No rides listed yet</Heading>
            <Text className="text-muted-foreground">
              The park map will appear when attractions are available.
            </Text>
            <Button variant="outline" onPress={reload}>
              <ButtonText>Refresh rides</ButtonText>
            </Button>
          </>
        )}
      </VStack>
    );
  return (
    <ScrollView
      className="flex-1 bg-secondary"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <HStack space="sm" className="px-3 pt-3 items-center justify-between">
        <Text
          size="xs"
          className="shrink rounded-full bg-card px-3 py-2 text-muted-foreground"
        >
          Provisional · Not to scale
        </Text>
        <Button
          size="icon"
          variant="outline"
          className="shrink-0 rounded-full bg-card"
          accessibilityLabel="Refresh ride availability"
          isDisabled={refreshing}
          onPress={reload}
        >
          <ButtonIcon as={RepeatIcon} />
        </Button>
      </HStack>
      {/* Grow into the phone's available space; allow scrolling at large font
          sizes and on short screens so the ride actions remain reachable. */}
      <Box className="flex-1 min-h-56">
        <MapSchematic
          rides={rides}
          selected={active?.ride_id}
          onSelect={setSelected}
          className="absolute inset-0"
        />
      </Box>
      <VStack
        space="md"
        className="shrink-0 rounded-t-3xl border-t border-border bg-card p-4"
      >
        <ErrorMessage error={error} retry={reload} />
        {!!error && (
          <Text size="xs" className="text-muted-foreground">
            Showing the last loaded ride information.
          </Text>
        )}
        {active && (
          <HStack space="md" className="items-center" aria-live="polite">
            <Image
              source={{ uri: active.ride_thumbnail }}
              alt=""
              className="w-16 h-16 rounded-xl"
              resizeMode="cover"
            />
            <VStack space="xs" className="flex-1">
              <Text size="xs" className="text-muted-foreground">
                {active.area_name}
              </Text>
              <Heading size="lg">{active.ride_name}</Heading>
              <Text size="sm" className="text-muted-foreground">
                {active.ride_duration} min · {active.height_restriction} cm min.
              </Text>
            </VStack>
            <Button
              size="icon"
              className="rounded-full"
              accessibilityLabel={`Explore ${active.ride_name}`}
              onPress={() =>
                router.push({
                  pathname: "/(visitor)/(map)/ride/[id]",
                  params: { id: active.ride_id },
                })
              }
            >
              <ButtonIcon as={ChevronRightIcon} />
            </Button>
          </HStack>
        )}
        <HStack space="md" className="flex-wrap items-center justify-between">
          <Text
            size="xs"
            className={
              active?.under_maintenance ? "text-destructive" : "text-success"
            }
          >
            {active?.under_maintenance ? "Under maintenance" : "Operational"}
          </Text>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => router.push("/map-rides")}
          >
            <ButtonText>All rides ({rides.length})</ButtonText>
            <ButtonIcon as={ChevronRightIcon} />
          </Button>
        </HStack>
        {rides.length > 6 && (
          <Text size="xs" className="text-muted-foreground">
            First six rides shown. Open All rides for the complete list.
          </Text>
        )}
      </VStack>
    </ScrollView>
  );
}
