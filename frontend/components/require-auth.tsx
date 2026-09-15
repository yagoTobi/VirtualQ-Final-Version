import { ReactNode } from "react";
import { Redirect, usePathname } from "expo-router";
import { Page } from "@/components/page";
import { Loading } from "@/components/feedback";
import { useAuth } from "@/lib/auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, user } = useAuth();
  const pathname = usePathname();
  if (!ready)
    return (
      <Page>
        <Loading />
      </Page>
    );
  if (!user)
    return (
      <Redirect href={{ pathname: "/sign-in", params: { next: pathname } }} />
    );
  return children;
}
