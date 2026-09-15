import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { Icon, ChevronRightIcon } from "@/components/ui/icon";
import { useResource } from "@/lib/use-resource";
import { Reservation } from "@/lib/api";
import { displayDate } from "@/lib/dates";

export function NextPlan({
  token,
  refreshKey,
  visible,
}: {
  token: string;
  refreshKey: string;
  visible: boolean;
}) {
  const [now, setNow] = useState(Date.now);
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      const timer = setInterval(() => setNow(Date.now()), 30000);
      return () => clearInterval(timer);
    }, []),
  );
  const { data, error, reload } = useResource<Reservation[]>(
    "/api/queue/reservations/?upcoming=true",
    token,
    refreshKey,
  );
  const next = data?.find(
    (item) =>
      !item.validated && item.ends_at && new Date(item.ends_at).getTime() > now,
  );
  if (!visible) return null;
  if (error)
    return (
      <Box className="bg-card border-t border-border px-4 py-2">
        <Button variant="link" size="sm" onPress={reload}>
          <ButtonText>Reload your next plan</ButtonText>
        </Button>
      </Box>
    );
  if (!next) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open next ride pass: ${next.ride_name}, ${displayDate(next.date)}, ${next.start_time.slice(0, 5)} ${next.time_zone}`}
      onPress={() =>
        router.push({
          pathname: "/reservation/[id]",
          params: { id: next.reservation_id },
        })
      }
      className="bg-hero px-4 py-3 min-h-16 data-[active=true]:opacity-80"
    >
      <HStack space="md" className="w-full max-w-lg self-center items-center">
        <VStack space="xs" className="flex-1">
          <Text
            bold
            size="sm"
            numberOfLines={1}
            className="text-hero-foreground"
          >
            Next · {next.ride_name}
          </Text>
          <Text size="xs" className="text-hero-muted">
            {displayDate(next.date)} · {next.start_time.slice(0, 5)}{" "}
            {next.time_zone}
          </Text>
        </VStack>
        <Icon as={ChevronRightIcon} className="text-hero-foreground" />
      </HStack>
    </Pressable>
  );
}
