import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Keyboard, Linking, Platform } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Page } from "@/components/page";
import { RequireAuth } from "@/components/require-auth";
import { Field } from "@/components/field";
import { ErrorMessage, Loading } from "@/components/feedback";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { Alert, AlertText } from "@/components/ui/alert";
import { api, Ticket } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { displayDate } from "@/lib/dates";

type TicketMatch = {
  ticket: Ticket;
  visitor_name: string;
  visit_status: "today" | "upcoming" | "past";
};

export default function ScanTicket() {
  return (
    <RequireAuth>
      <Scanner />
    </RequireAuth>
  );
}

function Scanner() {
  const { token } = useAuth();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [appActive, setAppActive] = useState(() => AppState.currentState === "active");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TicketMatch | null>(null);
  const [error, setError] = useState<unknown>(null);
  const focused = useRef(false);
  const pending = useRef(false);
  const request = useRef<AbortController | null>(null);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
        request.current?.abort();
        pending.current = false;
        setCameraOpen(false);
        setBusy(false);
      };
    }, []),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setAppActive(state === "active");
      if (state === "active") {
        void getPermission().catch((err) => {
          if (focused.current) setError(err);
        });
      } else {
        setCameraOpen(false);
      }
    });
    return () => subscription.remove();
  }, [getPermission]);

  async function startCamera() {
    Keyboard.dismiss();
    setError(null);
    setResult(null);
    try {
      const allowed = permission?.granted
        ? permission
        : await requestPermission();
      if (focused.current) setCameraOpen(allowed.granted);
    } catch (err) {
      if (focused.current) setError(err);
    }
  }

  async function findTicket(value: string) {
    if (pending.current || !focused.current) return;
    const trimmed = value.trim();
    if (!trimmed) {
      setError(new Error("Enter a ticket code or scan its QR."));
      return;
    }
    pending.current = true;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setCameraOpen(false);
    Keyboard.dismiss();
    setError(null);
    setResult(null);
    try {
      const match = await api<TicketMatch>(
        "/api/tickets/tickets/validate/",
        token,
        {
          method: "POST",
          body: JSON.stringify({ ticket_id: trimmed }),
          signal: controller.signal,
        },
      );
      if (!controller.signal.aborted) {
        setResult(match);
        setCode("");
      }
    } catch (err) {
      if (!controller.signal.aborted) setError(err);
    } finally {
      if (!controller.signal.aborted) {
        pending.current = false;
        setBusy(false);
      }
    }
  }

  return (
    <Page
      title="Find a park ticket"
      subtitle="Scan a park-entry QR or enter its code to find a pass in your account."
    >
      <Card size="sm" className="w-full max-w-lg self-center">
        <Heading size="lg">Scan with your camera</Heading>
        <Text size="sm" className="text-muted-foreground">
          This looks up your ticket. The park team handles admission.
        </Text>
        {!permission && <Loading label="Checking camera permission…" />}
        {permission?.status === "denied" && permission.canAskAgain && (
          <Alert>
            <AlertText>
              Camera access was declined. Try again or enter a ticket code below.
            </AlertText>
          </Alert>
        )}
        {cameraOpen && appActive && permission?.granted ? (
          <>
            <Box className="h-64 overflow-hidden rounded-2xl bg-foreground">
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={({ data }) => void findTicket(data)}
                onMountError={() => {
                  setCameraOpen(false);
                  setError(new Error("The camera could not open. Try reopening it or enter the ticket code below."));
                }}
              />
            </Box>
            <Text size="sm">Point the camera at the park-entry QR.</Text>
            <Button variant="outline" onPress={() => setCameraOpen(false)}>
              <ButtonText>Close camera</ButtonText>
            </Button>
          </>
        ) : permission?.canAskAgain || permission?.granted ? (
          <Button isDisabled={busy} onPress={startCamera}>
            <ButtonText>Open camera</ButtonText>
          </Button>
        ) : permission ? (
          <>
            <Text size="sm">
              Camera access is off. You can still enter a code below.
            </Text>
            {Platform.OS !== "web" ? (
              <Button
                variant="outline"
                onPress={() => Linking.openSettings().catch(setError)}
              >
                <ButtonText>Open camera settings</ButtonText>
              </Button>
            ) : (
              <Text size="sm">
                To scan, allow camera access in your browser’s site settings.
              </Text>
            )}
          </>
        ) : null}
      </Card>
      <Card size="sm" className="w-full max-w-lg self-center">
        <Field
          label="Ticket code"
          placeholder="Paste the code from your ticket"
          value={code}
          onChangeText={setCode}
          autoCorrect={false}
          autoComplete="off"
          maxLength={200}
          editable={!busy}
          returnKeyType="go"
          onSubmitEditing={() => void findTicket(code)}
        />
        <Button
          variant="outline"
          isDisabled={busy || !code.trim()}
          onPress={() => void findTicket(code)}
        >
          {busy && <ButtonSpinner />}
          <ButtonText>{busy ? "Finding ticket…" : "Find ticket"}</ButtonText>
        </Button>
        <ErrorMessage error={error} />
      </Card>
      {result && (
        <Card size="sm" className="w-full max-w-lg self-center">
          <Heading size="xl">{result.visitor_name}’s ticket</Heading>
          <Text bold>{displayDate(result.ticket.date_of_visit)}</Text>
          <Alert variant={result.visit_status === "past" ? "destructive" : "default"}>
            <AlertText>
              {result.visit_status === "today"
                ? "This ticket is for today. Show your pass to the park team."
                : result.visit_status === "upcoming"
                  ? "This ticket is for a future visit, not entry today."
                  : "This ticket’s visit date has passed."}
            </AlertText>
          </Alert>
          <Button
            onPress={() =>
              router.push({
                pathname: "/ticket/[id]",
                params: { id: result.ticket.id },
              })
            }
          >
            <ButtonText>Open this pass</ButtonText>
          </Button>
        </Card>
      )}
      <Button variant="link" onPress={() => router.dismissTo("/tickets")}>
        <ButtonText>Back to tickets</ButtonText>
      </Button>
      <Text size="sm" className="text-muted-foreground">
        Looking for a ride reservation? Open Plans in the bottom bar.
      </Text>
    </Page>
  );
}
