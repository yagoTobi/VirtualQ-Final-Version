import { Alert, AlertText } from "@/components/ui/alert";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";

export function ErrorMessage({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  if (!error) return null;
  return (
    <VStack space="md">
      <Alert variant="destructive" accessibilityRole="alert">
        <AlertText>
          {error instanceof Error ? error.message : String(error)}
        </AlertText>
      </Alert>
      {retry && (
        <Button variant="outline" onPress={retry}>
          <ButtonText>Try again</ButtonText>
        </Button>
      )}
    </VStack>
  );
}
export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <VStack space="md" className="items-center py-12" aria-live="polite">
      <Spinner />
      <Text className="text-muted-foreground">{label}</Text>
    </VStack>
  );
}
