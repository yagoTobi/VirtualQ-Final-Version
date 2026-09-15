const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const ts = require("typescript");

const exportsForTest = {};
runInNewContext(ts.transpileModule(
  readFileSync(require.resolve("../lib/after-auth.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText, { exports: exportsForTest });

test("post-login navigation accepts app paths and rejects external or malformed destinations", () => {
  assert.equal(exportsForTest.afterAuth("/reserve/12"), "/reserve/12");
  assert.equal(exportsForTest.afterAuth("/plans"), "/plans");
  for (const next of [undefined, null, [], ["/plans"], "//example.com", "https://example.com", "/\\example.com", "/%2fexample.com", "/../plans"]) {
    assert.equal(exportsForTest.afterAuth(next), "/account");
  }
});
