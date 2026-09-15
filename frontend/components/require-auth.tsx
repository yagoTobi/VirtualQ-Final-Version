import { ReactNode, useCallback } from "react";
import { router, useFocusEffect, usePathname } from "expo-router";
import { Page } from "@/components/page";
import { Loading } from "@/components/feedback";
import { useAuth } from "@/lib/auth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, user } = useAuth();
  const pathname = usePathname();
  useFocusEffect(
    useCallback(() => {
      if (ready && !user)
        router.navigate({ pathname: "/sign-in", params: { next: pathname } });
    }, [ready, user, pathname]),
  );
  if (!ready || !user)
    return (
      <Page>
        <Loading />
      </Page>
    );
  return children;
}
