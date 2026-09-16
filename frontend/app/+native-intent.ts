export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const url = new URL(path);
    const route = `${url.host}${url.pathname}`.replace(/^\/+|\/+$/g, "");
    if (url.protocol === "virtualq:" && route === "set-password") {
      // Expo Router 57 drops hashes while extracting custom-scheme paths.
      return `/set-password${url.search}${url.hash}`;
    }
  } catch {
    // Relative router paths do not need URL normalization.
  }
  return path;
}
