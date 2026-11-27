"use strict";

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const check = process.argv.slice(2).includes("--check");

const begin = "// BEGIN GENERATED MAPPING CONFIG";
const end = "// END GENERATED MAPPING CONFIG";
const engine = fs.readFileSync(path.join(root, "lib/mapping-config.js"), "utf8").trimEnd();
const block = begin + "\n" + engine + "\n" + end;

function withMappingConfig(content, filename) {
  const start = content.indexOf(begin);
  const finish = content.indexOf(end);
  assert(start !== -1 && finish > start, filename + " must contain the mapping config markers");
  return content.slice(0, start) + block + content.slice(finish + end.length);
}

const targets = ["g1-acq.js", "g1-sku-report.js"];
const optionalAliases = [
  { source: "g1-acq.js", output: "g1-acq-discount.js" },
  { source: "g1-sku-report.js", output: "g1-sku-report-discount.js" },
  { source: "g1-acq.js", output: "quangg11.js" }
];

const built = {};
for (const filename of targets) {
  const fullPath = path.join(root, filename);
  const original = fs.readFileSync(fullPath, "utf8");
  const content = withMappingConfig(original, filename);
  built[filename] = content;
  if (check) {
    assert.equal(original, content, filename + " is stale; run node tools/build-variants.cjs");
  } else if (original !== content) {
    fs.writeFileSync(fullPath, content, "utf8");
  }
  console.log((check ? "Verified " : "Updated ") + filename);
}

for (const alias of optionalAliases) {
  const dest = path.join(root, alias.output);
  if (!fs.existsSync(dest)) continue;
  const content = "/* Generated from " + alias.source + " by tools/build-variants.cjs. */\n" + built[alias.source];
  if (check) {
    assert.equal(fs.readFileSync(dest, "utf8"), content, alias.output + " is stale");
  } else {
    fs.writeFileSync(dest, content, "utf8");
  }
  console.log((check ? "Verified " : "Generated ") + alias.output);
}
