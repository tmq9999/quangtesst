"use strict";

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const check = process.argv.slice(2).includes("--check");
assert(process.argv.slice(2).every(arg => arg === "--check"), "Usage: node tools/build-variants.cjs [--check]");

const begin = "// BEGIN GENERATED MAPPING CONFIG";
const end = "// END GENERATED MAPPING CONFIG";
const engine = fs.readFileSync(path.join(root, "lib/mapping-config.js"), "utf8").trimEnd();
const block = begin + "\n" + engine + "\n" + end;

function withMappingConfig(content, filename) {
  const start = content.indexOf(begin);
  const finish = content.indexOf(end);
  assert(start !== -1 && finish > start, filename + " must contain the mapping config markers");
  assert(content.indexOf(begin, start + begin.length) === -1 && content.indexOf(end, finish + end.length) === -1,
    filename + " must contain one mapping config block");
  return content.slice(0, start) + block + content.slice(finish + end.length);
}

// Build both canonical blocks before deriving the retained discount script aliases.
const variants = [
  { source: "g1-acq.js", output: "g1-acq-discount.js" },
  { source: "g1-sku-report.js", output: "g1-sku-report-discount.js" }
];
const canonical = variants.map(variant => {
  const original = fs.readFileSync(path.join(root, variant.source), "utf8");
  return { filename: variant.source, original, content: withMappingConfig(original, variant.source) };
});
const aliases = variants.map((variant, index) => ({
  filename: variant.output,
  content: "/* Generated from " + variant.source + " by tools/build-variants.cjs. */\n" + canonical[index].content
})).concat([
  {
    filename: "quangg11.js",
    content: "/* Generated from g1-acq.js by tools/build-variants.cjs. */\n" + canonical[0].content
  }
]);

for (const file of canonical.concat(aliases)) {
  const destination = path.join(root, file.filename);
  if (check) {
    assert(fs.existsSync(destination), file.filename + " is missing; run node tools/build-variants.cjs");
    const actual = file.original === undefined ? fs.readFileSync(destination, "utf8") : file.original;
    assert.equal(actual, file.content, file.filename + " is stale; run node tools/build-variants.cjs");
  } else if (file.original !== file.content) {
    fs.writeFileSync(destination, file.content);
  }
  console.log((check ? "Verified " : "Generated ") + file.filename);
}
