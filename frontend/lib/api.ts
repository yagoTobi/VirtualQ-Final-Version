import Constants from "expo-constants";
import { Platform } from "react-native";

const host =
  Platform.OS === "web"
    ? typeof window === "undefined"
      ? "localhost"
      : window.location.hostname
    : Constants.expoConfig?.hostUri?.split(":")[0] || "127.0.0.1";
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || `http://${host}:8000`
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    public details: unknown,
  ) {
    const describe = (value: unknown): string => {
      if (Array.isArray(value)) return value.map(describe).join(" ");
      if (value && typeof value === "object")
        return Object.entries(value)
          .map(
            ([k, v]) =>
              `${k === "detail" || k === "non_field_errors" ? "" : k.replaceAll("_", " ") + ": "}${describe(v)}`,
          )
          .join("\n");
      return String(value ?? "Something went wrong. Please try again.");
    };
    super(describe(details));
  }
}

export async function api<T>(
  path: string,
  token?: string | null,
  init: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (init.signal?.aborted) cancel();
  init.signal?.addEventListener("abort", cancel);
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(init.body && !(init.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(token ? { Authorization: `Token ${token}` } : {}),
        ...init.headers,
      },
    });
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError(
        response.status,
        "The server returned an unexpected response. Please try again.",
      );
    }
    if (!response.ok) throw new ApiError(response.status, data);
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(
      "Unable to reach VirtualQ. Check your connection and try again.",
    );
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener("abort", cancel);
  }
}

export type User = {
  id: number;
  username: string;
  name: string;
  last_name: string;
  email: string;
  dob: string | null;
  height: number | null;
  is_staff: boolean;
  permissions: string[];
};
export type Ride = {
  ride_id: number;
  ride_name: string;
  ride_description: string;
  ride_thumbnail: string;
  area_name: string;
  ride_type: string;
  height_restriction: number;
  ride_duration: number;
  ride_capacity: number;
  opening_hour: string;
  closing_hour: string;
  under_maintenance: boolean;
  [key: string]: unknown;
};

export type Ticket = {
  id: number;
  user: string;
  date_of_visit: string;
  guest_number: number | null;
  ticket_id: string;
};
export type Guest = {
  guest_id: number;
  ticket: number;
  name: string | null;
  age: number | null;
  height: number | null;
  picture: string | null;
};
