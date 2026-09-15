import "@/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaListener,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { Uniwind } from "uniwind";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { AuthProvider } from "@/lib/auth";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
        <GluestackUIProvider mode="light">
          <AuthProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
          </AuthProvider>
        </GluestackUIProvider>
      </SafeAreaListener>
    </SafeAreaProvider>
  );
}
