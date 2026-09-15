import { useState } from "react";
import { router } from "expo-router";
import { Page } from "@/components/page";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Card } from "@/components/ui/card";
import { Box } from "@/components/ui/box";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { Image } from "@/components/ui/image";
import { Pressable } from "@/components/ui/pressable";
import {
  Icon,
  ChevronRightIcon,
  SearchIcon,
  GlobeIcon,
  CloseIcon,
} from "@/components/ui/icon";
import { ErrorMessage, Loading } from "@/components/feedback";
import { Ride } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

export default function Discover({ fromMap = false }: { fromMap?: boolean }) {
  const {
    data: rides,
    error,
    refreshing,
    reload,
  } = useResource<Ride[]>("/api/parkRides/theme_park_rides/");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = rides?.filter(
    (ride) =>
      `${ride.ride_name} ${ride.area_name} ${ride.ride_type}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "all" ||
        (status === "available"
          ? !ride.under_maintenance
          : ride.under_maintenance)),
  );
  return (
    <Page
      title={fromMap ? "Park rides" : "Explore"}
      refreshing={refreshing && !!rides}
      onRefresh={reload}
    >
      {!fromMap && (
        <HStack
          space="md"
          className="bg-hero rounded-2xl px-4 py-3 items-center"
        >
          <VStack space="xs" className="flex-1">
            <Text bold className="text-hero-foreground">
              Your park today
            </Text>
            <Text size="sm" className="text-hero-muted">
              {rides
                ? `${rides.length} rides · ${rides.filter((r) => !r.under_maintenance).length} operational`
                : "Explore attractions"}
            </Text>
          </VStack>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full"
            accessibilityLabel="Open the park map"
            onPress={() => router.push("/map")}
          >
            <ButtonIcon as={GlobeIcon} />
            <ButtonText>Map</ButtonText>
          </Button>
        </HStack>
      )}
      <VStack space="md">
        <Input className="rounded-xl bg-card shadow-none">
          <InputSlot>
            <InputIcon as={SearchIcon} />
          </InputSlot>
          <InputField
            aria-label="Search rides"
            accessibilityLabel="Search rides"
            placeholder="Search rides or areas"
            value={query}
            onChangeText={setQuery}
          />
          {query !== "" && (
            <InputSlot
              accessibilityLabel="Clear search"
              onPress={() => setQuery("")}
              className="min-h-11 min-w-11"
            >
              <InputIcon as={CloseIcon} />
            </InputSlot>
          )}
        </Input>
        <HStack
          space="sm"
          className="flex-wrap"
          aria-label="Ride status filters"
        >
          {[
            ["all", "All rides"],
            ["available", "Operational"],
            ["maintenance", "Maintenance"],
          ].map(([value, label]) => (
            <Button
              key={value}
              size="sm"
              className="rounded-full"
              variant={status === value ? "secondary" : "outline"}
              accessibilityState={{ selected: status === value }}
              onPress={() => setStatus(value)}
            >
              <ButtonText>{label}</ButtonText>
            </Button>
          ))}
        </HStack>
        {filtered && (
          <Text size="sm" className="text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "ride" : "rides"}
          </Text>
        )}
        <ErrorMessage error={error} retry={reload} />
        {!rides && !error && <Loading label="Finding your adventures…" />}
        {filtered?.length === 0 && (
          <Card>
            <Heading size="lg">No rides found</Heading>
            <Text>Try a different ride name, area or filter.</Text>
            <Button
              variant="outline"
              onPress={() => {
                setQuery("");
                setStatus("all");
              }}
            >
              <ButtonText>Clear filters</ButtonText>
            </Button>
          </Card>
        )}
        <VStack className="overflow-hidden rounded-2xl bg-card border border-border">
          {filtered?.map((ride) => (
            <Pressable
              key={ride.ride_id}
              accessibilityRole="button"
              accessibilityLabel={`Explore ${ride.ride_name}`}
              onPress={() =>
                router.push({
                  pathname: fromMap
                    ? "/(visitor)/(map)/ride/[id]"
                    : "/(visitor)/(explore)/ride/[id]",
                  params: { id: ride.ride_id },
                })
              }
              className="px-3 py-4 data-[active=true]:bg-accent data-[focus-visible=true]:web:ring-2 data-[focus-visible=true]:web:ring-ring"
            >
              <HStack space="md" className="items-center">
                <Image
                  source={{ uri: ride.ride_thumbnail }}
                  alt={ride.ride_name}
                  className="w-20 h-20 rounded-xl shrink-0"
                  resizeMode="cover"
                />
                <VStack space="xs" className="flex-1">
                  <Text size="xs" className="text-muted-foreground">
                    {ride.area_name}
                  </Text>
                  <Heading size="lg">{ride.ride_name}</Heading>
                  <Text size="sm" className="text-muted-foreground">
                    {ride.ride_duration} min · {ride.height_restriction} cm min.
                  </Text>
                  <HStack space="xs" className="items-center">
                    <Box
                      className={`w-1.5 h-1.5 rounded-full ${ride.under_maintenance ? "bg-destructive" : "bg-success"}`}
                    />
                    <Text
                      size="xs"
                      className={
                        ride.under_maintenance
                          ? "text-destructive"
                          : "text-success"
                      }
                    >
                      {ride.under_maintenance ? "Maintenance" : "Operational"}
                    </Text>
                  </HStack>
                </VStack>
                <Icon
                  as={ChevronRightIcon}
                  className="text-muted-foreground shrink-0"
                />
              </HStack>
            </Pressable>
          ))}
        </VStack>
      </VStack>
    </Page>
  );
}
