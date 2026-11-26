"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");
const { test: nodeTest } = require("node:test");

const root = path.resolve(__dirname, "..");
const ROOT = "https://one.google.com/g1-sku-report";
const ORIGIN = "https://one.google.com";
const CONFIG_KEY = "g1.sku.mappings.v1";
const SCAN_KEY = "g1.sku.scan.v1";
const TEST_KEY = "g1.pro.annual.test.v1";
const VERSION = "g1-acq-v7.11-mappings";
const REPORT_VERSION = "v7.11.0";
const DEFAULT_REVISION = "defaults-75p-v1";
const TARGET = "g1.2tb.ai.12months_ip_90p";
const SOURCE = "g1.ios.2tb.fixture_monthly";
const OTHER_SOURCE = "g1.ios.2tb.fixture_annual";
const TWENTY = "g1.ios.20tb.m.v2";
const THIRTY = "g1.ios.30tb.ai.pro.m";
const COM_SOURCE = "com.google.one.fixture_monthly";
const CUSTOM_TARGET = "com.google.one.fixture_annual";
const NEXT_TARGET = "g1.fixture.next_offer";
const FIXED_TIME = "2026-11-23T07:40:06.325Z";
const TURKEY_TARGET = "g1.ios.30tb.m";
const TR_PRO_TARGET = "com.google.gemini.2tb.ai.m.3month_ip_99p";
// Independent contract fixtures: catalog rules deliberately have no persistent IDs.
const PRESETS = [
  {
    id: "pro-1yuan", title: "1 元开 Pro（前三月约 1 元/月）",
    description: "实测成功：改写后收银台前三月约 1 元/月，入口选 Ultra 5x，实际到手 Pro。周期与金额按 App Store 面板核对。",
    rules: [{ match: "exact", from: TWENTY, to: TR_PRO_TARGET, enabled: true }]
  },
  {
    id: "tr-ultra-30tb", title: "土区 30TB · 2949.99 里拉记录",
    description: "旧 iOS 30TB 编号；公开记录曾调起 2949.99 里拉报价，实际金额与周期查看 App Store。",
    rules: [{ match: "exact", from: THIRTY, to: TURKEY_TARGET, enabled: true }]
  },
  {
    id: "ultra-75p", title: "Ultra 20TB / 30TB · 三个月 75p",
    description: "20TB 与 30TB 一起切换到现有 75p 目标；75p 表示减免 75%，实付 25%。",
    rules: [
      { match: "exact", from: TWENTY, to: "g1.20tb.3months_ip_75p.acq", enabled: true },
      { match: "exact", from: THIRTY, to: "g1.ai.ultra.3months_ip_75p.acq", enabled: true }
    ]
  },
  {
    id: "pro-12months-90p", title: "2TB / Pro · 12个月 90p",
    description: "使用现有 2TB 前缀和 12个月优惠目标；商品周期按 App Store 购买面板显示。",
    rules: [{ match: "prefix", from: "g1.ios.2tb.", to: TARGET, enabled: true }]
  }
];
const DEFAULT_RULES = [
  { id: "default-2tb", match: "prefix", from: "g1.ios.2tb.", to: TARGET, enabled: true },
  { id: "default-20tb", match: "exact", from: TWENTY, to: "g1.20tb.3months_ip_75p.acq", enabled: true },
  { id: "default-30tb", match: "exact", from: THIRTY, to: "g1.ai.ultra.3months_ip_75p.acq", enabled: true }
];
const VARIANTS = [
  { script: "g1-acq.js", report: "g1-sku-report.js" },
  { script: "g1-acq-discount.js", report: "g1-sku-report-discount.js" }
];
const sources = Object.fromEntries(VARIANTS.flatMap(variant => [variant.script, variant.report]).map(name =>
  [name, fs.readFileSync(path.join(root, name), "utf8")]));
const scripts = Object.fromEntries(Object.entries(sources).map(([name, source]) =>
  [name, new vm.Script(source, { filename: name })]));
const FORM_HEADERS = { Origin: ORIGIN, "Content-Type": "application/x-www-form-urlencoded" };

// Run the shipped scripts, including their embedded engine, against one persistent store.
// This harness only models the host request/response/store interfaces and native forms.
function run(name, options = {}) {
  const storage = options.storage || new Map();
  const done = [];
  const reads = [];
  const writes = [];
  const logs = [];
  const context = {
    $request: {
      url: options.url || ORIGIN + "/ai?fixture=1",
      method: options.method || "GET",
      body: options.requestBody,
      headers: options.headers || {}
    },
    $response: { body: options.body },
    $done: value => done.push(JSON.parse(JSON.stringify(value))),
    console: { log: value => logs.push(String(value)) }
  };
  if (options.random) {
    context.Math = Object.create(Math);
    context.Math.random = options.random;
  }
  if (options.storageAvailable !== false) {
    context.$persistentStore = {};
    if (options.readAvailable !== false) {
      context.$persistentStore.read = key => {
        reads.push(key);
        if (options.read) return options.read(key, storage, { reads, writes });
        return storage.has(key) ? storage.get(key) : null;
      };
    }
    if (options.writeAvailable !== false) {
      context.$persistentStore.write = (value, key) => {
        writes.push({ key, value });
        if (options.write) return options.write(value, key, storage, { reads, writes });
        storage.set(key, value);
        return true;
      };
    }
  }
  scripts[name].runInNewContext(context, { timeout: 2000 });
  assert.equal(done.length, 1, name + " must call $done exactly once");
  return { payload: done[0], storage, reads, writes, logs };
}

function record(storage, key) {
  return JSON.parse(storage.get(key));
}

function header(response, name) {
  const key = Object.keys(response.headers || {}).find(key => key.toLowerCase() === name.toLowerCase());
  return key === undefined ? undefined : response.headers[key];
}

function htmlPage(variant, storage, options = {}) {
  const result = run(variant.report, { storage, url: ROOT, ...options });
  assert.equal(result.payload.response.status, 200);
  assert.match(header(result.payload.response, "Content-Type"), /text\/html/i);
  return result;
}

function exported(variant, storage, options = {}) {
  const result = run(variant.report, { storage, url: ROOT + "?format=json", ...options });
  assert.equal(result.payload.response.status, 200);
  assert.match(header(result.payload.response, "Content-Type"), /application\/json/i);
  assert.equal(result.writes.length, 0, "export must only read local state");
  return { ...result, data: JSON.parse(result.payload.response.body) };
}

function decodeHTML(value) {
  return value.replace(/&(?:#(x[0-9a-f]+|[0-9]+)|amp|lt|gt|quot|apos);/gi, (entity, numeric) => {
    if (numeric) return String.fromCodePoint(numeric[0].toLowerCase() === "x" ? parseInt(numeric.slice(1), 16) : Number(numeric));
    return { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" }[entity.toLowerCase()];
  });
}

function attributes(text) {
  const result = Object.create(null);
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of text.matchAll(pattern)) result[match[1].toLowerCase()] = decodeHTML(match[2] ?? match[3] ?? match[4] ?? "");
  return result;
}

function forms(html) {
  return [...html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form\s*>/gi)].map(match => {
    const attrs = attributes(match[1]);
    const fields = Object.create(null);
    const controls = [];
    const buttons = [];
    for (const input of match[2].matchAll(/<input\b([^>]*)>/gi)) {
      const control = attributes(input[1]);
      controls.push(control);
      if (!control.name || "disabled" in control) continue;
      const type = (control.type || "text").toLowerCase();
      if (type === "submit") { buttons.push(control); continue; }
      if (["button", "reset", "file"].includes(type)) continue;
      if (["checkbox", "radio"].includes(type) && !("checked" in control)) continue;
      fields[control.name] = control.value ?? (["checkbox", "radio"].includes(type) ? "on" : "");
    }
    for (const select of match[2].matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select\s*>/gi)) {
      const control = attributes(select[1]);
      controls.push(control);
      if (!control.name || "disabled" in control) continue;
      const choices = [...select[2].matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option\s*>/gi)].map(option => {
        const attrs = attributes(option[1]);
        return { ...attrs, value: attrs.value ?? decodeHTML(option[2]) };
      });
      const selected = choices.find(choice => "selected" in choice) || choices[0];
      if (selected) fields[control.name] = selected.value;
    }
    for (const area of match[2].matchAll(/<textarea\b([^>]*)>([\s\S]*?)<\/textarea\s*>/gi)) {
      const control = attributes(area[1]);
      controls.push(control);
      if (control.name && !("disabled" in control)) fields[control.name] = decodeHTML(area[2]);
    }
    for (const button of match[2].matchAll(/<button\b([^>]*)>/gi)) {
      const control = attributes(button[1]);
      if (!("disabled" in control) && (!control.type || control.type.toLowerCase() === "submit")) buttons.push(control);
    }
    const actions = new Set(buttons.filter(button => button.name === "action").map(button => button.value));
    if (fields.action) actions.add(fields.action);
    const disabled = [...match[2].matchAll(/<fieldset\b([^>]*)>/gi)].some(fieldset => "disabled" in attributes(fieldset[1]));
    return { attrs, fields, controls, buttons, actions, disabled, html: match[0] };
  });
}

function formFor(html, action, id) {
  const matches = forms(html).filter(form => form.actions.has(action) &&
    (id === undefined || (action === "preset" ? form.fields.preset : form.fields.id || "") === id));
  assert.equal(matches.length, 1, "expected one " + action + " form for " + (id ?? "its action"));
  assert.equal(matches[0].attrs.method.toLowerCase(), "post");
  assert.equal(new URL(matches[0].attrs.action, ROOT).href, ROOT);
  return matches[0];
}

function formBody(form, action, changes = {}) {
  assert.equal(form.disabled, false, "native submission requires an enabled fieldset");
  assert(form.actions.has(action), "submit an action offered by the real HTML form");
  const fields = { ...form.fields, action, ...changes };
  for (const key of Object.keys(fields)) if (fields[key] === undefined) delete fields[key];
  return new URLSearchParams(fields).toString();
}

function post(variant, storage, body, options = {}) {
  return run(variant.report, { storage, url: ROOT, method: "POST", headers: FORM_HEADERS, requestBody: body, ...options });
}

function submit(variant, storage, form, action, changes = {}, options = {}) {
  return post(variant, storage, formBody(form, action, changes), options);
}

function assertRedirect(variant, result, notice) {
  const response = result.payload.response;
  assert.equal(response.status, 303);
  assert.equal(header(response, "Location"), ROOT + "?notice=" + notice);
  assert.deepEqual(result.writes.map(write => write.key), [CONFIG_KEY]);
  const before = [...result.storage];
  // A native 303 follow-up is a GET without the previous POST body.
  const follow = htmlPage(variant, result.storage, { url: header(response, "Location"), method: "GET" });
  assert.deepEqual(follow.writes, []);
  assert.deepEqual([...result.storage], before);
  return follow.payload.response.body;
}

function change(variant, storage, action, id, changes = {}) {
  const page = htmlPage(variant, storage);
  assert.deepEqual(page.writes, []);
  const form = formFor(page.payload.response.body, action, id);
  const result = submit(variant, storage, form, action, changes);
  const html = assertRedirect(variant, result, { upsert: "saved", delete: "deleted", reset: "reset", preset: "preset" }[action]);
  return { result, html, config: exported(variant, storage).data.mappingConfig };
}

function storedConfig(rules, overrides = {}) {
  return { schemaVersion: 1, revision: "a".repeat(48), updatedAt: FIXED_TIME, customized: true, rules, ...overrides };
}

function withConfig(rules, overrides = {}) {
  return new Map([[CONFIG_KEY, JSON.stringify(storedConfig(rules, overrides))]]);
}

function exactRule(overrides = {}) {
  return { id: "fixture-rule", match: "exact", from: COM_SOURCE, to: CUSTOM_TARGET, enabled: true, ...overrides };
}

function assertISO(value) {
  assert.match(value, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.equal(new Date(value).toISOString(), value);
}

function assertStored(storage, expectedRules, customized = true) {
  const value = record(storage, CONFIG_KEY);
  assert.deepEqual(Object.keys(value).sort(), ["schemaVersion", "revision", "updatedAt", "customized", "rules"].sort());
  assert.equal(value.schemaVersion, 1);
  assert.equal(value.customized, customized);
  assert.match(value.revision, /^[a-f0-9]{48}$/);
  assertISO(value.updatedAt);
  assert.deepEqual(value.rules, expectedRules);
  for (const rule of value.rules) assert.deepEqual(Object.keys(rule).sort(), ["id", "match", "from", "to", "enabled"].sort());
  return value;
}

function assertRejected(result, status, before) {
  assert.equal(result.payload.response.status, status);
  assert.equal(header(result.payload.response, "Location"), undefined);
  assert.deepEqual(result.writes, []);
  if (before) assert.deepEqual([...result.storage], before);
}

function assertNoScript(response) {
  assert(!/<(?:script|iframe|img|object|embed)\b/i.test(response.body));
  for (const tag of response.body.matchAll(/<[a-z][a-z0-9-]*\b([^>]*)>/gi)) {
    const attrs = attributes(tag[1]);
    assert(!Object.keys(attrs).some(name => /^on[a-z]+$/i.test(name)), "HTML must have no inline event handlers");
    for (const name of ["src", "href", "action"]) if (attrs[name]) assert(!/^javascript:/i.test(attrs[name]));
  }
  const csp = header(response, "Content-Security-Policy");
  const directives = new Map(csp.split(";").map(value => value.trim().split(/\s+/)).filter(parts => parts[0]).map(([name, ...values]) => [name, values]));
  assert.deepEqual(directives.get("default-src"), ["'none'"]);
  assert.deepEqual(directives.get("style-src"), ["'unsafe-inline'"]);
  assert.deepEqual(directives.get("base-uri"), ["'none'"]);
  assert.deepEqual(directives.get("frame-ancestors"), ["'none'"]);
  assert.deepEqual(directives.get("form-action"), [ROOT]);
}

function presetSection(html) {
  const section = [...html.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section\s*>/gi)]
    .find(match => attributes(match[1]).id === "mapping-presets");
  assert(section, "the report must render a mapping-presets section");
  return section[2];
}

function presetCardText(html, id) {
  const text = decodeHTML(presetSection(html).replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ");
  const preset = PRESETS.find(entry => entry.id === id);
  const start = text.indexOf(preset.title);
  assert(start >= 0, "missing preset title " + id);
  const next = PRESETS.map(entry => text.indexOf(entry.title, start + preset.title.length)).filter(index => index >= 0);
  return text.slice(start, next.length ? Math.min(...next) : text.length);
}

function withoutIds(rules) {
  return rules.map(({ match, from, to, enabled }) => ({ match, from, to, enabled }));
}

function assertPresetRules(config, preset) {
  for (const rule of preset.rules) {
    const matches = config.rules.filter(saved => saved.match === rule.match && saved.from === rule.from);
    assert.equal(matches.length, 1, preset.id + " must merge each source only once");
    assert.deepEqual(withoutIds(matches), [rule]);
    assert.match(matches[0].id, /^[a-z][a-z0-9-]{0,39}$/);
  }
}

function engineHarness(options = {}) {
  const storage = options.storage || new Map();
  const reads = [];
  const writes = [];
  const store = {};
  if (options.readAvailable !== false) store.read = key => {
    reads.push(key);
    return options.read ? options.read(key, storage, { reads, writes }) : storage.get(key) || null;
  };
  if (options.writeAvailable !== false) store.write = (value, key) => {
    writes.push({ key, value });
    if (options.write) return options.write(value, key, storage, { reads, writes });
    storage.set(key, value);
    return true;
  };
  const context = vm.createContext({ store: options.storageAvailable === false ? null : store });
  if (options.random) {
    context.Math = Object.create(Math);
    context.Math.random = options.random;
  }
  const source = fs.readFileSync(path.join(root, "lib/mapping-config.js"), "utf8");
  new vm.Script(source + "\nvar engine = createG1MappingConfig(store);", { filename: "lib/mapping-config.js" })
    .runInContext(context, { timeout: 2000 });
  return {
    storage, reads, writes,
    invoke(method, ...args) {
      context.method = method;
      context.args = args;
      return vm.runInContext("engine[method].apply(engine, args)", context, { timeout: 2000 });
    }
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

for (const variant of VARIANTS) {
  const test = (name, fn) => nodeTest(variant.script + " mapping editor: " + name, fn);

  test("fresh and empty settings expose native default forms and read-only JSON", () => {
    for (const storage of [new Map(), new Map([[CONFIG_KEY, ""]])]) {
      const before = [...storage];
      const page = htmlPage(variant, storage);
      assert.deepEqual(page.writes, []);
      assert.match(page.payload.response.body, /Google One SKU 管理/);
      assert.equal(header(page.payload.response, "X-G1-Report-Version"), REPORT_VERSION);
      assert.equal(header(page.payload.response, "Cache-Control"), "no-store");
      assertNoScript(page.payload.response);
      const { data, reads } = exported(variant, storage);
      assert.deepEqual(new Set(reads), new Set([CONFIG_KEY, SCAN_KEY, TEST_KEY]));
      assert.equal(data.reportVersion, REPORT_VERSION);
      assert.equal(data.configuredMode, "discount75");
      assert.equal(data.configuredTarget, TARGET);
      assert.deepEqual(data.mappingConfig, {
        status: "default", revision: DEFAULT_REVISION, updatedAt: "", mode: "discount75", customized: false,
        rules: DEFAULT_RULES, target: TARGET, targetOrigin: "user-specified", error: "", limit: 30
      });
      for (const rule of DEFAULT_RULES) {
        const form = formFor(page.payload.response.body, "upsert", rule.id);
        assert.equal(form.fields.revision, DEFAULT_REVISION);
        assert.equal(form.fields.match, rule.match);
        assert.equal(form.fields.from, rule.from);
        assert.equal(form.fields.to, rule.to);
        assert.equal(form.fields.enabled, "1");
        assert(form.controls.some(control => control.name === "enabled" && control.type === "checkbox" && control.value === "1"));
        for (const field of ["from", "to"]) {
          const control = form.controls.find(control => control.name === field);
          assert(control && Number(control.maxlength) > 0);
          assert(control.pattern, field + " must expose a native pattern hint");
        }
        const remove = formFor(page.payload.response.body, "delete", rule.id);
        const button = remove.buttons.find(button => button.name === "action" && button.value === "delete") || remove.buttons[0];
        assert(button && "formnovalidate" in button);
      }
      const add = formFor(page.payload.response.body, "upsert", "");
      assert.equal(add.fields.revision, DEFAULT_REVISION);
      assert.equal(add.fields.from, "");
      assert.equal(add.fields.to, "");
      assert.equal(formFor(page.payload.response.body, "reset").fields.revision, DEFAULT_REVISION);
      for (const form of forms(page.payload.response.body).filter(form => form.attrs.method.toLowerCase() === "post")) {
        const permitted = new Set(form.actions.has("preset") ? ["action", "revision", "preset"] :
          ["action", "revision", "id", "match", "from", "to", "enabled"]);
        for (const name of Object.keys(form.fields)) assert(permitted.has(name), "unexpected field " + name);
      }
      assert.deepEqual([...storage], before);
    }
  });

  test("scanned IDs populate the datalist and real source-prefill links without saving settings", () => {
    const storage = new Map();
    run(variant.script, { storage, url: ORIGIN + "/plans", body: JSON.stringify([SOURCE, COM_SOURCE, TWENTY]) });
    const before = [...storage];
    const page = htmlPage(variant, storage);
    const html = page.payload.response.body;
    const lists = [...html.matchAll(/<datalist\b([^>]*)>([\s\S]*?)<\/datalist\s*>/gi)];
    assert(lists.length > 0);
    const values = new Set(lists.flatMap(list => [...list[2].matchAll(/<option\b([^>]*)>/gi)].map(option => attributes(option[1]).value)));
    const ids = new Set(lists.map(list => attributes(list[1]).id));
    assert(formFor(html, "upsert", "").controls.some(control => control.name === "from" && ids.has(control.list)));
    const links = [...html.matchAll(/<a\b([^>]*)>/gi)].map(link => attributes(link[1]).href).filter(Boolean).map(href => new URL(href, ROOT));
    for (const id of [SOURCE, COM_SOURCE, TWENTY]) {
      assert(values.has(id));
      const link = links.find(url => url.origin + url.pathname === ROOT && [...url.searchParams.values()].includes(id));
      assert(link, "each collected SKU needs a source-prefill link");
      const prefilled = htmlPage(variant, storage, { url: link.href });
      assert.equal(formFor(prefilled.payload.response.body, "upsert", "").fields.from, id);
      assert.deepEqual(prefilled.writes, []);
    }
    assert.deepEqual([...storage], before);
    assert.equal(storage.has(CONFIG_KEY), false);
  });

  test("native add, edit, disable, delete and reset flow persists only configuration then changes the next response", () => {
    const storage = new Map();
    run(variant.script, { storage, body: SOURCE });
    const oldScan = storage.get(SCAN_KEY);
    const oldTest = storage.get(TEST_KEY);
    const added = change(variant, storage, "upsert", "", {
      match: "exact", from: "  " + COM_SOURCE + "  ", to: "  " + CUSTOM_TARGET + "  ", enabled: "1"
    });
    assert.equal(added.config.status, "custom");
    assert.equal(added.config.mode, "custom");
    assert.equal(added.config.customized, true);
    assert.equal(added.config.target, TARGET);
    assert.equal(added.config.targetOrigin, "user-configured");
    const addedRule = added.config.rules.find(rule => !DEFAULT_RULES.some(prior => prior.id === rule.id));
    assert(addedRule);
    assert.match(addedRule.id, /^rule-[a-f0-9]{16}$/);
    assert.deepEqual(addedRule, { id: addedRule.id, match: "exact", from: COM_SOURCE, to: CUSTOM_TARGET, enabled: true });
    const firstStored = assertStored(storage, [...DEFAULT_RULES, addedRule]);
    assert.equal(added.config.revision, firstStored.revision);
    assert.equal(added.config.updatedAt, firstStored.updatedAt);
    assert.equal(storage.get(SCAN_KEY), oldScan);
    assert.equal(storage.get(TEST_KEY), oldTest);
    let data = exported(variant, storage).data;
    assert.equal(data.configuredMode, "custom");
    assert.equal(data.scan.mode, "discount75");
    assert.equal(data.test.mode, "discount75");
    assert.equal(data.test.mappingRevision, DEFAULT_REVISION);

    const rewritten = run(variant.script, { storage, body: JSON.stringify([SOURCE, COM_SOURCE, COM_SOURCE]) });
    assert.deepEqual(JSON.parse(rewritten.payload.body), [TARGET, CUSTOM_TARGET, CUSTOM_TARGET]);
    assert.equal(rewritten.reads.filter(key => key === CONFIG_KEY).length, 1);
    assert.deepEqual(rewritten.writes.map(write => write.key), [SCAN_KEY, TEST_KEY]);
    const current = record(storage, TEST_KEY);
    assert.equal(current.version, VERSION);
    assert.equal(current.mode, "custom");
    assert.equal(current.mappingStatus, "custom");
    assert.equal(current.mappingRevision, firstStored.revision);
    assert.equal(current.mappingUpdatedAt, firstStored.updatedAt);
    assert.equal(current.target, TARGET);
    assert.equal(current.targetOrigin, "user-configured");
    assert.equal(current.hitCount, 3);
    assert.equal(current.annualHitCount, 1);
    assert(current.matchedFrom.every(row => row.fallback === false));
    assert.equal(current.matchedFrom.find(row => row.id === COM_SOURCE).to, CUSTOM_TARGET);
    assert.equal(record(storage, SCAN_KEY).mode, "custom");
    assert(!record(storage, SCAN_KEY).skus.some(row => row.id === CUSTOM_TARGET));
    assert(rewritten.logs.some(line => line.includes("mappingStatus=custom") && line.includes(firstStored.revision)));
    data = exported(variant, storage).data;
    assert.equal(data.test.mappingRevision, current.mappingRevision);
    assert.equal(data.test.mappingUpdatedAt, current.mappingUpdatedAt);
    assert.equal(data.test.mappingStatus, "custom");
    assert.equal(data.test.matchedFrom.find(row => row.id === COM_SOURCE).to, CUSTOM_TARGET);
    assert.equal(data.test.targetOrigin, "user-configured");
    const currentHTML = htmlPage(variant, storage).payload.response.body;
    assert(currentHTML.includes("手动映射"));
    assert(currentHTML.includes(CUSTOM_TARGET));

    const history = [storage.get(SCAN_KEY), storage.get(TEST_KEY)];
    const edited = change(variant, storage, "upsert", addedRule.id, { to: NEXT_TARGET });
    assert.equal(edited.config.rules.length, 4);
    assert.equal(edited.config.rules.find(rule => rule.id === addedRule.id).to, NEXT_TARGET);
    assert.notEqual(edited.config.revision, firstStored.revision);
    assert.deepEqual([storage.get(SCAN_KEY), storage.get(TEST_KEY)], history);
    assert.equal(run(variant.script, { storage, body: COM_SOURCE }).payload.body, NEXT_TARGET);

    const disabled = change(variant, storage, "upsert", addedRule.id, { enabled: undefined });
    assert.equal(disabled.config.rules.find(rule => rule.id === addedRule.id).enabled, false);
    assert.notEqual(disabled.config.revision, edited.config.revision);
    const unchanged = run(variant.script, { storage, body: COM_SOURCE });
    assert.deepEqual(unchanged.payload, {});
    assert.equal(record(storage, TEST_KEY).status, "no-match");
    assert.equal(record(storage, TEST_KEY).mode, "custom");

    const deleted = change(variant, storage, "delete", addedRule.id, { match: "bad", from: "<invalid>", to: "<invalid>", enabled: "invalid" });
    assert.deepEqual(deleted.config.rules, DEFAULT_RULES);
    assert.equal(deleted.config.mode, "custom");
    assert.equal(deleted.config.customized, true);
    assertStored(storage, DEFAULT_RULES);
    const reset = change(variant, storage, "reset");
    const restored = assertStored(storage, [], false);
    assert.equal(reset.config.status, "default");
    assert.equal(reset.config.mode, "discount75");
    assert.equal(reset.config.revision, restored.revision);
    assert.notEqual(reset.config.revision, DEFAULT_REVISION);
    assert.deepEqual(reset.config.rules, DEFAULT_RULES);
    assert.equal(reset.config.targetOrigin, "user-specified");
    assert.equal(run(variant.script, { storage, body: SOURCE }).payload.body, TARGET);
  });

  test("turning every rule off keeps custom mode and makes responses pass through", () => {
    const storage = new Map();
    for (const rule of DEFAULT_RULES) change(variant, storage, "upsert", rule.id, { enabled: undefined });
    const config = exported(variant, storage).data.mappingConfig;
    assert.equal(config.status, "custom");
    assert.equal(config.target, "");
    assert.equal(config.targetOrigin, "");
    assert(config.rules.every(rule => rule.enabled === false));
    assertStored(storage, DEFAULT_RULES.map(rule => ({ ...rule, enabled: false })));
    const result = run(variant.script, { storage, body: JSON.stringify([SOURCE, TWENTY, THIRTY]) });
    assert.deepEqual(result.payload, {});
    assert.equal(record(storage, TEST_KEY).mode, "custom");
    assert.equal(record(storage, TEST_KEY).status, "no-match");
    assert.equal(record(storage, TEST_KEY).hitCount, 0);
    assert.equal(record(storage, TEST_KEY).target, "");
  });

  test("deleting all defaults persists an explicit empty list until reset", () => {
    const storage = new Map();
    for (const rule of DEFAULT_RULES) change(variant, storage, "delete", rule.id);
    const empty = assertStored(storage, []);
    const config = exported(variant, storage).data.mappingConfig;
    assert.equal(config.mode, "custom");
    assert.equal(config.customized, true);
    assert.deepEqual(config.rules, []);
    assert.equal(config.target, "");
    assert.equal(config.targetOrigin, "");
    const result = run(variant.script, { storage, body: SOURCE + " " + TWENTY + " " + THIRTY });
    assert.deepEqual(result.payload, {});
    assert.equal(record(storage, TEST_KEY).mappingRevision, empty.revision);
    assert.equal(record(storage, TEST_KEY).status, "no-match");
    change(variant, storage, "reset");
    assertStored(storage, [], false);
    const restored = run(variant.script, { storage, body: JSON.stringify([SOURCE, TWENTY, THIRTY]) });
    assert.deepEqual(JSON.parse(restored.payload.body), DEFAULT_RULES.map(rule => rule.to));
  });

  test("exact rules beat prefixes, longest active prefix wins and replacements stay single-pass", () => {
    const rules = [
      { id: "broad", match: "prefix", from: "g1.ios.", to: "g1.fixture.broad", enabled: true },
      { id: "two-tb", match: "prefix", from: "g1.ios.2tb.", to: CUSTOM_TARGET, enabled: true },
      exactRule({ id: "exact", from: SOURCE, to: "g1.fixture.exact" }),
      exactRule({ id: "disabled-exact", from: OTHER_SOURCE, to: "g1.fixture.disabled", enabled: false }),
      { id: "disabled-prefix", match: "prefix", from: "g1.ios.2tb.deep.", to: "g1.fixture.disabled", enabled: false },
      { id: "com-prefix", match: "prefix", from: "com.google.one.family.", to: "g1.fixture.com", enabled: true },
      exactRule({ id: "next-pass", from: "g1.fixture.exact", to: "g1.fixture.chained" })
    ];
    const values = [SOURCE, OTHER_SOURCE, "g1.ios.2tb.deep.member", TWENTY, "com.google.one.family.member", "g1.fixture.exact", "com.google.one.family."];
    for (const order of [rules, [...rules].reverse()]) {
      const storage = withConfig(order);
      const result = run(variant.script, { storage, body: JSON.stringify(values) });
      assert.deepEqual(JSON.parse(result.payload.body), ["g1.fixture.exact", CUSTOM_TARGET, CUSTOM_TARGET, "g1.fixture.broad", "g1.fixture.com", "g1.fixture.chained", "com.google.one.family."]);
      const saved = record(storage, TEST_KEY);
      assert.equal(saved.hitCount, 6);
      assert.equal(saved.annualHitCount, 3);
      assert.equal(saved.target, CUSTOM_TARGET);
      assert.equal(saved.targetOrigin, "user-configured");
      assert.equal(saved.mappingRevision, "a".repeat(48));
      assert.equal(saved.matchedFrom.find(row => row.id === SOURCE).to, "g1.fixture.exact");
      assert.equal(saved.matchedFrom.find(row => row.id === OTHER_SOURCE).to, CUSTOM_TARGET);
      assert(saved.matchedFrom.every(row => row.fallback === false));
      assert(!result.logs.some(line => line.includes("fallback=")));
      assert.deepEqual(record(storage, SCAN_KEY).skus.map(row => row.id), [...values].sort());
      const data = exported(variant, storage).data;
      assert.equal(data.configuredTarget, CUSTOM_TARGET);
      assert.equal(data.test.matchedFrom.find(row => row.id === SOURCE).to, "g1.fixture.exact");
    }
  });

  test("custom rules honor complete tokens, both namespaces and the ai query URL boundary", () => {
    const rules = [exactRule({ from: SOURCE, to: CUSTOM_TARGET }), exactRule({ id: "com-exact", from: COM_SOURCE, to: NEXT_TARGET })];
    const untouched = [SOURCE + ".extra", COM_SOURCE + "_extra", COM_SOURCE + "-extra", SOURCE + ".", COM_SOURCE + "."];
    for (const id of [SOURCE, COM_SOURCE]) for (const before of ["x.", "prefix", "person@", "%", "-", "_"]) untouched.push(before + id);
    const storage = withConfig(rules);
    const result = run(variant.script, { storage, body: JSON.stringify([SOURCE, COM_SOURCE, ...untouched]) });
    assert.deepEqual(JSON.parse(result.payload.body), [CUSTOM_TARGET, NEXT_TARGET, ...untouched]);
    assert.equal(record(storage, TEST_KEY).annualHitCount, 1);
    assert.equal(record(storage, TEST_KEY).target, "", "a 2TB exact override is not the prefix target");
    const historical = storage.get(TEST_KEY);
    for (const url of [ORIGIN + "/ai", ORIGIN + "/ai/other?x=1", ORIGIN + "/plans?x=1", ORIGIN + ".evil/ai?x=1", "http://one.google.com/ai?x=1", ROOT, ROOT + "?format=json"]) {
      const next = run(variant.script, { storage, url, body: SOURCE + " " + COM_SOURCE });
      assert.deepEqual(next.payload, {});
      assert.equal(storage.get(TEST_KEY), historical);
      assert(!next.writes.some(write => write.key === CONFIG_KEY));
    }
    const prefixOnly = withConfig([{ id: "only-prefix", match: "prefix", from: "g1.fixture.only.", to: TARGET, enabled: true }]);
    assert.deepEqual(run(variant.script, { storage: prefixOnly, body: "g1.fixture.only." }).payload, {});
    assert.equal(run(variant.script, { storage: prefixOnly, body: "g1.fixture.only.member" }).payload.body, TARGET);
  });

  test("2TB exact overrides retain an empty uniform target in current records, HTML and JSON", () => {
    for (const rules of [
      [exactRule({ from: SOURCE })],
      [exactRule({ from: SOURCE }), { ...DEFAULT_RULES[0], enabled: false }]
    ]) {
      const storage = withConfig(rules);
      const result = run(variant.script, { storage, body: SOURCE });
      assert.equal(result.payload.body, CUSTOM_TARGET);
      const saved = record(storage, TEST_KEY);
      assert.equal(saved.mappingRevision, "a".repeat(48));
      assert.equal(saved.target, "");
      assert.equal(saved.targetOrigin, "");
      assert.equal(saved.annualHitCount, 1);
      assert.equal(saved.matchedFrom[0].to, CUSTOM_TARGET);
      const data = exported(variant, storage).data;
      assert.equal(data.configuredTarget, "");
      assert.equal(data.mappingConfig.target, "");
      assert.equal(data.test.target, "");
      assert.equal(data.test.targetOrigin, "");
      assert.equal(data.test.mappingRevision, saved.mappingRevision);
      assert.equal(data.test.matchedFrom[0].to, CUSTOM_TARGET);
      const html = htmlPage(variant, storage).payload.response.body;
      assert(html.includes(CUSTOM_TARGET + "</code></td>"));
      assert(!html.includes("该次记录的 2TB 目标：<code>" + CUSTOM_TARGET + "</code>"));
      assert.equal(storage.get(TEST_KEY), JSON.stringify(saved));
    }
  });

  test("one effective config read governs collection, rewriting and revision metadata", () => {
    const initial = storedConfig([exactRule({ from: SOURCE })]);
    const later = storedConfig([exactRule({ from: SOURCE, to: NEXT_TARGET })], { revision: "b".repeat(48) });
    const storage = new Map([[CONFIG_KEY, JSON.stringify(initial)]]);
    let configReads = 0;
    const result = run(variant.script, {
      storage, body: SOURCE,
      read(key, current) {
        if (key === CONFIG_KEY) return JSON.stringify(++configReads === 1 ? initial : later);
        return current.get(key) || null;
      }
    });
    assert.equal(configReads, 1);
    assert.equal(result.payload.body, CUSTOM_TARGET);
    assert.equal(record(storage, SCAN_KEY).mode, "custom");
    assert.equal(record(storage, TEST_KEY).mappingRevision, initial.revision);
    assert.equal(record(storage, TEST_KEY).mappingUpdatedAt, initial.updatedAt);
    assert.equal(storage.get(CONFIG_KEY), JSON.stringify(initial));
  });

  test("thirty rules are accepted, a thirty-first is rejected and existing rules remain editable", () => {
    const rules = Array.from({ length: 29 }, (_, index) => exactRule({ id: "fixture-" + index, from: "g1.fixture.source_" + index }));
    const storage = withConfig(rules);
    const thirtieth = change(variant, storage, "upsert", "", { match: "exact", from: "g1.fixture.source_29", to: NEXT_TARGET, enabled: "1" });
    assert.equal(thirtieth.config.rules.length, 30);
    const before = [...storage];
    const form = formFor(thirtieth.html, "upsert", "");
    assert.equal(form.disabled, true);
    // Bypass the disabled native control to exercise authoritative server validation.
    const rejected = post(variant, storage, new URLSearchParams({
      action: "upsert", revision: thirtieth.config.revision, id: "", match: "exact",
      from: "g1.fixture.source_30", to: TARGET, enabled: "1"
    }).toString());
    assertRejected(rejected, 400, before);
    assert.equal(formFor(rejected.payload.response.body, "upsert", "").fields.from, "g1.fixture.source_30");
    const edited = change(variant, storage, "upsert", "fixture-0", { to: NEXT_TARGET });
    assert.equal(edited.config.rules.length, 30);
    assert.equal(edited.config.rules[0].id, "fixture-0");
    assert.equal(edited.config.rules[0].to, NEXT_TARGET);
    assert.equal(run(variant.script, { storage, body: "g1.fixture.source_0" }).payload.body, NEXT_TARGET);
  });

  test("duplicate match-source pairs are rejected even when the existing rule is disabled", () => {
    for (const enabled of [true, false]) {
      const storage = withConfig([exactRule({ enabled })]);
      const before = [...storage];
      const form = formFor(htmlPage(variant, storage).payload.response.body, "upsert", "");
      const result = submit(variant, storage, form, "upsert", { match: "exact", from: COM_SOURCE, to: NEXT_TARGET, enabled: "1" });
      assertRejected(result, 400, before);
      const retained = formFor(result.payload.response.body, "upsert", "");
      assert.equal(retained.fields.from, COM_SOURCE);
      assert.equal(retained.fields.to, NEXT_TARGET);
    }
  });

  test("form validation enforces recognized SKU shapes, match types, IDs and checkbox values", () => {
    const base = { match: "exact", from: COM_SOURCE, to: CUSTOM_TARGET, enabled: "1" };
    const invalid = [
      { from: "" }, { to: "" }, { from: "g1." }, { from: "com.google.one." }, { to: "g1." },
      { from: "g1.fixture." }, { to: "com.google.one.fixture." }, { from: "G1.fixture" }, { to: "other.fixture" },
      { from: "g1.fixture space" }, { to: "g1.fixture/part" }, { from: "g1.fixture?query=1" }, { to: "g1.fixture#part" },
      { from: "g1.fixture\u0000tail" }, { to: "g1.商品" }, { to: COM_SOURCE },
      { from: "g1." + "a".repeat(161) }, { to: "com.google.one." + "b".repeat(161) },
      { match: "prefix", from: "g1.fixture" }, { match: "prefix", from: "g1." },
      { match: "prefix", from: "com.google.one." }, { match: "prefix", from: "g1." + "a".repeat(160) + "." },
      { match: "Prefix" }, { match: "regex" }, { match: "" },
      { id: "_bad" }, { id: "Uppercase" }, { id: "a".repeat(41) }, { id: "__proto__" },
      { id: "supplied-new-id" }, { enabled: "0" }, { enabled: "true" }, { enabled: "2" }
    ];
    for (const fields of invalid) {
      const storage = new Map();
      const form = formFor(htmlPage(variant, storage).payload.response.body, "upsert", "");
      const result = submit(variant, storage, form, "upsert", { ...base, ...fields });
      assertRejected(result, 400, []);
    }
    for (const id of ["", "_bad", "a".repeat(41), "constructor", "../default-2tb"]) {
      const storage = new Map();
      const form = formFor(htmlPage(variant, storage).payload.response.body, "delete", "default-2tb");
      assertRejected(submit(variant, storage, form, "delete", { id }), 400, []);
    }
  });

  test("the 160-character suffix boundary works in both namespaces for exact and prefix sources", () => {
    for (const namespace of ["g1.", "com.google.one."]) {
      for (const match of ["exact", "prefix"]) {
        const from = namespace + "a".repeat(match === "prefix" ? 159 : 160) + (match === "prefix" ? "." : "");
        const to = (namespace === "g1." ? "com.google.one." : "g1.") + "b".repeat(160);
        const storage = new Map();
        const added = change(variant, storage, "upsert", "", { match, from, to, enabled: "1" });
        assert(added.config.rules.some(rule => rule.match === match && rule.from === from && rule.to === to));
        if (match === "exact") assert.equal(run(variant.script, { storage, body: from }).payload.body, to);
      }
    }
  });

  test("two open forms reject a stale save and show the latest revision and values", () => {
    const storage = new Map();
    const first = formFor(htmlPage(variant, storage).payload.response.body, "upsert", "");
    const second = formFor(htmlPage(variant, storage).payload.response.body, "upsert", "default-2tb");
    assert.equal(first.fields.revision, second.fields.revision);
    assertRedirect(variant, submit(variant, storage, first, "upsert", { match: "exact", from: COM_SOURCE, to: CUSTOM_TARGET, enabled: "1" }), "saved");
    const before = [...storage];
    const stale = submit(variant, storage, second, "upsert", { to: NEXT_TARGET });
    assertRejected(stale, 409, before);
    const latest = formFor(stale.payload.response.body, "upsert", "default-2tb");
    assert.equal(latest.fields.to, TARGET);
    assert.equal(latest.fields.revision, record(storage, CONFIG_KEY).revision);
    assert.notEqual(latest.fields.revision, second.fields.revision);
    assert.equal(exported(variant, storage).data.mappingConfig.rules.find(rule => rule.id === "default-2tb").to, TARGET);
    const fresh = formFor(htmlPage(variant, storage).payload.response.body, "upsert", "default-2tb");
    for (const revision of [undefined, "", DEFAULT_REVISION, "not-a-revision"]) {
      assertRejected(submit(variant, storage, fresh, "upsert", { revision, to: NEXT_TARGET }), 409, before);
    }
  });

  test("stale delete and reset forms cannot overwrite an intervening save", () => {
    const storage = new Map();
    const html = htmlPage(variant, storage).payload.response.body;
    const remove = formFor(html, "delete", "default-20tb");
    const reset = formFor(html, "reset");
    change(variant, storage, "upsert", "default-2tb", { to: CUSTOM_TARGET });
    const before = [...storage];
    assertRejected(submit(variant, storage, remove, "delete"), 409, before);
    assertRejected(submit(variant, storage, reset, "reset"), 409, before);
    assert.equal(exported(variant, storage).data.mappingConfig.target, CUSTOM_TARGET);
  });

  test("save re-reads configuration and detects a change after the controller's initial read", () => {
    const storage = withConfig([exactRule()]);
    const form = formFor(htmlPage(variant, storage).payload.response.body, "upsert", "fixture-rule");
    const concurrent = storedConfig([exactRule({ to: NEXT_TARGET })], { revision: "b".repeat(48) });
    let configReads = 0;
    const result = submit(variant, storage, form, "upsert", { to: TARGET }, {
      read(key, current) {
        if (key === CONFIG_KEY && ++configReads === 2) current.set(CONFIG_KEY, JSON.stringify(concurrent));
        return current.get(key) || null;
      }
    });
    assertRejected(result, 409, [[CONFIG_KEY, JSON.stringify(concurrent)]]);
    assert(configReads >= 2);
    const latest = formFor(result.payload.response.body, "upsert", "fixture-rule");
    assert.equal(latest.fields.revision, concurrent.revision);
    assert.equal(latest.fields.to, NEXT_TARGET);
  });

  test("POST accepts only the exact Origin and same-origin fetch context with case-insensitive header names", () => {
    const invalidOrigins = [undefined, "", "null", "https://example.test", "https://one.google.com.evil", "http://one.google.com", ORIGIN + "/", ORIGIN + ":443", ORIGIN + " " ];
    for (const origin of invalidOrigins) {
      const storage = new Map();
      const form = formFor(htmlPage(variant, storage).payload.response.body, "reset");
      const headers = { "Content-Type": FORM_HEADERS["Content-Type"] };
      if (origin !== undefined) headers.Origin = origin;
      assertRejected(submit(variant, storage, form, "reset", {}, { headers }), 403, []);
    }
    for (const site of ["cross-site", "same-site", "none", "", "null"]) {
      const storage = new Map();
      const form = formFor(htmlPage(variant, storage).payload.response.body, "reset");
      assertRejected(submit(variant, storage, form, "reset", {}, { headers: { ...FORM_HEADERS, "Sec-Fetch-Site": site } }), 403, []);
    }
    for (const headers of [
      { origin: ORIGIN, "content-type": "application/x-www-form-urlencoded" },
      { oRiGiN: ORIGIN, "CoNtEnT-TyPe": "application/x-www-form-urlencoded; charset=UTF-8", "sEc-FeTcH-sItE": "same-origin" }
    ]) {
      const storage = new Map();
      const form = formFor(htmlPage(variant, storage).payload.response.body, "reset");
      assertRedirect(variant, submit(variant, storage, form, "reset", {}, { headers }), "reset");
    }
  });

  test("controller reads only the three permitted headers and never touches cookies or authorization", () => {
    const storage = new Map();
    const headers = { ...FORM_HEADERS, "Sec-Fetch-Site": "same-origin" };
    const touched = [];
    for (const key of ["Cookie", "Authorization", "X-Private-Fixture"]) Object.defineProperty(headers, key, {
      enumerable: true,
      get() { touched.push(key); throw new Error("private-header-fixture"); }
    });
    const form = formFor(htmlPage(variant, storage).payload.response.body, "reset");
    const result = submit(variant, storage, form, "reset", {}, { headers });
    assertRedirect(variant, result, "reset");
    assert.deepEqual(touched, []);
    assert(!JSON.stringify([...storage]).includes("private-header-fixture"));
    assert(!result.logs.some(line => line.includes("private-header-fixture")));
  });

  test("content type, body limits and strict form decoding reject requests before persistence", () => {
    const body = new URLSearchParams({ action: "reset", revision: DEFAULT_REVISION }).toString();
    for (const contentType of [undefined, "", "application/json", "text/plain", "multipart/form-data; boundary=fixture", "application/x-www-form-urlencodedx"]) {
      const headers = { Origin: ORIGIN };
      if (contentType !== undefined) headers["Content-Type"] = contentType;
      assertRejected(post(variant, new Map(), body, { headers }), 415, []);
    }
    for (const invalidBody of [undefined, null, 42, {}, "", "action=reset&revision=%", "action=reset&revision=%GG", "action=reset&revision=%E0%A4%A", "action=reset&revision=%C0%AF", "action=reset&revision=%ED%A0%80", "act%GGion=reset&revision=" + DEFAULT_REVISION]) {
      assertRejected(post(variant, new Map(), invalidBody), 400, []);
    }
    assertRejected(post(variant, new Map(), body + "&from=" + "a".repeat(20 * 1024)), 413, []);
    assertRejected(post(variant, new Map(), body + "&from=" + "中".repeat(7000)), 413, []);
    assertRejected(post(variant, new Map(), body + "&from=\ud800"), 400, []);
  });

  test("duplicate, unknown and invalid action parameters cannot change settings or clear history", () => {
    const base = new URLSearchParams({ action: "upsert", revision: DEFAULT_REVISION, id: "", match: "exact", from: COM_SOURCE, to: CUSTOM_TARGET, enabled: "1" }).toString();
    for (const suffix of ["&action=reset", "&revision=" + DEFAULT_REVISION, "&id=default-2tb", "&from=" + SOURCE, "&fr%6Fm=" + SOURCE, "&enabled=1", "&unknown=1", "&__proto__=fixture", "&constructor=fixture", "&token=fixture"]) {
      assertRejected(post(variant, new Map(), base + suffix), 400, []);
    }
    for (const action of [undefined, "", "clear", "constructor", "UPSERT", "remove"]) {
      const fields = { revision: DEFAULT_REVISION };
      if (action !== undefined) fields.action = action;
      assertRejected(post(variant, new Map(), new URLSearchParams(fields).toString()), 400, []);
    }
    const storage = new Map([[SCAN_KEY, "fixture-scan"], [TEST_KEY, "fixture-test"]]);
    const before = [...storage];
    assertRejected(post(variant, storage, "action=clear&revision=" + DEFAULT_REVISION, { url: ROOT + "?clear=1" }), 400, before);
  });

  test("GET action parameters, JSON export and unsupported methods never save configuration", () => {
    const storage = withConfig([exactRule()]);
    const before = [...storage];
    for (const action of ["upsert", "delete", "reset"]) {
      const fields = new URLSearchParams({ action, revision: "a".repeat(48), id: "fixture-rule", match: "exact", from: COM_SOURCE, to: NEXT_TARGET, enabled: "1" });
      for (const suffix of ["", "&format=json"]) {
        const result = run(variant.report, { storage, url: ROOT + "?" + fields + suffix, method: "GET", headers: FORM_HEADERS, requestBody: fields.toString() });
        assert([200, 405].includes(result.payload.response.status));
        assert.deepEqual(result.writes, []);
        assert.deepEqual([...storage], before);
      }
    }
    for (const method of ["HEAD", "PUT", "PATCH", "DELETE"]) {
      const result = post(variant, storage, "action=reset&revision=" + "a".repeat(48), { method });
      assert.deepEqual(result.writes, []);
      assert.deepEqual([...storage], before);
    }
    for (const url of [ROOT + "-other", ROOT + "/other", "https://example.test/g1-sku-report"]) {
      const result = post(variant, storage, "action=reset&revision=" + "a".repeat(48), { url });
      assert.deepEqual(result.payload, {});
      assert.deepEqual(result.reads, []);
      assert.deepEqual(result.writes, []);
    }
  });

  test("invalid draft values stay escaped in HTML with no scripts and an exact form CSP", () => {
    const storage = new Map();
    const draft = {
      match: "exact", from: 'g1.fixture.<img src=x onerror="draft-marker">&\'',
      to: 'com.google.one.fixture.\"><script>draft-marker</script>&\'', enabled: undefined
    };
    const form = formFor(htmlPage(variant, storage).payload.response.body, "upsert", "");
    const result = submit(variant, storage, form, "upsert", draft);
    assertRejected(result, 400, []);
    assertNoScript(result.payload.response);
    const retained = formFor(result.payload.response.body, "upsert", "");
    assert.equal(retained.fields.from, draft.from);
    assert.equal(retained.fields.to, draft.to);
    assert.equal(retained.fields.enabled, undefined);
    assert(!result.payload.response.body.includes(draft.from));
    assert(!result.payload.response.body.includes(draft.to));
    const data = exported(variant, storage).data;
    assert.equal(data.mappingConfig.status, "default");
    assert.deepEqual(data.mappingConfig.rules, DEFAULT_RULES);
  });

  test("stored default records retain their revision and time while deriving builtin rules", () => {
    const storage = withConfig([], { customized: false, extra: "private-config-extension" });
    const before = [...storage];
    const data = exported(variant, storage).data;
    assert.equal(data.mappingConfig.status, "default");
    assert.equal(data.mappingConfig.revision, "a".repeat(48));
    assert.equal(data.mappingConfig.updatedAt, FIXED_TIME);
    assert.equal(data.mappingConfig.mode, "discount75");
    assert.equal(data.mappingConfig.targetOrigin, "user-specified");
    assert.deepEqual(data.mappingConfig.rules, DEFAULT_RULES);
    assert(!JSON.stringify(data).includes("private-config-extension"));
    assert.deepEqual([...storage], before);
    const result = run(variant.script, { storage, body: SOURCE });
    assert.equal(result.payload.body, TARGET);
    assert.equal(record(storage, TEST_KEY).mappingRevision, "a".repeat(48));
    assert.equal(record(storage, TEST_KEY).mappingUpdatedAt, FIXED_TIME);
    assert.equal(record(storage, TEST_KEY).mappingStatus, "default");
    assert.equal(storage.get(CONFIG_KEY), before[0][1]);
  });

  test("malformed records and rule shapes stay invalid without default fallback or automatic repair", () => {
    const badRecords = [
      "private-invalid-json", "null", "[]", "42", "\"private-invalid-string\"",
      JSON.stringify(storedConfig([], { schemaVersion: 2 })),
      JSON.stringify(storedConfig([], { schemaVersion: "1" })),
      JSON.stringify(storedConfig([], { revision: "private-invalid-revision" })),
      JSON.stringify(storedConfig([], { revision: "A".repeat(48) })),
      JSON.stringify(storedConfig([], { updatedAt: "2026-02-30T00:00:00.000Z" })),
      JSON.stringify(storedConfig([], { updatedAt: "2026-11-23T07:40:06Z" })),
      JSON.stringify(storedConfig([], { updatedAt: "2026-11-23T15:40:06.325+08:00" })),
      JSON.stringify(storedConfig([], { customized: "true" })),
      JSON.stringify(storedConfig([], { customized: undefined })),
      JSON.stringify(storedConfig(undefined)), JSON.stringify(storedConfig({})), JSON.stringify(storedConfig(null)),
      JSON.stringify(storedConfig(DEFAULT_RULES, { customized: false }))
    ];
    const invalidRules = [
      [null], [42], [[]], [{}],
      [exactRule({ id: "_bad" })], [exactRule({ id: "a".repeat(41) })], [exactRule({ id: 42 })],
      [exactRule({ match: "Prefix" })], [exactRule({ match: null })],
      [exactRule({ from: 42 })], [exactRule({ to: {} })], [exactRule({ enabled: "true" })], [exactRule({ enabled: undefined })],
      [exactRule({ extra: "private-rule-extension" })],
      [exactRule({ from: "g1.fixture." })], [exactRule({ to: "com.google.one.fixture." })],
      [exactRule({ from: "g1." })], [exactRule({ to: "other.fixture" })],
      [exactRule({ from: "g1." + "a".repeat(161) })],
      [exactRule({ match: "prefix", from: "g1.fixture" })],
      [exactRule({ match: "prefix", from: "g1." })],
      [exactRule({ match: "prefix", from: "com.google.one." })],
      [exactRule({ from: CUSTOM_TARGET })],
      [exactRule(), exactRule({ from: SOURCE })],
      [exactRule({ enabled: false }), exactRule({ id: "second-rule", to: NEXT_TARGET })],
      Array.from({ length: 31 }, (_, index) => exactRule({ id: "fixture-" + index, from: "g1.fixture." + index }))
    ];
    badRecords.push(...invalidRules.map(rules => JSON.stringify(storedConfig(rules))));
    for (const raw of badRecords) {
      const storage = new Map([[CONFIG_KEY, raw]]);
      const { data } = exported(variant, storage);
      const config = data.mappingConfig;
      assert.equal(config.status, "invalid", raw);
      assert.equal(config.revision, "invalid");
      assert.equal(config.mode, "");
      assert.deepEqual(config.rules, []);
      assert.equal(config.target, "");
      assert.equal(config.targetOrigin, "");
      assert.equal(typeof config.error, "string");
      assert(config.error.length > 0);
      assert(!config.error.includes("private-"));
      assert.equal(storage.get(CONFIG_KEY), raw);
      const result = run(variant.script, { storage, body: SOURCE + " " + COM_SOURCE });
      assert.deepEqual(result.payload, {});
      const saved = record(storage, TEST_KEY);
      assert.equal(saved.status, "config-error");
      assert.equal(saved.mappingStatus, "invalid");
      assert.equal(saved.mappingRevision, "invalid");
      assert.equal(saved.mode, "");
      assert.equal(saved.hitCount, 0);
      assert.deepEqual(saved.matchedFrom, []);
      assert.equal(storage.get(CONFIG_KEY), raw);
      assert(!result.writes.some(write => write.key === CONFIG_KEY));
    }
  });

  test("only explicit reset recovers a corrupt configuration", () => {
    const storage = new Map([[CONFIG_KEY, "private-corrupt-settings"]]);
    const page = htmlPage(variant, storage);
    const reset = formFor(page.payload.response.body, "reset");
    assert.equal(reset.fields.revision, "invalid");
    for (const action of ["upsert", "delete"]) {
      const body = new URLSearchParams({ action, revision: "invalid", id: action === "delete" ? "default-2tb" : "", match: "exact", from: COM_SOURCE, to: CUSTOM_TARGET, enabled: "1" }).toString();
      const rejected = post(variant, storage, body);
      assert([400, 409].includes(rejected.payload.response.status));
      assertRejected(rejected, rejected.payload.response.status, [[CONFIG_KEY, "private-corrupt-settings"]]);
    }
    assertRedirect(variant, submit(variant, storage, reset, "reset"), "reset");
    assertStored(storage, [], false);
    assert.equal(exported(variant, storage).data.mappingConfig.mode, "discount75");
    assert.equal(run(variant.script, { storage, body: SOURCE }).payload.body, TARGET);
  });

  test("unavailable reads pass through and report config-error when diagnostic writes still work", () => {
    const faults = [
      { storageAvailable: false },
      { readAvailable: false },
      { read(key, storage) { if (key === CONFIG_KEY) throw new Error("private-read-fixture"); return storage.get(key) || null; } }
    ];
    for (const fault of faults) {
      const storage = withConfig([exactRule({ from: SOURCE })]);
      const original = storage.get(CONFIG_KEY);
      const data = exported(variant, storage, fault).data;
      assert.equal(data.mappingConfig.status, "unavailable");
      assert.equal(data.mappingConfig.revision, "unavailable");
      assert.equal(data.mappingConfig.mode, "");
      assert.deepEqual(data.mappingConfig.rules, []);
      assert(!data.mappingConfig.error.includes("private-read-fixture"));
      const result = run(variant.script, { storage, body: SOURCE, ...fault });
      assert.deepEqual(result.payload, {});
      assert(!result.writes.some(write => write.key === CONFIG_KEY));
      if (fault.storageAvailable !== false) {
        const saved = record(storage, TEST_KEY);
        assert.equal(saved.status, "config-error");
        assert.equal(saved.mappingStatus, "unavailable");
        assert.equal(saved.mappingRevision, "unavailable");
        assert.equal(saved.hitCount, 0);
      }
      assert.equal(storage.get(CONFIG_KEY), original);
      const save = post(variant, storage, "action=reset&revision=unavailable", fault);
      assertRejected(save, 503);
      assert(!save.payload.response.body.includes("private-read-fixture"));
    }
  });

  test("false, throwing or absent writes and failed readback return 503 without claiming a save", () => {
    const faults = [
      { writeAvailable: false },
      { write() { return false; } },
      { write() { throw new Error("private-write-fixture"); } },
      { write() { return true; } },
      { read(key, storage, calls) { if (key === CONFIG_KEY && calls.writes.length) throw new Error("private-readback-fixture"); return storage.get(key) || null; } },
      { read(key, storage, calls) { if (key === CONFIG_KEY && calls.writes.length) return JSON.stringify(storedConfig([], { revision: "b".repeat(48) })); return storage.get(key) || null; } },
      { read(key, storage, calls) {
        if (key === CONFIG_KEY && calls.writes.length) {
          const changed = record(storage, CONFIG_KEY);
          changed.rules[0].to = TARGET;
          return JSON.stringify(changed);
        }
        return storage.get(key) || null;
      } }
    ];
    for (const fault of faults) {
      const storage = withConfig([exactRule()]);
      storage.set(SCAN_KEY, "fixture-history-scan");
      storage.set(TEST_KEY, "fixture-history-test");
      const before = storage.get(CONFIG_KEY);
      const form = formFor(htmlPage(variant, storage).payload.response.body, "upsert", "fixture-rule");
      const result = submit(variant, storage, form, "upsert", { to: NEXT_TARGET }, fault);
      assert.equal(result.payload.response.status, 503);
      assert.equal(header(result.payload.response, "Location"), undefined);
      const draft = forms(result.payload.response.body).find(form => form.fields.from === COM_SOURCE && form.fields.to === NEXT_TARGET);
      assert(draft, "failed persistence must retain the attempted existing row values");
      assert.equal(draft.fields.match, "exact");
      assert.equal(draft.fields.enabled, "1");
      assert(result.writes.every(write => write.key === CONFIG_KEY));
      assert.equal(storage.get(SCAN_KEY), "fixture-history-scan");
      assert.equal(storage.get(TEST_KEY), "fixture-history-test");
      assert(!result.payload.response.body.includes("private-write-fixture"));
      assert(!result.payload.response.body.includes("private-readback-fixture"));
      if (!fault.read) assert.equal(storage.get(CONFIG_KEY), before);
    }
  });

  test("scan and execution record writes remain independent and never write mappings", () => {
    for (const failedKey of [SCAN_KEY, TEST_KEY]) {
      for (const throws of [false, true]) {
        const storage = withConfig([exactRule({ from: SOURCE })]);
        const mappingBefore = storage.get(CONFIG_KEY);
        const result = run(variant.script, {
          storage, body: SOURCE,
          write(value, key, current) {
            if (key === failedKey) {
              if (throws) throw new Error("fixture-record-write");
              return false;
            }
            current.set(key, value);
            return true;
          }
        });
        assert.equal(result.payload.body, CUSTOM_TARGET);
        assert.deepEqual(result.writes.map(write => write.key), [SCAN_KEY, TEST_KEY]);
        assert.equal(storage.has(failedKey), false);
        assert.equal(storage.has(failedKey === SCAN_KEY ? TEST_KEY : SCAN_KEY), true);
        assert.equal(storage.get(CONFIG_KEY), mappingBefore);
      }
    }
  });

  test("clearing history preserves settings and does not change the next rewrite", () => {
    const storage = withConfig([exactRule({ from: SOURCE })]);
    storage.set("other-tool", "fixture-untouched");
    run(variant.script, { storage, body: SOURCE });
    const configBefore = storage.get(CONFIG_KEY);
    const beforeExport = [...storage];
    const readonly = exported(variant, storage, { url: ROOT + "?format=json&clear=1" });
    assert.equal(readonly.data.scan.skus.length, 1);
    assert.equal(readonly.data.test.matchedFrom.length, 1);
    assert.deepEqual([...storage], beforeExport);
    const result = htmlPage(variant, storage, { url: ROOT + "?clear=1" });
    assert.deepEqual(result.writes.map(write => write.key), [SCAN_KEY, TEST_KEY]);
    assert.equal(storage.get(CONFIG_KEY), configBefore);
    assert.equal(storage.get("other-tool"), "fixture-untouched");
    const data = exported(variant, storage).data;
    assert.equal(data.configuredMode, "custom");
    assert.equal(data.mappingConfig.revision, "a".repeat(48));
    assert.deepEqual(data.scan.skus, []);
    assert.deepEqual(data.test.matchedFrom, []);
    assert.equal(data.test.mappingRevision, "");
    assert.equal(data.test.mappingUpdatedAt, "");
    assert.equal(data.test.mappingStatus, "");
    assert.equal(run(variant.script, { storage, body: SOURCE }).payload.body, CUSTOM_TARGET);
  });

  test("saved modes, targets and revision metadata stay historical after configuration edits", () => {
    const labels = {
      trial: "Ultra 1个月免费试用优先（历史模式）",
      discount: "Ultra 三个月一折优先（历史模式）",
      discount75: "Ultra 三个月 75p（2.5折）",
      custom: "手动映射"
    };
    for (const mode of Object.keys(labels)) {
      const storage = withConfig(DEFAULT_RULES.map(rule => rule.id === "default-2tb" ? { ...rule, to: CUSTOM_TARGET } : rule));
      const scan = { schemaVersion: 1, version: "g1-acq-fixture-history", mode, skus: [{ id: SOURCE, count: 2, lastSeen: FIXED_TIME }] };
      const test = {
        schemaVersion: 1, version: "g1-acq-fixture-history", mode, target: mode === "custom" ? CUSTOM_TARGET : TARGET,
        targetOrigin: mode === "custom" ? "user-configured" : "user-specified", updatedAt: FIXED_TIME,
        hitCount: 2, annualHitCount: 2, status: "rewritten", mappingRevision: "b".repeat(48), mappingUpdatedAt: FIXED_TIME,
        mappingStatus: mode === "custom" ? "custom" : "default",
        matchedFrom: [{ id: SOURCE, to: mode === "custom" ? CUSTOM_TARGET : TARGET, count: 2, fallback: false }]
      };
      storage.set(SCAN_KEY, JSON.stringify(scan));
      storage.set(TEST_KEY, JSON.stringify(test));
      const before = [storage.get(SCAN_KEY), storage.get(TEST_KEY)];
      change(variant, storage, "upsert", "default-2tb", { to: NEXT_TARGET });
      const data = exported(variant, storage).data;
      assert.equal(data.configuredMode, "custom");
      assert.equal(data.configuredTarget, NEXT_TARGET);
      assert.equal(data.scan.mode, mode);
      assert.equal(data.test.mode, mode);
      assert.equal(data.test.target, test.target);
      assert.equal(data.test.targetOrigin, test.targetOrigin);
      assert.equal(data.test.mappingRevision, test.mappingRevision);
      assert.equal(data.test.mappingUpdatedAt, test.mappingUpdatedAt);
      assert.equal(data.test.mappingStatus, test.mappingStatus);
      assert.deepEqual(data.test.matchedFrom, test.matchedFrom);
      assert(htmlPage(variant, storage).payload.response.body.includes(labels[mode]));
      assert.deepEqual([storage.get(SCAN_KEY), storage.get(TEST_KEY)], before);
    }
  });

  test("preset cards expose ordered descriptions, exact targets, native fields and datalist candidates", () => {
    const storage = new Map();
    const page = htmlPage(variant, storage);
    const html = page.payload.response.body;
    const section = presetSection(html);
    assert(section.includes("预制映射模板"));
    assert(html.indexOf(section) < html.indexOf(formFor(html, "upsert", "default-2tb").html));
    assertNoScript(page.payload.response);
    const presetForms = forms(section).filter(form => form.actions.has("preset"));
    assert.deepEqual(presetForms.map(form => form.fields.preset), PRESETS.map(preset => preset.id));
    const lists = [...html.matchAll(/<datalist\b[^>]*>([\s\S]*?)<\/datalist\s*>/gi)];
    const candidates = new Set(lists.flatMap(list => [...list[1].matchAll(/<option\b([^>]*)>/gi)]
      .map(option => attributes(option[1]).value)));
    for (const preset of PRESETS) {
      const form = formFor(html, "preset", preset.id);
      assert(form.controls.some(control => control.type === "hidden" && control.name === "preset" && control.value === preset.id));
      assert.equal(form.fields.revision, DEFAULT_REVISION);
      const submitted = new URLSearchParams(formBody(form, "preset"));
      assert.deepEqual([...submitted.keys()].sort(), ["action", "preset", "revision"]);
      assert.equal(submitted.get("preset"), preset.id);
      assert(form.html.includes("应用模板"));
      const card = presetCardText(html, preset.id);
      assert(card.includes(preset.description));
      for (const rule of preset.rules) {
        assert(card.includes(rule.from));
        assert(card.includes(rule.to));
        assert(card.includes(rule.match === "exact" ? "完整 SKU" : "前缀"));
        assert(candidates.has(rule.to), "preset target belongs in the datalist");
      }
      assert.equal(card.includes("当前规则一致"), preset.id !== "tr-ultra-30tb" && preset.id !== "pro-1yuan");
    }
    assert(!section.includes("1month_eft"));
    assert(!section.includes("3months_ip_90p"));
    assert(!html.includes("最近一次映射执行已读取当前配置"));
    assert.deepEqual(page.writes, []);
    assert.equal(storage.size, 0, "rendering matching builtin defaults is not a save");
  });

  for (const preset of PRESETS) {
    test("native preset " + preset.id + " saves one key, redirects read-only and governs the next runtime response", () => {
      const storage = withConfig([]);
      run(variant.script, { storage, body: JSON.stringify([SOURCE, TWENTY, THIRTY]) });
      const history = [storage.get(SCAN_KEY), storage.get(TEST_KEY)];
      const original = exported(variant, storage).data;
      const page = htmlPage(variant, storage);
      const form = formFor(page.payload.response.body, "preset", preset.id);
      const result = submit(variant, storage, form, "preset");
      const html = assertRedirect(variant, result, "preset");
      assert(html.includes("模板已保存到本机"));
      assert.match(html, /下一次[^<]*响应[^<]*读取/);
      assert(presetCardText(html, preset.id).includes("当前规则一致"));
      assert(html.includes("等待下一次方案页响应读取当前配置"));
      assert(!html.includes("最近一次映射执行已读取当前配置"));
      const current = exported(variant, storage).data;
      assert.deepEqual(Object.keys(current).sort(), Object.keys(original).sort());
      assert.equal(current.configuredMode, "custom");
      assert.equal(current.mappingConfig.status, "custom");
      assert.equal(current.mappingConfig.customized, true);
      assert.equal(current.mappingConfig.rules.length, preset.rules.length);
      assert.deepEqual(withoutIds(current.mappingConfig.rules), preset.rules);
      assertPresetRules(current.mappingConfig, preset);
      const saved = assertStored(storage, current.mappingConfig.rules);
      assert.notEqual(saved.revision, form.fields.revision);
      assert.deepEqual([storage.get(SCAN_KEY), storage.get(TEST_KEY)], history);
      assert.deepEqual(current.scan, original.scan);
      assert.deepEqual(current.test, original.test);
      const values = [SOURCE, OTHER_SOURCE, TWENTY, THIRTY, COM_SOURCE];
      const expected = values.map(id => {
        const match = preset.rules.find(rule => rule.match === "exact" ? id === rule.from : id.startsWith(rule.from));
        return match ? match.to : id;
      });
      const body = JSON.stringify({ products: values, price: "2949.99", currency: "TRY", period: "fixture-period", renewAt: FIXED_TIME });
      const runtime = run(variant.script, { storage, body });
      assert.equal(runtime.payload.body, JSON.stringify({ products: expected, price: "2949.99", currency: "TRY", period: "fixture-period", renewAt: FIXED_TIME }));
      assert.deepEqual(runtime.writes.map(write => write.key), [SCAN_KEY, TEST_KEY]);
      assert.equal(storage.get(CONFIG_KEY), JSON.stringify(saved));
      const data = exported(variant, storage).data;
      assert.equal(data.reportVersion, REPORT_VERSION);
      assert.equal(data.scan.version, VERSION);
      assert.equal(data.test.version, VERSION);
      assert.equal(data.test.mappingRevision, saved.revision);
      assert.equal(data.test.mappingUpdatedAt, saved.updatedAt);
      assert.equal(data.test.mappingStatus, "custom");
      assert.equal(data.test.mode, "custom");
      assert.equal(data.test.hitCount, expected.filter((value, index) => value !== values[index]).length);
      assert.equal(data.test.annualHitCount, preset.id === "pro-12months-90p" ? 2 : 0);
      assert(data.test.matchedFrom.every(row => row.fallback === false));
      assert.deepEqual(data.test.matchedFrom.map(row => [row.id, row.to]).sort(),
        values.flatMap((id, index) => id === expected[index] ? [] : [[id, expected[index]]]).sort());
      assert.deepEqual(data.scan.skus.map(row => row.id), [...values].sort());
      assert(!JSON.stringify(data).includes("fixture-period"));
      const executed = htmlPage(variant, storage).payload.response.body;
      assert(executed.includes("最近一次映射执行已读取当前配置"));
      assert(presetCardText(executed, preset.id).includes("当前规则一致"));
    });
  }

  test("Turkey then Ultra 75p and Pro restore current targets without reviving historical offers", () => {
    const oldTargets = ["g1.2tb.ai.annual", "g1.20tb.1month_eft.acq", "g1.ai.ultra.3months_ip_90p.acq"];
    const rules = DEFAULT_RULES.map((rule, index) => ({ ...rule, to: oldTargets[index], enabled: false }));
    const unrelated = exactRule();
    const storage = withConfig([...rules, unrelated]);
    for (const preset of PRESETS) {
      const changed = change(variant, storage, "preset", preset.id);
      assertPresetRules(changed.config, preset);
      assert.deepEqual(changed.config.rules.map(rule => rule.id), [...rules, unrelated].map(rule => rule.id));
      assert.deepEqual(changed.config.rules.at(-1), unrelated);
      const response = run(variant.script, { storage, body: JSON.stringify([SOURCE, TWENTY, THIRTY, COM_SOURCE]) });
      const expected = preset.id === "pro-1yuan" ? [SOURCE, TR_PRO_TARGET, THIRTY, CUSTOM_TARGET] :
        preset.id === "tr-ultra-30tb" ? [SOURCE, TR_PRO_TARGET, TURKEY_TARGET, CUSTOM_TARGET] :
        preset.id === "ultra-75p" ? [SOURCE, DEFAULT_RULES[1].to, DEFAULT_RULES[2].to, CUSTOM_TARGET] :
        [TARGET, DEFAULT_RULES[1].to, DEFAULT_RULES[2].to, CUSTOM_TARGET];
      assert.deepEqual(JSON.parse(response.payload.body), expected);
    }
    const config = exported(variant, storage).data.mappingConfig;
    assert.deepEqual(config.rules, [...DEFAULT_RULES, unrelated]);
    assert(config.rules.every(rule => !oldTargets.includes(rule.to) && rule.to !== TURKEY_TARGET && rule.to !== TR_PRO_TARGET));
    const reset = change(variant, storage, "reset");
    assert.deepEqual(reset.config.rules, DEFAULT_RULES);
    assertStored(storage, [], false);
  });

  test("preset merges preserve IDs and order while enabling matches and retaining narrower overrides", () => {
    const rules = [
      exactRule({ id: "unrelated-disabled", enabled: false }),
      exactRule({ id: "two-exact", from: SOURCE, to: "g1.fixture.exact_override" }),
      { id: "two-narrow", match: "prefix", from: "g1.ios.2tb.deep.", to: "g1.fixture.narrow_override", enabled: true },
      { ...DEFAULT_RULES[2], id: "existing-thirty", to: NEXT_TARGET, enabled: false },
      { ...DEFAULT_RULES[1], id: "existing-twenty", to: NEXT_TARGET, enabled: false },
      { id: "broad-custom", match: "prefix", from: "g1.ios.", to: "g1.fixture.broad_override", enabled: true },
      { ...DEFAULT_RULES[0], id: "existing-pro", to: CUSTOM_TARGET, enabled: false }
    ];
    const storage = withConfig(rules);
    const unrelatedIndexes = [0, 1, 2, 5];
    for (const preset of [PRESETS[3], PRESETS[0], PRESETS[2]]) {
      const changed = change(variant, storage, "preset", preset.id);
      assertPresetRules(changed.config, preset);
      assert.deepEqual(changed.config.rules.map(rule => rule.id), rules.map(rule => rule.id));
      for (const index of unrelatedIndexes) assert.equal(JSON.stringify(changed.config.rules[index]), JSON.stringify(rules[index]));
    }
    const values = [SOURCE, OTHER_SOURCE, "g1.ios.2tb.deep.member", TWENTY, THIRTY, COM_SOURCE, "g1.ios.12tb.fixture"];
    const response = run(variant.script, { storage, body: JSON.stringify(values) });
    assert.deepEqual(JSON.parse(response.payload.body), ["g1.fixture.exact_override", TARGET, "g1.fixture.narrow_override",
      DEFAULT_RULES[1].to, DEFAULT_RULES[2].to, COM_SOURCE, "g1.fixture.broad_override"]);
    assert(record(storage, TEST_KEY).matchedFrom.every(row => row.fallback === false));
    assert(presetCardText(htmlPage(variant, storage).payload.response.body, "pro-12months-90p").includes("当前规则一致"));
  });

  test("presets update existing matches at thirty rules and fill exactly one remaining slot", () => {
    const fillers = Array.from({ length: 27 }, (_, index) => exactRule({ id: "filler-" + index, from: "g1.fixture.filler_" + index }));
    const storage = withConfig([...DEFAULT_RULES.map(rule => ({ ...rule, to: NEXT_TARGET, enabled: false })), ...fillers]);
    for (const preset of PRESETS) {
      const changed = change(variant, storage, "preset", preset.id);
      assert.equal(changed.config.rules.length, 30);
      assertPresetRules(changed.config, preset);
      assert.deepEqual(changed.config.rules.slice(3), fillers);
    }
    assert.equal(run(variant.script, { storage, body: THIRTY }).payload.body, DEFAULT_RULES[2].to);
    const oneSlot = withConfig([DEFAULT_RULES[1], ...fillers,
      exactRule({ id: "last-filler", from: "g1.fixture.last_filler", enabled: false })]);
    const added = change(variant, oneSlot, "preset", "ultra-75p");
    assert.equal(added.config.rules.length, 30);
    assertPresetRules(added.config, PRESETS[2]);
    assert.equal(added.config.rules[0].id, "default-20tb");
    assert.equal(added.config.rules.at(-1).from, THIRTY);
    assert.equal(new Set(added.config.rules.map(rule => rule.id)).size, 30);
  });

  test("over-limit preset merges fail atomically even after an existing match would change", () => {
    for (const existing of [true, false]) {
      const fillers = Array.from({ length: 29 }, (_, index) => exactRule({ id: "filler-" + index, from: "g1.fixture.filler_" + index }));
      const rules = existing ? [{ ...DEFAULT_RULES[1], to: NEXT_TARGET, enabled: false }, ...fillers] : fillers;
      const storage = withConfig(rules);
      storage.set(SCAN_KEY, "fixture-scan-history");
      storage.set(TEST_KEY, "fixture-test-history");
      const before = [...storage];
      const form = formFor(htmlPage(variant, storage).payload.response.body, "preset", "ultra-75p");
      // Preserve the rendered hidden fields while bypassing optional disabled UI controls.
      const body = new URLSearchParams({ ...form.fields, action: "preset" }).toString();
      assertRejected(post(variant, storage, body), 400, before);
      assert.deepEqual(record(storage, CONFIG_KEY).rules, rules);
    }
  });

  test("reapplying a matching preset creates a fresh custom revision without duplicate rules", () => {
    const storage = new Map();
    const first = change(variant, storage, "preset", "ultra-75p");
    assert.deepEqual(first.config.rules, DEFAULT_RULES);
    assertStored(storage, DEFAULT_RULES);
    assert.equal(first.config.mode, "custom");
    run(variant.script, { storage, body: THIRTY });
    const history = [storage.get(SCAN_KEY), storage.get(TEST_KEY)];
    const second = change(variant, storage, "preset", "ultra-75p");
    assert.notEqual(second.config.revision, first.config.revision);
    assert.deepEqual(second.config.rules, first.config.rules);
    assert.equal(new Set(second.config.rules.map(rule => rule.id)).size, 3);
    assert.deepEqual([storage.get(SCAN_KEY), storage.get(TEST_KEY)], history);
    assert(second.html.includes("等待下一次方案页响应读取当前配置"));
    assert(!second.html.includes("最近一次映射执行已读取当前配置"));
    assert.equal(run(variant.script, { storage, body: THIRTY }).payload.body, DEFAULT_RULES[2].to);
    assert.equal(record(storage, TEST_KEY).mappingRevision, second.config.revision);
  });

  test("old preset forms return 409 after another preset save and expose the newest revision", () => {
    const storage = new Map();
    const old = formFor(htmlPage(variant, storage).payload.response.body, "preset", "tr-ultra-30tb");
    const latest = change(variant, storage, "preset", "ultra-75p");
    const before = [...storage];
    const stale = submit(variant, storage, old, "preset");
    assertRejected(stale, 409, before);
    assert.equal(formFor(stale.payload.response.body, "preset", "tr-ultra-30tb").fields.revision, latest.config.revision);
    assert.equal(record(storage, CONFIG_KEY).rules.find(rule => rule.from === THIRTY).to, DEFAULT_RULES[2].to);
  });

  test("preset merge reads and the final save read each reject intervening revisions", () => {
    for (const changedRead of [2, 3]) {
      const storage = withConfig(DEFAULT_RULES);
      const form = formFor(htmlPage(variant, storage).payload.response.body, "preset", "tr-ultra-30tb");
      const concurrent = storedConfig([...DEFAULT_RULES, exactRule()], { revision: "b".repeat(48) });
      let configReads = 0;
      const result = submit(variant, storage, form, "preset", {}, {
        read(key, current) {
          if (key === CONFIG_KEY && ++configReads === changedRead) current.set(key, JSON.stringify(concurrent));
          return current.get(key) || null;
        }
      });
      assertRejected(result, 409, [[CONFIG_KEY, JSON.stringify(concurrent)]]);
      assert(configReads >= changedRead);
      assert.equal(formFor(result.payload.response.body, "preset", "tr-ultra-30tb").fields.revision, concurrent.revision);
      assert.deepEqual(record(storage, CONFIG_KEY).rules, concurrent.rules);
    }
  });

  test("preset read, write and readback faults return 503 without a success redirect or history mutation", () => {
    const faults = [
      { storageAvailable: false },
      { readAvailable: false },
      { read() { throw new Error("private-preset-read"); } },
      ...[2, 3].map(at => ({ read(key, storage, calls) {
        if (key === CONFIG_KEY && calls.reads.filter(value => value === CONFIG_KEY).length === at) throw new Error("private-preset-read");
        return storage.get(key) || null;
      } })),
      { writeAvailable: false },
      { write() { return false; } },
      { write() { throw new Error("private-preset-write"); } },
      { write() { return true; } },
      { read(key, storage, calls) {
        if (key === CONFIG_KEY && calls.writes.length) throw new Error("private-preset-readback");
        return storage.get(key) || null;
      } },
      { read(key, storage, calls) {
        if (key === CONFIG_KEY && calls.writes.length) return JSON.stringify(storedConfig(DEFAULT_RULES, { revision: "b".repeat(48) }));
        return storage.get(key) || null;
      } },
      { read(key, storage, calls) {
        if (key === CONFIG_KEY && calls.writes.length) {
          const changed = record(storage, CONFIG_KEY);
          changed.rules.find(rule => rule.from === THIRTY).to = NEXT_TARGET;
          return JSON.stringify(changed);
        }
        return storage.get(key) || null;
      } }
    ];
    for (const fault of faults) {
      const storage = withConfig(DEFAULT_RULES);
      storage.set(SCAN_KEY, "fixture-scan-history");
      storage.set(TEST_KEY, "fixture-test-history");
      const previous = storage.get(CONFIG_KEY);
      const form = formFor(htmlPage(variant, storage).payload.response.body, "preset", "tr-ultra-30tb");
      const result = submit(variant, storage, form, "preset", {}, fault);
      assert.equal(result.payload.response.status, 503);
      assert.equal(header(result.payload.response, "Location"), undefined);
      assert(result.writes.length <= 1);
      assert(result.writes.every(write => write.key === CONFIG_KEY));
      assert.equal(storage.get(SCAN_KEY), "fixture-scan-history");
      assert.equal(storage.get(TEST_KEY), "fixture-test-history");
      assert(!result.payload.response.body.includes("模板已保存到本机"));
      assert(!result.payload.response.body.includes("private-preset-"));
      if (!result.writes.length || !fault.read) assert.equal(storage.get(CONFIG_KEY), previous);
    }
  });

  test("presets leave invalid settings untouched until the real reset form repairs them", () => {
    const storage = new Map([[CONFIG_KEY, "fixture-invalid-config"]]);
    const page = htmlPage(variant, storage);
    for (const preset of PRESETS) {
      const form = formFor(page.payload.response.body, "preset", preset.id);
      assert.equal(form.fields.revision, "invalid");
      assert.equal(form.disabled, true);
      const body = new URLSearchParams({ ...form.fields, action: "preset" }).toString();
      assertRejected(post(variant, storage, body), 400, [[CONFIG_KEY, "fixture-invalid-config"]]);
    }
    const reset = formFor(page.payload.response.body, "reset");
    assertRedirect(variant, submit(variant, storage, reset, "reset"), "reset");
    assertStored(storage, [], false);
    const applied = change(variant, storage, "preset", "tr-ultra-30tb");
    assertPresetRules(applied.config, PRESETS[1]);
    assert.equal(run(variant.script, { storage, body: THIRTY }).payload.body, TURKEY_TARGET);
  });

  test("preset forms reject missing, duplicate, additional, malformed and non-allowlisted fields", () => {
    const storage = new Map();
    const form = formFor(htmlPage(variant, storage).payload.response.body, "preset", "tr-ultra-30tb");
    const body = formBody(form, "preset");
    const changes = [
      { action: undefined }, { revision: undefined }, { preset: undefined },
      { action: "Preset" }, { preset: "" }, { preset: "constructor" }, { preset: "__proto__" },
      { preset: "toString" }, { preset: "hasOwnProperty" }, { preset: "unknown" },
      { preset: "tr-ultra-30tb " }, { preset: " tr-ultra-30tb" }, { preset: "TR-ULTRA-30TB" },
      { preset: "tr-ultra-30tb\n" }, { preset: "tr-ultra-30tb\u0000" },
      { preset: '<img src=x onerror="preset-marker">' }
    ];
    for (const fields of changes) assertRejected(post(variant, storage, formBody(form, "preset", fields)), 400, []);
    for (const suffix of [
      "&preset=ultra-75p", "&pres%65t=tr-ultra-30tb", "&action=preset", "&revision=" + DEFAULT_REVISION,
      "&id=default-30tb", "&match=exact", "&from=" + THIRTY, "&to=" + NEXT_TARGET, "&enabled=1",
      "&rules=%5B%5D", "&unknown=1", "&__proto__=tr-ultra-30tb", "&constructor=ultra-75p", "&clear=1"
    ]) assertRejected(post(variant, storage, body + suffix), 400, []);
    for (const value of ["%", "%GG", "%E0%A4%A", "%C0%AF", "%ED%A0%80"]) {
      assertRejected(post(variant, storage, body.replace("preset=tr-ultra-30tb", "preset=" + value)), 400, []);
    }
    assertRejected(post(variant, storage, body + "&preset=" + "a".repeat(20000)), 413, []);
    const valid = submit(variant, storage, form, "preset");
    assertRedirect(variant, valid, "preset");
    assert.equal(record(storage, CONFIG_KEY).rules.find(rule => rule.from === THIRTY).to, TURKEY_TARGET);
  });

  test("existing upsert, delete and reset actions reject an added preset field", () => {
    const storage = withConfig(DEFAULT_RULES);
    const html = htmlPage(variant, storage).payload.response.body;
    const before = [...storage];
    for (const action of ["upsert", "delete", "reset"]) {
      const form = formFor(html, action, action === "reset" ? undefined : "default-20tb");
      assertRejected(submit(variant, storage, form, action, { preset: "tr-ultra-30tb" }), 400, before);
    }
  });

  test("preset GET queries, report links and the real JSON export form remain read-only", () => {
    const storage = new Map();
    run(variant.script, { storage, body: THIRTY });
    const page = htmlPage(variant, storage);
    const baseline = exported(variant, storage).data;
    const form = formFor(page.payload.response.body, "preset", "tr-ultra-30tb");
    const body = formBody(form, "preset");
    const before = [...storage];
    for (const suffix of ["", "&format=json", "&clear=1", "&format=json&clear=1"]) {
      const result = run(variant.report, { storage, url: ROOT + "?" + body + suffix, method: "GET", headers: FORM_HEADERS, requestBody: body });
      assertRejected(result, 405, before);
    }
    for (const suffix of ["?preset=tr-ultra-30tb", "?preset=tr-ultra-30tb&revision=" + DEFAULT_REVISION, "?notice=preset", "?format=json&preset=tr-ultra-30tb"]) {
      const result = run(variant.report, { storage, url: ROOT + suffix });
      assert.equal(result.payload.response.status, 200);
      assert.deepEqual(result.writes, []);
      assert.deepEqual([...storage], before);
    }
    for (const link of page.payload.response.body.matchAll(/<a\b([^>]*)>/gi)) {
      const href = attributes(link[1]).href;
      if (!href || !new URL(href, ROOT).href.startsWith(ROOT)) continue;
      const result = htmlPage(variant, storage, { url: new URL(href, ROOT).href });
      assert.deepEqual(result.writes, []);
      assert.deepEqual([...storage], before);
    }
    const exportForm = forms(page.payload.response.body).find(form => form.attrs.method.toLowerCase() === "get" &&
      form.buttons.some(button => button.name === "format" && button.value === "json"));
    assert(exportForm);
    const url = new URL(exportForm.attrs.action, ROOT);
    for (const [key, value] of Object.entries(exportForm.fields)) url.searchParams.set(key, value);
    url.searchParams.set("format", "json");
    const exportedData = exported(variant, storage, { url: url.href }).data;
    assert.deepEqual(exportedData, baseline);
    assert.deepEqual([...storage], before);
    assert.equal(storage.has(CONFIG_KEY), false);
  });

  test("preset POST retains exact Origin, fetch-site, content-type and CSP enforcement", () => {
    const storage = new Map();
    const page = htmlPage(variant, storage);
    const form = formFor(page.payload.response.body, "preset", "tr-ultra-30tb");
    assertNoScript(page.payload.response);
    for (const origin of [undefined, "", "null", "https://example.test", ORIGIN + ".evil", "http://one.google.com", ORIGIN + "/", ORIGIN + ":443"]) {
      const headers = { "Content-Type": FORM_HEADERS["Content-Type"] };
      if (origin !== undefined) headers.Origin = origin;
      assertRejected(submit(variant, storage, form, "preset", {}, { headers }), 403, []);
    }
    for (const site of ["cross-site", "same-site", "none", "", "null"]) {
      assertRejected(submit(variant, storage, form, "preset", {}, { headers: { ...FORM_HEADERS, "Sec-Fetch-Site": site } }), 403, []);
    }
    for (const contentType of [undefined, "application/json", "text/plain", "application/x-www-form-urlencodedx"]) {
      const headers = { Origin: ORIGIN };
      if (contentType !== undefined) headers["Content-Type"] = contentType;
      assertRejected(submit(variant, storage, form, "preset", {}, { headers }), 415, []);
    }
    const headers = { origin: ORIGIN, "content-type": "application/x-www-form-urlencoded; charset=UTF-8", "sec-fetch-site": "same-origin" };
    const touched = [];
    for (const key of ["Cookie", "Authorization"]) Object.defineProperty(headers, key, {
      enumerable: true, get() { touched.push(key); throw new Error("private-preset-header"); }
    });
    const result = submit(variant, storage, form, "preset", {}, { headers });
    const html = assertRedirect(variant, result, "preset");
    assertNoScript(result.payload.response);
    assert(html.includes("当前规则一致"));
    assert.deepEqual(touched, []);
  });

  test("preset consistency labels require every enabled pair and stay distinct from runtime evidence", () => {
    for (const rules of [
      [DEFAULT_RULES[1]],
      [DEFAULT_RULES[1], { ...DEFAULT_RULES[2], enabled: false }],
      [DEFAULT_RULES[1], { ...DEFAULT_RULES[2], to: TURKEY_TARGET }],
      [DEFAULT_RULES[1], DEFAULT_RULES[2]]
    ]) {
      const storage = withConfig(rules);
      const html = htmlPage(variant, storage).payload.response.body;
      const matches = rules.length === 2 && rules[1].enabled && rules[1].to === DEFAULT_RULES[2].to;
      assert.equal(presetCardText(html, "ultra-75p").includes("当前规则一致"), matches);
      assert(!html.includes("最近一次映射执行已读取当前配置"));
    }
    const storage = withConfig([exactRule({ from: SOURCE }), { ...DEFAULT_RULES[0], enabled: false }]);
    const changed = change(variant, storage, "preset", "pro-12months-90p");
    assert(presetCardText(changed.html, "pro-12months-90p").includes("当前规则一致"));
    assert(!changed.html.includes("最近一次映射执行已读取当前配置"));
    assert.equal(run(variant.script, { storage, body: SOURCE }).payload.body, CUSTOM_TARGET);
    const html = htmlPage(variant, storage).payload.response.body;
    assert(presetCardText(html, "pro-12months-90p").includes("当前规则一致"));
    assert(html.includes("最近一次映射执行已读取当前配置"));
    assert.equal(record(storage, TEST_KEY).matchedFrom[0].to, CUSTOM_TARGET, "a consistent prefix still respects an exact override");
  });

  test("preset controls are disabled for invalid or unavailable settings and absent write APIs", () => {
    const scenarios = [
      { storage: new Map([[CONFIG_KEY, "fixture-invalid-config"]]) },
      { storage: new Map(), options: { storageAvailable: false } },
      { storage: new Map(), options: { readAvailable: false } },
      { storage: new Map(), options: { read() { throw new Error("private-disabled-read"); } } },
      { storage: new Map(), options: { writeAvailable: false } }
    ];
    for (const scenario of scenarios) {
      const before = [...scenario.storage];
      const page = htmlPage(variant, scenario.storage, scenario.options);
      for (const preset of PRESETS) {
        const form = formFor(page.payload.response.body, "preset", preset.id);
        assert(form.disabled || form.buttons.length === 0, "each preset submit control must be disabled");
      }
      assert.deepEqual(page.writes, []);
      assert.deepEqual([...scenario.storage], before);
      assertNoScript(page.payload.response);
    }
  });

  test("applying every preset preserves historical modes, fallback targets, 300 IDs and ten arrivals", () => {
    for (const mode of ["trial", "discount", "discount75"]) {
      const version = mode === "discount75" ? "g1-acq-v7.9-mappings" : "g1-acq-v7.7-" + mode;
      const scan = {
        schemaVersion: 1, version, mode, updatedAt: FIXED_TIME, scannedResponses: 40, matchedResponses: 35,
        nonTextResponses: 5, truncated: true, limit: 300,
        skus: Array.from({ length: 300 }, (_, index) => ({ id: "g1.fixture.history_" + index, count: index + 1, lastSeen: FIXED_TIME })),
        recentResponses: Array.from({ length: 10 }, () => ({ at: FIXED_TIME, path: "/plans", bodyType: "text",
          status: "known-skus", candidateCount: 2, addedCount: 0, omittedCount: 0 }))
      };
      const test = {
        schemaVersion: 1, version, mode, updatedAt: FIXED_TIME, target: TARGET, targetOrigin: "user-specified",
        status: "rewritten", hitCount: 3, annualHitCount: 1, mappingRevision: "b".repeat(48), mappingUpdatedAt: FIXED_TIME,
        mappingStatus: "default", matchedFrom: [
          { id: SOURCE, to: TARGET, count: 1, fallback: false },
          { id: TWENTY, to: "g1.20tb.1month_eft.acq", count: 1, fallback: false },
          { id: THIRTY, to: "g1.ai.ultra.3months_ip_90p.acq", count: 1, fallback: true }
        ]
      };
      const storage = new Map([[SCAN_KEY, JSON.stringify(scan)], [TEST_KEY, JSON.stringify(test)]]);
      const history = [storage.get(SCAN_KEY), storage.get(TEST_KEY)];
      const baseline = exported(variant, storage).data;
      for (const preset of PRESETS) {
        change(variant, storage, "preset", preset.id);
        const data = exported(variant, storage).data;
        assert.deepEqual(data.scan, baseline.scan);
        assert.deepEqual(data.test, baseline.test);
        assert.deepEqual([storage.get(SCAN_KEY), storage.get(TEST_KEY)], history);
        assert.equal(data.scan.skus.length, 300);
        assert.equal(data.scan.recentResponses.length, 10);
        assert.deepEqual([...storage.keys()].sort(), [CONFIG_KEY, SCAN_KEY, TEST_KEY].sort());
        const html = htmlPage(variant, storage).payload.response.body;
        assert(html.includes("g1.ai.ultra.3months_ip_90p.acq</code></td><td>90p</td>"));
      }
    }
  });

  test("historical 2TB target-origin inference uses fixed defaults rather than the edited prefix", () => {
    for (const previous of [
      { version: "g1-acq-v7.8-75p", target: TARGET, expected: TARGET, origin: "user-specified" },
      { version: "pro-annual-test-v1", expected: "g1.2tb.ai.annual", origin: "legacy" },
      { version: "g1-acq-v7.1", expected: "g1.2tb.ai.annual", origin: "legacy" }
    ]) {
      const storage = withConfig(DEFAULT_RULES.map(rule => rule.id === "default-2tb" ? { ...rule, to: CUSTOM_TARGET } : rule));
      const saved = JSON.stringify({ schemaVersion: 1, version: previous.version, target: previous.target, hitCount: 2, matchedFrom: [{ id: SOURCE, count: 2 }] });
      storage.set(TEST_KEY, saved);
      const data = exported(variant, storage).data;
      assert.equal(data.configuredTarget, CUSTOM_TARGET);
      assert.equal(data.test.target, previous.expected);
      assert.equal(data.test.targetOrigin, previous.origin);
      assert.equal(data.test.matchedFrom[0].to, previous.expected);
      assert.equal(data.test.mappingRevision, "");
      assert.equal(data.test.mappingUpdatedAt, "");
      assert.equal(data.test.mappingStatus, "");
      assert.equal(storage.get(TEST_KEY), saved);
    }
  });
}

nodeTest("preset catalog has the exact public shape and returns isolated objects, arrays and rules", () => {
  const harness = engineHarness();
  const first = harness.invoke("presets");
  const second = harness.invoke("presets");
  assert.deepEqual(plain(first), PRESETS);
  assert.deepEqual(plain(second), PRESETS);
  assert.notEqual(first, second);
  for (let index = 0; index < first.length; index++) {
    assert.notEqual(first[index], second[index]);
    assert.notEqual(first[index].rules, second[index].rules);
    assert.deepEqual(Object.keys(first[index]).sort(), ["description", "id", "rules", "title"]);
    for (let ruleIndex = 0; ruleIndex < first[index].rules.length; ruleIndex++) {
      assert.notEqual(first[index].rules[ruleIndex], second[index].rules[ruleIndex]);
      assert.deepEqual(Object.keys(first[index].rules[ruleIndex]).sort(), ["enabled", "from", "match", "to"]);
    }
  }
  first[0].id = "changed-id";
  first[0].title = "changed-title";
  first[0].description = "changed-description";
  first[0].rules[0].to = NEXT_TARGET;
  first[1].rules.pop();
  first[2].rules = [];
  first.push({ id: "injected-preset", rules: [] });
  assert.deepEqual(plain(harness.invoke("presets")), PRESETS);
  assert.deepEqual(plain(second), PRESETS);
  assert.deepEqual(harness.reads, []);
  assert.deepEqual(harness.writes, []);
});

nodeTest("applyPreset accepts only builtin IDs and ignores caller-supplied rule payloads", () => {
  const harness = engineHarness({ storage: withConfig([]) });
  for (const id of [undefined, null, "", "unknown", "constructor", "__proto__", "toString", "hasOwnProperty",
    "tr-ultra-30tb ", "tr-ultra-30tb\n", 0, true, ["tr-ultra-30tb"], { id: "tr-ultra-30tb" },
    { toString() { return "tr-ultra-30tb"; } }]) {
    const result = plain(harness.invoke("applyPreset", "a".repeat(48), id));
    assert.deepEqual(Object.keys(result).sort(), ["config", "error", "ok", "status"]);
    assert.equal(result.ok, false);
    assert.equal(result.status, 400);
    assert.equal(typeof result.error, "string");
    assert(result.error.length > 0);
    assert.deepEqual(result.config.rules, []);
    assert.deepEqual(harness.writes, []);
  }
  const catalog = harness.invoke("presets");
  catalog[0].rules[0].to = NEXT_TARGET;
  const result = plain(harness.invoke("applyPreset", "a".repeat(48), "tr-ultra-30tb", [exactRule({ from: THIRTY, to: NEXT_TARGET })]));
  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(result.error, "");
  assert.deepEqual(withoutIds(result.config.rules), PRESETS[1].rules);
  assert.deepEqual(harness.writes.map(write => write.key), [CONFIG_KEY]);
  assertStored(harness.storage, result.config.rules);
});

nodeTest("preset insertion stays unique and bounded when every random value repeats", () => {
  const base = "rule-" + "0".repeat(16);
  const rules = Array.from({ length: 28 }, (_, index) => exactRule({
    id: index === 0 ? base : base + "-" + index, from: "g1.fixture.collision_" + index, enabled: index % 2 === 0
  }));
  const harness = engineHarness({ storage: withConfig(rules), random: () => 0 });
  // The VM timeout makes an unbounded collision retry fail this node promptly.
  const applied = plain(harness.invoke("applyPreset", "a".repeat(48), "ultra-75p"));
  assert.equal(applied.status, 200);
  assert.equal(applied.config.rules.length, 30);
  assert.deepEqual(applied.config.rules.slice(0, 28), rules);
  assert.deepEqual(withoutIds(applied.config.rules.slice(28)), PRESETS[2].rules);
  assert.equal(new Set(applied.config.rules.map(rule => rule.id)).size, 30);
  assert(applied.config.rules.every(rule => /^[a-z][a-z0-9-]{0,39}$/.test(rule.id)));
  assert.equal(harness.invoke("validateRules", applied.config.rules).ok, true);
  const repeated = plain(harness.invoke("applyPreset", applied.config.revision, "ultra-75p"));
  assert.equal(repeated.status, 200);
  assert.notEqual(repeated.config.revision, applied.config.revision);
  assert.deepEqual(repeated.config.rules, applied.config.rules);
  assert.deepEqual(harness.writes.map(write => write.key), [CONFIG_KEY, CONFIG_KEY]);
  assertStored(harness.storage, repeated.config.rules);
});

nodeTest("applyPreset exposes stale, invalid, unavailable, over-limit and final-save race failures without writes", () => {
  const scenarios = [
    { options: { storage: withConfig(DEFAULT_RULES) }, revision: "b".repeat(48), status: 409 },
    { options: { storage: new Map([[CONFIG_KEY, "fixture-invalid-config"]]) }, revision: "invalid", status: 400 },
    { options: { storageAvailable: false }, revision: DEFAULT_REVISION, status: 503 },
    { options: { readAvailable: false }, revision: DEFAULT_REVISION, status: 503 },
    { options: { read() { throw new Error("fixture-read-failure"); } }, revision: DEFAULT_REVISION, status: 503 },
    { options: { storage: withConfig(Array.from({ length: 30 }, (_, index) => exactRule({ id: "limit-" + index, from: "g1.fixture.limit_" + index }))) },
      revision: "a".repeat(48), status: 400 }
  ];
  for (const scenario of scenarios) {
    const harness = engineHarness(scenario.options);
    const before = [...harness.storage];
    const result = plain(harness.invoke("applyPreset", scenario.revision, "tr-ultra-30tb"));
    assert.deepEqual(Object.keys(result).sort(), ["config", "error", "ok", "status"]);
    assert.equal(result.ok, false);
    assert.equal(result.status, scenario.status);
    assert.equal(typeof result.error, "string");
    assert(result.error.length > 0);
    assert.deepEqual(harness.writes, []);
    assert.deepEqual([...harness.storage], before);
  }
  const concurrent = storedConfig([...DEFAULT_RULES, exactRule()], { revision: "b".repeat(48) });
  const harness = engineHarness({
    storage: withConfig(DEFAULT_RULES),
    read(key, storage, calls) {
      if (calls.reads.length === 2) storage.set(key, JSON.stringify(concurrent));
      return storage.get(key) || null;
    }
  });
  const raced = plain(harness.invoke("applyPreset", "a".repeat(48), "tr-ultra-30tb"));
  assert.equal(raced.status, 409);
  assert.equal(raced.ok, false);
  assert.deepEqual(raced.config.rules, concurrent.rules);
  assert.equal(raced.config.revision, concurrent.revision);
  assert.deepEqual(harness.reads, [CONFIG_KEY, CONFIG_KEY]);
  assert.deepEqual(harness.writes, []);
  assert.equal(harness.storage.get(CONFIG_KEY), JSON.stringify(concurrent));
});

nodeTest("mapping config generated blocks and aliases share the real engine and --check is read-only", () => {
  const enginePath = path.join(root, "lib/mapping-config.js");
  const engine = fs.readFileSync(enginePath, "utf8").trimEnd();
  const begin = "// BEGIN GENERATED MAPPING CONFIG";
  const end = "// END GENERATED MAPPING CONFIG";
  for (const name of ["g1-acq.js", "g1-sku-report.js"]) {
    const source = sources[name];
    assert.equal(source.split(begin).length, 2, name);
    assert.equal(source.split(end).length, 2, name);
    const embedded = source.slice(source.indexOf(begin) + begin.length + 1, source.indexOf(end));
    assert.equal(embedded.trimEnd(), engine, name);
  }
  for (const [canonical, alias] of [["g1-acq.js", "g1-acq-discount.js"], ["g1-sku-report.js", "g1-sku-report-discount.js"]]) {
    assert.equal(sources[alias], "/* Generated from " + canonical + " by tools/build-variants.cjs. */\n" + sources[canonical]);
  }
  const paths = [enginePath, ...Object.keys(sources).map(name => path.join(root, name))];
  const before = paths.map(file => ({ contents: fs.readFileSync(file, "utf8"), mtime: fs.statSync(file).mtimeMs }));
  const checked = spawnSync(process.execPath, [path.join(root, "tools/build-variants.cjs"), "--check"], { cwd: root, encoding: "utf8", timeout: 10000 });
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  assert.deepEqual(paths.map(file => ({ contents: fs.readFileSync(file, "utf8"), mtime: fs.statSync(file).mtimeMs })), before);
});
