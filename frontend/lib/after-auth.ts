import type { Href } from "expo-router";

export function afterAuth(next?: unknown): Href {
  return typeof next === "string" && /^\/(?!\/)[a-zA-Z0-9/_-]+$/.test(next)
    ? (next as Href)
    : "/account";
}
