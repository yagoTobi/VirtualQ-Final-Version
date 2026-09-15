import { useState } from "react";
import { router } from "expo-router";
import { MapSchematic } from "./schematic";
import { Page } from "@/components/page";
import { Loading, ErrorMessage } from "@/components/feedback";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icon";
import { Ride } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

export default function ParkMap() {
  const {
    data: rides,
    error,
    reload: load,
  } = useResource<Ride[]>("/api/parkRides/theme_park_rides/");
  const [selected, setSelected] = useState<number | null>(null);
  const active = rides?.find((r) => r.ride_id === selected) ?? rides?.[0];
  return (
    <Page title="Park map" subtitle="Tap a numbered pin to discover a ride.">
      <HStack space="sm" className="items-center flex-wrap">
        <Badge variant="outline">
          <BadgeText>Provisional map</BadgeText>
        </Badge>
        <Text size="sm" className="text-muted-foreground">
          Illustrative layout · not to scale
        </Text>
      </HStack>
      <ErrorMessage error={error} retry={load} />
      {!rides && !error && <Loading />}
      {rides && (
        <VStack space="lg" className="w-full max-w-2xl self-center">
          <MapSchematic
            rides={rides}
            selected={active?.ride_id}
            onSelect={setSelected}
            className="h-72 md:h-96 rounded-3xl border border-border"
          />
          {active && (
            <Card aria-live="polite">
              <HStack space="md" className="items-center">
                <VStack space="xs" className="flex-1">
                  <Text size="sm" className="text-primary">
                    {active.area_name}
                  </Text>
                  <Heading size="lg">{active.ride_name}</Heading>
                  <Text size="sm">
                    {active.ride_duration} min ·{" "}
                    {active.under_maintenance
                      ? "Maintenance"
                      : `${active.height_restriction} cm minimum`}
                  </Text>
                </VStack>
                <Button
                  size="icon"
                  accessibilityLabel={`Explore ${active.ride_name}`}
                  onPress={() =>
                    router.push({
                      pathname: "/(visitor)/(map)/ride/[id]",
                      params: { id: active.ride_id },
                    })
                  }
                >
                  <ButtonIcon as={ArrowRightIcon} />
                </Button>
              </HStack>
            </Card>
          )}
          <Text size="sm" className="text-muted-foreground">
            This preview uses real ride information with illustrative locations.
            Follow park signs for directions.{" "}
            {rides.length > 6
              ? "The first six rides are shown on the map; all rides are listed below."
              : ""}
          </Text>
          <Heading size="xl">Around the park</Heading>
          {rides.length === 0 && (
            <Text className="text-muted-foreground">
              No rides are listed yet.
            </Text>
          )}
          {rides.map((ride, index) => (
            <Button
              key={ride.ride_id}
              variant="outline"
              className="justify-between"
              onPress={() =>
                router.push({
                  pathname: "/(visitor)/(map)/ride/[id]",
                  params: { id: ride.ride_id },
                })
              }
            >
              <ButtonText className="flex-1">
                {index + 1}. {ride.ride_name}
              </ButtonText>
              <ButtonIcon as={ArrowRightIcon} />
            </Button>
          ))}
        </VStack>
      )}
    </Page>
  );
}
