import { useEffect, useState } from "react";
import { api } from "./api";

export function useResource<T>(path: string, token?: string | null) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    path: string;
    token?: string | null;
    revision: number;
    data: T | null;
    error: unknown;
  } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    api<T>(path, token, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setResult({ path, token, revision, data, error: null });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({ path, token, revision, data: null, error });
      });
    return () => controller.abort();
  }, [path, token, revision]);
  const current =
    result?.path === path &&
    result.token === token &&
    result.revision === revision
      ? result
      : null;
  return {
    data: current?.data ?? null,
    error: current?.error,
    loading: !current,
    reload: () => setRevision((n) => n + 1),
  };
}
