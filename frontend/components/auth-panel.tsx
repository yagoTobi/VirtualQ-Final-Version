import { ReactNode } from "react";
import { Platform } from "react-native";
import { Card } from "@/components/ui/card";
import { VStack } from "@/components/ui/vstack";

export function AuthPanel({ children }: { children: ReactNode }) {
  return Platform.OS === "web" ? (
    <Card size="sm" className="w-full max-w-lg self-center p-5 md:p-8">
      <VStack space="xl">{children}</VStack>
    </Card>
  ) : (
    <VStack space="xl" className="w-full max-w-lg self-center py-2">
      {children}
    </VStack>
  );
}
