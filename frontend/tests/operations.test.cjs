const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const ts = require("typescript");

const subject = {};
runInNewContext(ts.transpileModule(
  readFileSync(require.resolve("../lib/operations.ts"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText, { exports: subject });

test("staff choices name the selected record and distinguish accounts with the same name", () => {
  assert.equal(subject.recordLabel({ area_name: "Technology Land", park_name: "Demo Park" }), "Technology Land");
  assert.equal(subject.recordLabel({ product_name: "Park cap", store_name: "Gift shop" }), "Park cap");
  assert.equal(subject.recordLabel({ name: "Alex", last_name: "Visitor", username: "alex-1" }), "Alex · Visitor · @alex-1");
  assert.notEqual(
    subject.recordLabel({ name: "Alex", username: "alex-1" }),
    subject.recordLabel({ name: "Alex", username: "alex-2" }),
  );
});
