const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const ts = require("typescript");

const exportsForTest = {};
runInNewContext(ts.transpileModule(
  readFileSync(require.resolve("../lib/reset-link.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText, { exports: exportsForTest, URLSearchParams });

test("recovery credentials come from a single complete fragment and ambiguous links are rejected", () => {
  const read = exportsForTest.readResetLink;
  const link = read("uid=MQ&token=test");
  assert.equal(link.uid, "MQ");
  assert.equal(link.token, "test");
  for (const fragment of [
    undefined, null, "", [], "uid=MQ", "token=test", "uid=&token=test",
    "uid=MQ&token=test&uid=Mg", "uid=MQ&token=test&token=other",
    `uid=${"x".repeat(129)}&token=test`, `uid=MQ&token=${"x".repeat(129)}`,
  ]) {
    assert.equal(read(fragment), null);
  }
});

test("native recovery links preserve their fragment through the installed Expo Router extractor", () => {
  const intent = {};
  runInNewContext(ts.transpileModule(
    readFileSync(require.resolve("../app/+native-intent.ts"), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText, { exports: intent, URL });
  const { extractExpoPathFromURL } = require("expo-router/build/fork/extractPathFromURL");
  for (const path of [
    "virtualq://set-password#uid=MQ&token=test",
    "virtualq:///set-password/#uid=MQ&token=test",
  ]) {
    const normalized = intent.redirectSystemPath({ path, initial: true });
    assert.equal(extractExpoPathFromURL([], normalized), "set-password#uid=MQ&token=test");
  }
  for (const path of ["/plans", "virtualq://tickets", "https://visitor.example.test/set-password#uid=MQ&token=test"]) {
    assert.equal(intent.redirectSystemPath({ path, initial: false }), path);
  }
});
