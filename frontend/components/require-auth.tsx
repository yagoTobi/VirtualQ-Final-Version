import { ReactNode } from "react";
import { Redirect } from "expo-router";
import { Page } from "@/components/page";
import { Loading } from "@/components/feedback";
import { useAuth } from "@/lib/auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, user } = useAuth();
  if (!ready)
    return (
      <Page>
        <Loading />
      </Page>
    );
  if (!user) return <Redirect href="/sign-in" />;
  return children;
}
