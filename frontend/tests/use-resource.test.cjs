const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const ts = require("typescript");

const source = ts.transpileModule(
  readFileSync(require.resolve("../lib/use-resource.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

// Exercise the real hook's request lifecycle without an Expo/native renderer.
function resource() {
  const state = [];
  const requests = [];
  let cursor = 0;
  let focus;
  let cleanup;
  class ApiError extends Error {
    constructor(status) {
      super("Request failed");
      this.status = status;
    }
  }
  const exports = {};
  runInNewContext(source, {
    exports,
    AbortController,
    require: (name) => {
      if (name === "react")
        return {
          useCallback: (callback) => callback,
          useState: (initial) => {
            const index = cursor++;
            if (!(index in state)) state[index] = initial;
            return [
              state[index],
              (value) => {
                state[index] =
                  typeof value === "function" ? value(state[index]) : value;
              },
            ];
          },
        };
      if (name === "expo-router")
        return { useFocusEffect: (callback) => { focus = callback; } };
      return {
        ApiError,
        api: (path, token, { signal }) =>
          new Promise((resolve, reject) => {
            requests.push({ path, token, signal, resolve, reject });
          }),
      };
    },
  });
  return {
    ApiError,
    requests,
    render: (path = "/tickets/", token = "account-a") => {
      cursor = 0;
      return exports.useResource(path, token);
    },
    focus: () => { cleanup?.(); cleanup = focus(); },
    blur: () => { cleanup?.(); },
  };
}

const settle = () => new Promise(setImmediate);

test("tab refocus and reload retain content; offline refresh reports an error; revoked access clears it", async () => {
  const hook = resource();
  assert.equal(hook.render().loading, true);
  hook.focus();
  hook.requests[0].resolve(["pass-a"]);
  await settle();
  assert.deepEqual(hook.render().data, ["pass-a"]);

  hook.blur();
  hook.render();
  hook.focus();
  assert.equal(hook.render().loading, false);
  assert.equal(hook.render().refreshing, true);
  assert.deepEqual(hook.render().data, ["pass-a"]);
  hook.requests[1].reject(new Error("offline"));
  await settle();
  assert.deepEqual(hook.render().data, ["pass-a"]);
  assert.match(hook.render().error.message, /offline/);

  hook.render().reload();
  hook.render();
  hook.focus();
  assert.deepEqual(hook.render().data, ["pass-a"]);
  hook.requests[2].reject(new hook.ApiError(403));
  await settle();
  assert.equal(hook.render().data, null);
  assert.equal(hook.render().loading, false);
});

test("account/date changes hide previous results immediately and late requests cannot restore them", async () => {
  const hook = resource();
  hook.render();
  hook.focus();
  hook.requests[0].resolve(["private-pass-a"]);
  await settle();
  assert.equal(hook.render("/tickets/", "account-b").data, null);
  hook.focus();
  hook.requests[1].resolve(["private-pass-b"]);
  await settle();
  assert.deepEqual(hook.render("/tickets/", "account-b").data, ["private-pass-b"]);
  assert.equal(hook.render("/tickets/?date=tomorrow", "account-b").data, null);
  hook.focus();
  const abandoned = hook.requests[2];
  hook.render("/tickets/?date=later", "account-b");
  hook.focus();
  assert.equal(abandoned.signal.aborted, true);
  hook.requests[3].resolve(["later-pass"]);
  await settle();
  abandoned.resolve(["wrong-date-pass"]);
  await settle();
  assert.deepEqual(hook.render("/tickets/?date=later", "account-b").data, ["later-pass"]);
});
