const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const ts = require("typescript");

const source = ts.transpileModule(
  readFileSync(require.resolve("../lib/auth.tsx"), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  },
).outputText;

test("sign-out clears a revoked credential on web and native; network failures remain visible", async () => {
  for (const platform of ["web", "android"]) {
    const state = [];
    let cursor = 0;
    let saved;
    let failure;
    class ApiError extends Error {
      constructor(status) { super("Unauthorized"); this.status = status; }
    }
    const storage = {
      setItem: (_key, value) => { saved = value; },
      removeItem: () => { saved = null; },
    };
    const exports = {};
    runInNewContext(source, {
      exports,
      sessionStorage: storage,
      require: (name) => {
        if (name === "react") return {
          createContext: () => ({ Provider: "provider" }),
          useEffect: () => {},
          useState: (initial) => {
            const index = cursor++;
            if (!(index in state)) state[index] = initial;
            return [state[index], (value) => { state[index] = value; }];
          },
        };
        if (name === "react/jsx-runtime")
          return { jsx: (_type, props) => props };
        if (name === "react-native") return { Platform: { OS: platform } };
        if (name === "expo-secure-store") return {
          setItemAsync: storage.setItem,
          deleteItemAsync: storage.removeItem,
        };
        return {
          ApiError,
          api: async (path) => {
            if (path.endsWith("/logout/")) throw failure;
            return { id: 1, username: "visitor" };
          },
        };
      },
    });
    function render() {
      cursor = 0;
      return exports.AuthProvider({ children: null }).value;
    }
    await render().signIn("revoked-token");
    failure = new Error("Offline");
    await assert.rejects(render().signOut(), /Offline/);
    assert.equal(saved, "revoked-token");
    assert.equal(render().user.username, "visitor");
    failure = new ApiError(401);
    await render().signOut();
    assert.equal(saved, null, platform);
    assert.equal(render().token, null);
    assert.equal(render().user, null);
  }
});
