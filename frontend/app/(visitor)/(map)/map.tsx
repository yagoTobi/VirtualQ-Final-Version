import { useState } from "react";
import { router } from "expo-router";
import Svg, { Path, Ellipse } from "react-native-svg";
import { useResolveClassNames } from "uniwind";
import { Page } from "@/components/page";
import { Loading, ErrorMessage } from "@/components/feedback";
import { Box } from "@/components/ui/box";
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

// Illustrative positions only. This is not geographic data or a navigation route.
const positions = [
  "top-10 left-10",
  "top-24 right-10",
  "bottom-20 left-20",
  "top-44 left-6",
  "bottom-16 right-8",
  "top-8 right-24",
];

export default function ParkMap() {
  const {
    data: rides,
    error,
    reload: load,
  } = useResource<Ride[]>("/api/parkRides/theme_park_rides/");
  const [selected, setSelected] = useState<number | null>(null);
  const park = useResolveClassNames("text-secondary");
  const paths = useResolveClassNames("text-card");
  const lake = useResolveClassNames("text-primary");
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
          <Box className="h-72 md:h-96 bg-muted rounded-3xl overflow-hidden border border-border relative">
            <Box className="absolute inset-0" aria-hidden>
              <Svg
                width="100%"
                height="100%"
                viewBox="0 0 360 384"
                preserveAspectRatio="none"
              >
                <Path d="M0 0H360V384H0Z" fill={park.color} />
                <Path
                  d="M36 340C190 350 280 290 270 222S77 272 67 152 238 45 337 54"
                  fill="none"
                  stroke={paths.color}
                  strokeWidth={22}
                  strokeLinecap="round"
                />
                <Path
                  d="M140 322C163 227 176 151 299 137"
                  fill="none"
                  stroke={paths.color}
                  strokeWidth={14}
                  strokeLinecap="round"
                />
                <Ellipse
                  cx={227}
                  cy={73}
                  rx={38}
                  ry={25}
                  fill={lake.color}
                  opacity={0.18}
                />
                <Ellipse
                  cx={42}
                  cy={272}
                  rx={31}
                  ry={47}
                  fill={lake.color}
                  opacity={0.12}
                />
                <Ellipse
                  cx={301}
                  cy={316}
                  rx={44}
                  ry={30}
                  fill={lake.color}
                  opacity={0.12}
                />
              </Svg>
            </Box>
            {rides.slice(0, 6).map((ride, index) => (
              <VStack
                key={ride.ride_id}
                space="xs"
                className={`absolute ${positions[index]} items-center`}
              >
                <Button
                  size="icon"
                  variant={
                    active?.ride_id === ride.ride_id ? "default" : "outline"
                  }
                  className="rounded-full w-12 h-12"
                  accessibilityState={{
                    selected: active?.ride_id === ride.ride_id,
                  }}
                  accessibilityLabel={`Map pin ${index + 1}: ${ride.ride_name}${ride.under_maintenance ? ", under maintenance" : ""}`}
                  onPress={() => setSelected(ride.ride_id)}
                >
                  <ButtonText>{index + 1}</ButtonText>
                </Button>
                <Text
                  size="2xs"
                  className="text-foreground bg-card rounded-lg px-2 py-1"
                >
                  {ride.under_maintenance ? "Maintenance" : "Ride"}
                </Text>
              </VStack>
            ))}
          </Box>
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
