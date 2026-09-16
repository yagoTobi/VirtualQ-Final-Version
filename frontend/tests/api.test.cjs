const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const ts = require("typescript");

// Run the actual shared client with only its platform imports and network mocked.
// This keeps request regression checks independent of Expo's native runtime.
const source = ts.transpileModule(
  readFileSync(require.resolve("../lib/api.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function client(fetch) {
  const exports = {};
  let expire;
  runInNewContext(source, {
    exports,
    fetch,
    AbortController,
    FormData,
    process: { env: {} },
    require: (name) =>
      name === "react-native" ? { Platform: { OS: "web" } } : { default: {} },
    setTimeout: (callback) => {
      expire = callback;
      return 1;
    },
    clearTimeout: () => {},
  });
  return { api: exports.api, expire: () => expire() };
}

test("screen cancellation and timeout both abort the fetch", async () => {
  for (const cause of ["timeout", "screen", "already cancelled"]) {
    const screen = new AbortController();
    if (cause === "already cancelled") screen.abort();
    let requestSignal;
    const request = client((_url, init) => {
      requestSignal = init.signal;
      return new Promise((_resolve, reject) => {
        const abort = () => reject(new Error("aborted"));
        if (init.signal.aborted) abort();
        else init.signal.addEventListener("abort", abort, { once: true });
      });
    });
    const result = request.api("/rides/", null, { signal: screen.signal });
    if (cause === "timeout") request.expire();
    else screen.abort();
    await assert.rejects(result, /Unable to reach VirtualQ/);
    assert.equal(requestSignal.aborted, true, cause);
  }
});

test("authentication, JSON errors and empty responses retain their contract", async () => {
  let captured;
  const request = client(async (url, init) => {
    captured = { url, init };
    return {
      status: 400,
      ok: false,
      text: async () => '{"start_time":["This time is full."]}',
    };
  });
  await assert.rejects(
    request.api("/book/", "demo-token", {
      method: "POST",
      body: '{"ticket":1}',
    }),
    (error) => error.status === 400 && /This time is full/.test(error.message),
  );
  assert.equal(captured.init.headers.Authorization, "Token demo-token");
  assert.equal(captured.init.headers["Content-Type"], "application/json");
  const empty = client(async () => ({ status: 204 }));
  assert.equal(
    await empty.api("/booking/1/", null, { method: "DELETE" }),
    undefined,
  );
  const revoked = client(async () => ({
    status: 401,
    ok: false,
    text: async () => '{"detail":"Invalid token."}',
  }));
  await assert.rejects(
    revoked.api("/tickets/", "revoked-token"),
    (error) => error.status === 401 && /Sign out, then sign in again/.test(error.message),
  );
});
