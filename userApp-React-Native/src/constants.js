import Constants from "expo-constants";
import { Platform } from "react-native";

const host =
  Platform.OS === "web"
    ? window.location.hostname
    : Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";

export const API_BASE_URL = (
  Constants.expoConfig?.extra?.apiBaseUrl || `http://${host}:8000`
).replace(/\/$/, "");
