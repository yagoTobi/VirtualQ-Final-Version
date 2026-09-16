import { Stack, usePathname } from "expo-router";
import { VisitorStack } from "@/components/visitor-navigation";
import { useAuth } from "@/lib/auth";

export const unstable_settings = { initialRouteName: "account" };

export default function AccountLayout() {
  const { ready, user } = useAuth();
  const pathname = usePathname();
  return (
    <VisitorStack>
      <Stack.Protected guard={!ready || !!user}>
        <Stack.Screen name="account" />
        <Stack.Screen name="profile" />
      </Stack.Protected>
      <Stack.Screen
        name="sign-in"
        initialParams={pathname === "/profile" ? { next: "/profile" } : undefined}
      />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="set-password" />
    </VisitorStack>
  );
}
