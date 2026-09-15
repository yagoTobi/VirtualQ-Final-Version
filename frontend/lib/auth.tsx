import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { api, ApiError, User } from "./api";

const key = "virtualq-token";
// Browser storage lasts only for this tab. Native credentials use the OS keychain.
const storage = {
  get: async () =>
    Platform.OS === "web"
      ? sessionStorage.getItem(key)
      : SecureStore.getItemAsync(key),
  set: async (value: string | null) => {
    if (Platform.OS === "web") {
      value
        ? sessionStorage.setItem(key, value)
        : sessionStorage.removeItem(key);
    } else if (value) await SecureStore.setItemAsync(key, value);
    else await SecureStore.deleteItemAsync(key);
  },
};
const AuthContext = createContext<{
  token: string | null;
  user: User | null;
  ready: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}>({
  token: null,
  user: null,
  ready: false,
  signIn: async () => {},
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    storage
      .get()
      .then(async (saved) => {
        if (!saved) return;
        try {
          const profile = await api<User>("/api/clients/user/", saved);
          if (active) {
            setToken(saved);
            setUser(profile);
          }
        } catch (error) {
          if (error instanceof ApiError && error.status === 401)
            await storage.set(null);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  async function signIn(value: string) {
    const profile = await api<User>("/api/clients/user/", value);
    await storage.set(value);
    setToken(value);
    setUser(profile);
  }
  async function signOut() {
    if (token) await api("/api/clients/logout/", token, { method: "POST" });
    await storage.set(null);
    setToken(null);
    setUser(null);
  }
  async function refresh() {
    if (token) setUser(await api<User>("/api/clients/user/", token));
  }
  return (
    <AuthContext.Provider
      value={{ token, user, ready, signIn, signOut, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
