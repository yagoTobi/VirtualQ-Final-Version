import {
  ComponentProps,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  AccessibilityInfo,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, router, Stack, Tabs, usePathname } from "expo-router";
import { useCSSVariable } from "uniwind";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import {
  Icon,
  SearchIcon,
  GlobeIcon,
  SettingsIcon,
  CalendarDaysIcon,
  ClockIcon,
} from "@/components/ui/icon";
import { NextPlan } from "@/components/next-plan";
import { useAuth } from "@/lib/auth";

const ReducedMotion = createContext(true);
const visitorTabs = [
  { name: "(explore)", label: "Explore", icon: SearchIcon },
  { name: "(map)", label: "Park map", icon: GlobeIcon },
  { name: "(plans)", label: "Plans", icon: ClockIcon },
  { name: "(tickets)", label: "Tickets", icon: CalendarDaysIcon },
  { name: "(account)", label: "You", icon: SettingsIcon },
];
const screenTitles: Record<string, string> = {
  index: "Explore",
  map: "Park map",
  "map-rides": "Park rides",
  plans: "Plans",
  tickets: "Tickets",
  account: "You",
  profile: "Your details",
  "sign-in": "Sign in",
  "sign-up": "Create account",
  "reset-password": "Reset password",
  "set-password": "New password",
  "ride/[id]": "Ride details",
  "reserve/[id]": "Reserve a ride",
  "reservation/[id]": "Ride pass",
  "ticket/[id]": "Park pass",
  "book-visit": "Book a visit",
  "scan-ticket": "Find a ticket",
};

// Navigators require style objects; resolve the shared semantic token.
function useSceneStyle() {
  const background = useCSSVariable("--color-background");
  return {
    backgroundColor: typeof background === "string" ? background : undefined,
  };
}

export function VisitorStack({ children }: { children?: ReactNode }) {
  const reducedMotion = useContext(ReducedMotion);
  const contentStyle = useSceneStyle();
  const foreground = useCSSVariable("--color-foreground");
  return (
    <Stack
      screenOptions={({ route }) => ({
        title: screenTitles[route.name] ?? "VirtualQ",
        headerShown: Platform.OS !== "web",
        headerShadowVisible: false,
        headerStyle: contentStyle,
        headerTintColor:
          typeof foreground === "string" ? foreground : undefined,
        headerBackButtonDisplayMode: "minimal",
        animation: reducedMotion ? "none" : "default",
        contentStyle,
      })}
    >
      {children}
    </Stack>
  );
}

type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

function VisitorTabBar({ state, navigation }: TabBarProps) {
  const { token } = useAuth();
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
  useEffect(() => {
    Keyboard.dismiss();
  }, [pathname]);
  return (
    <Box className={keyboardVisible ? "hidden" : ""}>
      {token && (
        <NextPlan
          token={token}
          refreshKey={pathname}
          visible={["/", "/map", "/tickets", "/account"].includes(pathname)}
        />
      )}
      <Box className="bg-card border-t border-border pb-safe">
        <HStack className="w-full max-w-lg self-center px-2 py-1" space="xs">
          {state.routes.map((route, index) => {
            const tab = visitorTabs.find((item) => item.name === route.name);
            if (!tab) return null;
            const active = state.index === index;
            return (
              <Pressable
                key={route.key}
                accessibilityLabel={tab.label}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!active && !event.defaultPrevented)
                    navigation.navigate(route.name, route.params);
                }}
                onLongPress={() =>
                  navigation.emit({ type: "tabLongPress", target: route.key })
                }
                className="flex-1 min-h-14 py-1 items-center justify-center gap-1 rounded-xl data-[active=true]:bg-accent"
              >
                <Box
                  className={`w-14 h-7 rounded-full items-center justify-center ${active ? "bg-secondary" : ""}`}
                >
                  <Icon
                    as={tab.icon}
                    className={
                      active ? "text-primary" : "text-muted-foreground"
                    }
                  />
                </Box>
                <Text
                  size="xs"
                  bold={active}
                  // Fixed-width navigation labels must fit the smallest phone.
                  // Full screen content retains the user's font scaling.
                  {...(Platform.OS === "web"
                    ? {}
                    : { numberOfLines: 1, maxFontSizeMultiplier: 1.2 })}
                  className={active ? "text-primary" : "text-muted-foreground"}
                >
                  {Platform.OS !== "web" && tab.name === "(map)"
                    ? "Map"
                    : tab.label}
                </Text>
              </Pressable>
            );
          })}
        </HStack>
      </Box>
    </Box>
  );
}

export function VisitorNavigation() {
  const { user } = useAuth();
  const [reducedMotion, setReducedMotion] = useState(true);
  const sceneStyle = useSceneStyle();
  useEffect(() => {
    let active = true;
    const update = (value: boolean) => {
      if (active) setReducedMotion(value);
    };
    AccessibilityInfo.isReduceMotionEnabled()
      .then(update)
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      update,
    );
    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);
  return (
    <ReducedMotion.Provider value={reducedMotion}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled={Platform.OS !== "web"}
        style={{ flex: 1 }}
      >
        <Box
          className={`flex-1 bg-background ${Platform.OS === "web" ? "pt-safe" : ""}`}
        >
          {Platform.OS === "web" && (
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
                  className="max-w-32 md:max-w-48"
                  onPress={() =>
                    router.navigate(user ? "/account" : "/sign-in")
                  }
                >
                  <ButtonText numberOfLines={1}>
                    {user ? user.name : "Sign in"}
                  </ButtonText>
                </Button>
              </HStack>
            </Box>
          )}
          <Tabs
            initialRouteName="(explore)"
            backBehavior="initialRoute"
            tabBar={(props) => <VisitorTabBar {...props} />}
            screenOptions={{
              headerShown: false,
              sceneStyle,
              animation: reducedMotion ? "none" : "fade",
              transitionSpec: {
                animation: "timing",
                config: { duration: reducedMotion ? 0 : 160 },
              },
            }}
          >
            {visitorTabs.map((tab) => (
              <Tabs.Screen
                key={tab.name}
                name={tab.name}
                options={{ title: tab.label }}
              />
            ))}
          </Tabs>
        </Box>
      </KeyboardAvoidingView>
    </ReducedMotion.Provider>
  );
}
