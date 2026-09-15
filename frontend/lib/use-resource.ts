import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { api, ApiError } from "./api";

export function useResource<T>(
  path: string,
  token?: string | null,
  refreshKey?: string,
) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    path: string;
    token?: string | null;
    data: T | null;
    error: unknown;
    refreshing: boolean;
  } | null>(null);
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      // Keep this screen's content while checking for changes on focus.
      // Never reuse another URL's or account's private result.
      setResult((previous) => ({
        path,
        token,
        data:
          previous?.path === path && previous.token === token
            ? previous.data
            : null,
        error: null,
        refreshing: true,
      }));
      api<T>(path, token, { signal: controller.signal })
        .then((data) => {
          if (!controller.signal.aborted)
            setResult({ path, token, data, error: null, refreshing: false });
        })
        .catch((error) => {
          if (!controller.signal.aborted)
            setResult((previous) => ({
              path,
              token,
              data:
                error instanceof ApiError && [401, 403, 404].includes(error.status)
                  ? null
                  : previous?.path === path && previous.token === token
                    ? previous.data
                    : null,
              error,
              refreshing: false,
            }));
        });
      return () => controller.abort();
    }, [path, token, revision, refreshKey]),
  );
  const current =
    result?.path === path && result.token === token
      ? result
      : null;
  return {
    data: current?.data ?? null,
    error: current?.error,
    loading: !current || (current.refreshing && current.data === null),
    refreshing: current?.refreshing ?? true,
    reload: () => setRevision((n) => n + 1),
  };
}
