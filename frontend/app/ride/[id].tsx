import { useLocalSearchParams, router } from "expo-router";
import { Page } from "@/components/page";
import { ErrorMessage, Loading } from "@/components/feedback";
import { Ride } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { Card } from "@/components/ui/card";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Button, ButtonText } from "@/components/ui/button";

export default function RideDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    data: ride,
    error,
    reload: load,
  } = useResource<Ride>(`/api/parkRides/theme_park_rides/${id}/`);
  return (
    <Page>
      <Button
        variant="link"
        className="self-start"
        onPress={() => router.replace("/")}
      >
        <ButtonText>← All adventures</ButtonText>
      </Button>
      <ErrorMessage error={error} retry={load} />
      {!ride && !error && <Loading />}
      {ride && (
        <VStack space="lg">
          <Image
            source={{ uri: ride.ride_thumbnail }}
            alt={ride.ride_name}
            className="w-full h-44 md:h-96 rounded-3xl"
            resizeMode="cover"
          />
          <HStack space="2xl" className="flex-col md:flex-row">
            <VStack space="md" className="flex-1">
              <Text className="text-primary" bold>
                {ride.area_name}
              </Text>
              <Heading size="2xl">{ride.ride_name}</Heading>
              <Text className="text-muted-foreground">
                {ride.ride_description}
              </Text>
              <Heading size="lg">Accessibility</Heading>
              {Object.entries(ride)
                .filter(
                  ([k, v]) => k.startsWith("accessibility_") && v === true,
                )
                .map(([k]) => (
                  <Text key={k}>
                    ✓ {k.replace("accessibility_", "").replaceAll("_", " ")}
                  </Text>
                ))}
              {!Object.entries(ride).some(
                ([k, v]) => k.startsWith("accessibility_") && v === true,
              ) && (
                <Text className="text-muted-foreground">
                  Ask the ride team about assistance before boarding.
                </Text>
              )}
            </VStack>
            <Card className="w-full md:w-80">
              <Badge
                className="self-start"
                variant={ride.under_maintenance ? "outline" : "secondary"}
              >
                <BadgeText>
                  {ride.under_maintenance
                    ? "Under maintenance"
                    : "Ready for adventure"}
                </BadgeText>
              </Badge>
              <Heading size="lg">Before you ride</Heading>
              <Text>{ride.height_restriction} cm minimum height</Text>
              <Text>{ride.ride_duration} minute ride</Text>
              <Text>
                Hours: {ride.opening_hour.slice(0, 5)}–
                {ride.closing_hour.slice(0, 5)}
              </Text>
              <Button
                isDisabled={ride.under_maintenance}
                onPress={() =>
                  router.push({ pathname: "/reserve/[id]", params: { id } })
                }
              >
                <ButtonText>
                  {ride.under_maintenance
                    ? "Booking unavailable"
                    : "Reserve a ride"}
                </ButtonText>
              </Button>
              {ride.under_maintenance && (
                <Text className="text-muted-foreground">
                  This ride is taking a short break. Check back before planning
                  your visit.
                </Text>
              )}
            </Card>
          </HStack>
        </VStack>
      )}
    </Page>
  );
}
