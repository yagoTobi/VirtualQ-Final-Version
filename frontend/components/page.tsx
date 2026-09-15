import { ReactNode } from "react";
import { Platform, RefreshControl } from "react-native";
import { Stack } from "expo-router";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { ScrollView } from "@/components/ui/scroll-view";

export function Page({
  children,
  title,
  subtitle,
  scroll = true,
  refreshing = false,
  onRefresh,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const content = (
    <>
      {title && Platform.OS !== "web" && <Stack.Screen options={{ title }} />}
      {((title && Platform.OS === "web") || subtitle) && (
        <VStack space="sm">
          {title && Platform.OS === "web" && (
            <Heading size="2xl">{title}</Heading>
          )}
          {subtitle && (
            <Text className="text-muted-foreground">{subtitle}</Text>
          )}
        </VStack>
      )}
      {children}
    </>
  );
  return scroll ? (
    <ScrollView
      className="flex-1 bg-background"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={
        onRefresh && Platform.OS !== "web" ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      <VStack
        space="lg"
        className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-6"
      >
        {content}
        <Text size="xs" className="text-muted-foreground py-4 hidden md:flex">
          VirtualQ · More park. Less waiting.
        </Text>
      </VStack>
    </ScrollView>
  ) : (
    <VStack
      space="lg"
      className="flex-1 bg-background w-full max-w-7xl mx-auto px-4 md:px-8 pt-4"
    >
      {content}
    </VStack>
  );
}
