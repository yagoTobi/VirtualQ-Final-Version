import { ReactNode, useEffect, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform } from "react-native";
import { Link, router, usePathname } from "expo-router";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";
import { ScrollView } from "@/components/ui/scroll-view";
import { Pressable } from "@/components/ui/pressable";
import { useAuth } from "@/lib/auth";
import {
  Icon,
  SearchIcon,
  GlobeIcon,
  SettingsIcon,
  CalendarDaysIcon,
} from "@/components/ui/icon";

export function Page({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hidden = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);
  const tabs = [
    { href: "/" as const, label: "Explore", icon: SearchIcon },
    { href: "/map" as const, label: "Park map", icon: GlobeIcon },
    { href: "/tickets" as const, label: "Tickets", icon: CalendarDaysIcon },
    { href: "/account" as const, label: "You", icon: SettingsIcon },
  ];
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled={Platform.OS !== "web"}
      style={{ flex: 1 }}
    >
      <Box className="flex-1 bg-background pt-safe">
        <Box className="bg-card border-b border-border">
          <HStack
            className="w-full max-w-7xl mx-auto px-4 md:px-8 py-2 items-center justify-between"
            space="md"
          >
            <Link href="/" asChild>
              <Pressable
                accessibilityLabel="VirtualQ home"
                className="flex-row items-center gap-2 min-h-11"
              >
                <Box className="bg-primary rounded-xl w-9 h-9 items-center justify-center">
                  <Text bold size="xl" className="text-primary-foreground">
                    Q
                  </Text>
                </Box>
                <Heading size="lg">VirtualQ</Heading>
              </Pressable>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onPress={() => router.push(user ? "/account" : "/sign-in")}
            >
              <ButtonText>{user ? user.name : "Sign in"}</ButtonText>
            </Button>
          </HStack>
        </Box>
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <VStack
            space="lg"
            className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-6"
          >
            {title && (
              <VStack space="sm">
                <Heading size="2xl">{title}</Heading>
                {subtitle && (
                  <Text className="text-muted-foreground">{subtitle}</Text>
                )}
              </VStack>
            )}
            {children}
            <Text
              size="xs"
              className="text-muted-foreground py-4 hidden md:flex"
            >
              VirtualQ · More park. Less waiting.
            </Text>
          </VStack>
        </ScrollView>
        {!keyboardVisible && (
          <Box className="bg-card border-t border-border pb-safe">
            <HStack
              className="w-full max-w-lg self-center px-3 py-2"
              space="sm"
            >
              {tabs.map((tab) => {
                const active =
                  pathname === tab.href ||
                  (tab.href === "/tickets" &&
                    (pathname.startsWith("/ticket/") ||
                      pathname === "/book-visit")) ||
                  (tab.href === "/account" &&
                    [
                      "/profile",
                      "/sign-in",
                      "/sign-up",
                      "/reset-password",
                    ].includes(pathname)) ||
                  (tab.href === "/" && pathname.startsWith("/ride/"));
                return (
                  <Link key={tab.href} href={tab.href} asChild>
                    <Pressable
                      accessibilityLabel={tab.label}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      className={`flex-1 min-h-14 py-2 rounded-2xl items-center justify-center gap-1 ${active ? "bg-secondary" : ""}`}
                    >
                      <Icon
                        as={tab.icon}
                        className={
                          active ? "text-primary" : "text-muted-foreground"
                        }
                      />
                      <Text
                        size="xs"
                        bold={active}
                        className={
                          active ? "text-primary" : "text-muted-foreground"
                        }
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  </Link>
                );
              })}
            </HStack>
          </Box>
        )}
      </Box>
    </KeyboardAvoidingView>
  );
}
