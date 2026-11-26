"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test: nodeTest } = require("node:test");

const root = path.resolve(__dirname, "..");
const TARGET = "g1.2tb.ai.12months_ip_90p";
const LEGACY_TARGET = "g1.2tb.ai.annual";
const SCAN_KEY = "g1.sku.scan.v1";
const TEST_KEY = "g1.pro.annual.test.v1";
const MAPPING_KEY = "g1.sku.mappings.v1";
const REPORT = "https://one.google.com/g1-sku-report";
// Fixture source IDs test the matching contract; they are not store catalog evidence.
const SOURCE = "g1.ios.2tb.fixture_monthly";
const OTHER_SOURCE = "g1.ios.2tb.fixture_annual";
const TWENTY = "g1.ios.20tb.m.v2";
const THIRTY = "g1.ios.30tb.ai.pro.m";
// Expected offers are explicit fixtures, independent of the scripts and builder.
const VERSION = "g1-acq-v7.11-mappings";
const MODE = "discount75";
const REPORT_VERSION = "v7.11.0";
const MODE_LABELS = {
  trial: "Ultra 1个月免费试用优先（历史模式）",
  discount: "Ultra 三个月一折优先（历史模式）",
  discount75: "Ultra 三个月 75p（2.5折）",
  custom: "手动映射"
};
const TWENTY_TARGET = "g1.20tb.3months_ip_75p.acq";
const THIRTY_TARGET = "g1.ai.ultra.3months_ip_75p.acq";
const ULTRA_OFFERS = [
  "g1.20tb.1month_eft.acq", "g1.20tb.3months_ip_90p.acq", TWENTY_TARGET,
  "g1.ai.ultra.1month_eft.acq", "g1.ai.ultra.3months_ip_90p.acq", THIRTY_TARGET
];
const VARIANTS = [
  { script: "g1-acq.js", report: "g1-sku-report.js" },
  { script: "g1-acq-discount.js", report: "g1-sku-report-discount.js" }
];
const LEGACY_TWENTY_FALLBACK = TWENTY_TARGET;
const LEGACY_THIRTY_FALLBACK = THIRTY_TARGET;
const source = Object.fromEntries(
  ["g1-acq.js", "g1-acq-discount.js", "g1-sku-scan.js", "g1-sku-report.js", "g1-sku-report-discount.js"].map(name =>
    [name, fs.readFileSync(path.join(root, name), "utf8")])
);

function run(name, options = {}) {
  const storage = options.storage || new Map();
  const calls = [];
  const logs = [];
  const reads = [];
  const writes = [];
  const context = {
    $request: {
      url: options.url || "https://one.google.com/ai?fixture=1",
      method: options.method || "GET",
      body: options.requestBody,
      headers: options.headers || { Cookie: "cookie-secret", Authorization: "auth-secret" }
    },
    $response: { body: options.body, headers: { "x-private": "response-secret" } },
    $done: payload => calls.push(JSON.parse(JSON.stringify(payload))),
    console: { log: value => logs.push(String(value)) }
  };
  if (options.storageAvailable !== false) {
    context.$persistentStore = {
      read(key) {
        reads.push(key);
        if (options.storageThrows || options.storageReadThrows) throw new Error("fixture storage failure");
        return storage.get(key) || null;
      },
      write(value, key) {
        if (options.storageThrows) throw new Error("fixture storage failure");
        writes.push(key);
        if (options.storageWriteFails) return false;
        storage.set(key, value);
        return true;
      }
    };
  }
  vm.runInNewContext(source[name], context, { timeout: 2000, filename: name });
  assert.equal(calls.length, 1, "$done must be called once");
  return { payload: calls[0], storage, logs, reads, writes };
}

function get(storage, key) {
  return JSON.parse(storage.get(key));
}

function assertModeText(html, label, expected) {
  const visible = html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ");
  const escaped = expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(visible, new RegExp(label + "\\s*：\\s*" + escaped));
}

// Run the original response, persistence and report contracts through both entries.
for (const variant of VARIANTS) {
  const test = (name, fn) => nodeTest(variant.script + ": " + name, fn);

  test("combined module maps 2TB, 20TB and 30TB while preserving unrelated full tokens", () => {
    const untouched = [
      "g1.ios.12tb.fixture", TWENTY + ".extra", THIRTY + ".extra",
      "g1.ios.2tbx.fixture", "g1.ios.2tb.", "prefix" + SOURCE, "x." + SOURCE,
      "person@" + SOURCE, "%" + SOURCE, "-" + SOURCE, "_" + SOURCE,
      "prefix" + TWENTY, "person@" + THIRTY, TWENTY + "_extra", THIRTY + "-extra", "g1.2tb", TARGET
    ];
    const values = [SOURCE, OTHER_SOURCE, SOURCE, TWENTY, THIRTY, ...untouched];
    const result = run(variant.script, { body: JSON.stringify(values) });
    assert.deepEqual(JSON.parse(result.payload.body), [TARGET, TARGET, TARGET, TWENTY_TARGET, THIRTY_TARGET, ...untouched]);
    const record = get(result.storage, TEST_KEY);
    assert.equal(record.hitCount, 5);
    assert.equal(record.annualHitCount, 3);
    assert.equal(record.status, "rewritten");
    assert.equal(record.version, VERSION);
    assert.deepEqual(record.matchedFrom, [
      { id: TWENTY, to: TWENTY_TARGET, count: 1, fallback: false },
      { id: OTHER_SOURCE, to: TARGET, count: 1, fallback: false },
      { id: SOURCE, to: TARGET, count: 2, fallback: false },
      { id: THIRTY, to: THIRTY_TARGET, count: 1, fallback: false }
    ]);
  });

  test("empty responses or responses with no configured sources pass through", () => {
    for (const body of ["", "g1.ios.100gb.m", "g1.ios.20tb.other", "g1.ios.30tb.other"]) {
      const result = run(variant.script, { body });
      assert.deepEqual(result.payload, {});
      assert.equal(get(result.storage, TEST_KEY).status, "no-match");
    }
    for (const body of [undefined, null, 123, {}]) {
      const result = run(variant.script, { body });
      assert.deepEqual(result.payload, {});
      assert.equal(get(result.storage, TEST_KEY).status, "non-text");
    }
  });

  test("all 64 combinations of six Ultra offers use fixed 75p targets without changing prices or dates", () => {
    for (let mask = 0; mask < 64; mask++) {
      const observed = ULTRA_OFFERS.filter((_, index) => mask & (1 << index));
      // Exercise both offer orders so neither presence nor ordering can select a target.
      for (const offers of [observed, [...observed].reverse()]) {
        const body = JSON.stringify({
          products: [TWENTY, THIRTY, TWENTY], offers,
          price: 330, regularPrice: "3300.00", trialStart: "2026-11-23", regularStart: "2027-02-23"
        }, null, 2);
        const result = run(variant.script, { body });
        assert.equal(result.payload.body, body.replaceAll(TWENTY, TWENTY_TARGET).replaceAll(THIRTY, THIRTY_TARGET), "offer mask=" + mask);
        const record = get(result.storage, TEST_KEY);
        assert.equal(record.schemaVersion, 1);
        assert.equal(record.version, VERSION);
        assert.equal(record.mode, MODE);
        assert.equal(record.hitCount, 3);
        assert.equal(record.annualHitCount, 0);
        assert.equal(record.status, "rewritten");
        assert.deepEqual(record.matchedFrom, [
          { id: TWENTY, to: TWENTY_TARGET, count: 2, fallback: false },
          { id: THIRTY, to: THIRTY_TARGET, count: 1, fallback: false }
        ]);
        const scan = get(result.storage, SCAN_KEY);
        assert.equal(scan.schemaVersion, 1);
        assert.equal(scan.version, VERSION);
        assert.equal(scan.mode, MODE);
        assert.deepEqual(scan.skus.map(row => row.id), [...new Set([TWENTY, THIRTY, ...offers])].sort());
        assert.equal(scan.skus.find(row => row.id === TWENTY).count, 2);
        assert.deepEqual(result.writes, [SCAN_KEY, TEST_KEY]);
        assert.deepEqual([...result.storage.keys()], [SCAN_KEY, TEST_KEY]);
        assert.equal(result.logs.filter(line => line.startsWith("[g1-acq] " + VERSION + " hits=")).length, 1);
        assert(result.logs.includes("[g1-acq] " + VERSION + " hits=3 annualHits=0 mode=" + MODE));
        const collectionLogs = result.logs.filter(line => line.startsWith("[g1-acq] " + VERSION + " status="));
        assert.equal(collectionLogs.length, 1);
        assert(collectionLogs[0].includes(" status=new-skus "));
        assert(collectionLogs[0].endsWith(" mode=" + MODE));
        assert(result.logs.indexOf(collectionLogs[0]) < result.logs.findIndex(line => line.includes(VERSION + " hits=")));
        for (const [id, target, count] of [[TWENTY, TWENTY_TARGET, 2], [THIRTY, THIRTY_TARGET, 1]]) {
          assert(result.logs.includes("[g1-acq] " + id + " -> " + target + " x" + count));
        }
        assert(!result.logs.some(line => line.includes("fallback=")));
      }
    }
  });

  test("existing acquisition IDs pass through unchanged with or without source IDs", () => {
    const offers = [...ULTRA_OFFERS, "g1.20tb.fixture.acq", "g1.ai.ultra.fixture.acq", TARGET];
    const untouched = run(variant.script, { body: JSON.stringify(offers) });
    assert.deepEqual(untouched.payload, {});
    assert.equal(get(untouched.storage, TEST_KEY).status, "no-match");
    assert.deepEqual(get(untouched.storage, TEST_KEY).matchedFrom, []);
    const mapped = run(variant.script, { body: JSON.stringify([SOURCE, TWENTY, THIRTY, ...offers]) });
    assert.deepEqual(JSON.parse(mapped.payload.body), [TARGET, TWENTY_TARGET, THIRTY_TARGET, ...offers]);
    assert(get(mapped.storage, TEST_KEY).matchedFrom.every(row => row.fallback === false));
    assert(!mapped.logs.some(line => line.includes("fallback=")));
  });

  test("saved offers do not select targets and both Ultra tiers retain fixed 75p defaults", () => {
    for (const savedOffers of [ULTRA_OFFERS.filter(id => !id.includes("75p")), [TWENTY_TARGET, THIRTY_TARGET]]) {
      const storage = new Map();
      run(variant.script, { url: "https://one.google.com/plans", body: JSON.stringify(savedOffers), storage });
      for (const offers of [[], ULTRA_OFFERS.filter(id => !id.includes("75p")), ULTRA_OFFERS]) {
        const result = run(variant.script, { body: JSON.stringify([SOURCE, TWENTY, THIRTY, ...offers]), storage });
        assert.deepEqual(JSON.parse(result.payload.body), [TARGET, TWENTY_TARGET, THIRTY_TARGET, ...offers]);
        assert.deepEqual(get(storage, TEST_KEY).matchedFrom, [
          { id: TWENTY, to: TWENTY_TARGET, count: 1, fallback: false },
          { id: SOURCE, to: TARGET, count: 1, fallback: false },
          { id: THIRTY, to: THIRTY_TARGET, count: 1, fallback: false }
        ]);
        for (const id of savedOffers) assert(get(storage, SCAN_KEY).skus.some(row => row.id === id));
        assert(!result.logs.some(line => line.includes("fallback=")));
      }
    }
  });

  test("single module collects other Google pages without changing the last mapping record", () => {
    for (const url of [
      "https://one.google.com/ai", "https://one.google.com/ai/other?x=1",
      "https://one.google.com/plans?x=1"
    ]) {
      const previous = JSON.stringify({ schemaVersion: 1, version: "previous-record", hitCount: 2 });
      const storage = new Map([[TEST_KEY, previous]]);
      const result = run(variant.script, { url, body: SOURCE, storage });
      assert.deepEqual(result.payload, {});
      assert.equal(storage.get(TEST_KEY), previous);
      assert.equal(get(storage, SCAN_KEY).skus[0].id, SOURCE);
    }
    for (const url of [
      "https://one.google.com.evil/ai?x=1", "http://one.google.com/ai?x=1",
      REPORT, REPORT + "?format=json", REPORT + "/", REPORT + "/?format=json"
    ]) {
      const result = run(variant.script, { url, body: SOURCE });
      assert.deepEqual(result.payload, {});
      assert.equal(result.storage.size, 0);
    }
  });

  test("single module saves original candidates before rewriting without recording generated targets", () => {
    const body = JSON.stringify([SOURCE, SOURCE, TWENTY, THIRTY, "com.google.one.fixture"]);
    const result = run(variant.script, { body });
    assert.deepEqual(JSON.parse(result.payload.body), [TARGET, TARGET, TWENTY_TARGET, THIRTY_TARGET, "com.google.one.fixture"]);
    const scan = get(result.storage, SCAN_KEY);
    assert.equal(scan.version, VERSION);
    assert.deepEqual(scan.skus.map(row => row.id), ["com.google.one.fixture", TWENTY, SOURCE, THIRTY]);
    assert.equal(scan.skus.find(row => row.id === SOURCE).count, 2);
    assert.deepEqual(result.writes, [SCAN_KEY, TEST_KEY]);
  });

  test("single-module collection decodes discovery copies and continues mapping when the list is full", () => {
    const escaped = String.raw`g1\u002eios\u002e2tb\u002eescaped`;
    const decoded = run(variant.script, { body: escaped });
    assert.deepEqual(decoded.payload, {});
    assert.equal(get(decoded.storage, SCAN_KEY).skus[0].id, "g1.ios.2tb.escaped");
    const storage = new Map();
    const full = Array.from({ length: 305 }, (_, index) => "g1.fixture." + index).join(" ");
    run(variant.script, { url: "https://one.google.com/plans", body: full, storage });
    const fullEvent = get(storage, SCAN_KEY).recentResponses.at(-1);
    assert.equal(fullEvent.status, "new-skus");
    assert.equal(fullEvent.candidateCount, 305);
    assert.equal(fullEvent.addedCount, 300);
    assert.equal(fullEvent.omittedCount, 5);
    const next = run(variant.script, { body: SOURCE + " g1.fixture.0", storage });
    assert.equal(next.payload.body, TARGET + " g1.fixture.0");
    const scan = get(storage, SCAN_KEY);
    assert.equal(scan.skus.length, 300);
    assert.equal(scan.truncated, true);
    assert.equal(scan.scannedResponses, 2);
    assert.equal(scan.skus.find(row => row.id === "g1.fixture.0").count, 2);
    assert.equal(scan.recentResponses.at(-1).status, "limit-reached");
    assert.equal(scan.recentResponses.at(-1).candidateCount, 2);
    assert.equal(scan.recentResponses.at(-1).addedCount, 0);
    assert.equal(scan.recentResponses.at(-1).omittedCount, 1);
  });

  test("activity distinguishes new IDs, repeated IDs, empty text and nontext responses", () => {
    const storage = new Map();
    const url = "https://one.google.com/plans?token=private-token";
    const body = [SOURCE, SOURCE, OTHER_SOURCE].join(" ");
    run(variant.script, { url, body, storage });
    let scan = get(storage, SCAN_KEY);
    assert.equal(scan.recentResponses[0].status, "new-skus");
    assert.equal(scan.recentResponses[0].candidateCount, 2);
    assert.equal(scan.recentResponses[0].addedCount, 2);
    run(variant.script, { url, body, storage });
    scan = get(storage, SCAN_KEY);
    assert.equal(scan.skus.length, 2);
    assert.equal(scan.skus.find(row => row.id === SOURCE).count, 4);
    assert.equal(scan.scannedResponses, 2);
    assert.equal(scan.matchedResponses, 2);
    assert.equal(scan.recentResponses.at(-1).status, "known-skus");
    assert.equal(scan.recentResponses.at(-1).candidateCount, 2);
    assert.equal(scan.recentResponses.at(-1).addedCount, 0);
    run(variant.script, { url, body: "no product in this response", storage });
    run(variant.script, { url, body: undefined, storage });
    scan = get(storage, SCAN_KEY);
    assert.deepEqual(scan.recentResponses.map(event => event.status), ["new-skus", "known-skus", "no-skus", "non-text"]);
    assert.equal(scan.scannedResponses, 3);
    assert.equal(scan.matchedResponses, 2);
    assert.equal(scan.nonTextResponses, 1);
    assert.equal(scan.skus.length, 2);
    assert.equal(scan.recentResponses.at(-1).bodyType, "non-text");
    assert.equal(scan.recentResponses.at(-1).candidateCount, 0);
    assert.equal(storage.has(TEST_KEY), false, "non-rewrite pages preserve the mapping record");
    assert(!storage.get(SCAN_KEY).includes("private-token"));
    const data = JSON.parse(run(variant.report, { url: REPORT + "?format=json", storage }).payload.response.body);
    assert.deepEqual(data.scan.recentResponses, scan.recentResponses);
    assert.equal(data.scan.nonTextResponses, 1);
    const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
    assert(html.includes("实际采集脚本：<code>" + VERSION + "</code>"));
    assert(html.includes("编号与已有记录重复"));
    assert(html.includes("正文不是可扫描文本"));
  });

  test("recent activity keeps ten arrivals and redacts URLs, extra fields and malformed events", () => {
    const valid = {
      at: "2099-01-01T00:00:00.000Z", path: "/ai", bodyType: "text", status: "no-skus",
      candidateCount: 0, addedCount: 0, omittedCount: 0, body: "private-history-body"
    };
    const storage = new Map([[SCAN_KEY, JSON.stringify({
      schemaVersion: 1, recentResponses: [valid, { ...valid, path: "/private-secret" }, { ...valid, status: "bad-status" }]
    })]]);
    run(variant.script, { url: "https://one.google.com/plans?secret=1", body: SOURCE, storage });
    let scan = get(storage, SCAN_KEY);
    assert.equal(scan.recentResponses.length, 2);
    assert.equal(scan.recentResponses[0].at, valid.at);
    assert.equal(scan.recentResponses.at(-1).path, "/plans", "last received event stays last even after a clock change");
    const paths = ["/", "/ai/", "/plans/", "/_/GoogleOne/account-secret/data/batchexecute", "/account/private@example.test"];
    const expected = ["/", "/ai", "/plans", "/_/…/data/batchexecute", "[其他 one.google.com 路径]"];
    for (let index = 0; index < 14; index++) {
      run(variant.script, { url: "https://one.google.com" + paths[index % 5] + "?secret=query#private-fragment", body: SOURCE, storage });
    }
    scan = get(storage, SCAN_KEY);
    assert.equal(scan.recentResponses.length, 10);
    assert.deepEqual(scan.recentResponses.map(event => event.path), Array.from({ length: 10 }, (_, index) => expected[(index + 4) % 5]));
    assert(scan.recentResponses.every(event => event.status === "known-skus" && event.addedCount === 0));
    for (const forbidden of ["private-history-body", "private-secret", "account-secret", "private@example.test", "query", "private-fragment", "secret="]) {
      assert(!storage.get(SCAN_KEY).includes(forbidden));
    }
  });

  test("old scan records remain old until an actual response creates a new diagnostic event", () => {
    const old = {
      schemaVersion: 1, version: "g1-acq-v7.1", updatedAt: "2026-11-23T07:40:18.464Z",
      scannedResponses: 5, matchedResponses: 1,
      skus: [{ id: SOURCE, count: 4, lastSeen: "2026-11-23T07:40:06.325Z" }]
    };
    const storage = new Map([[SCAN_KEY, JSON.stringify(old)]]);
    const before = storage.get(SCAN_KEY);
    let data = JSON.parse(run(variant.report, { url: REPORT + "?format=json", storage }).payload.response.body);
    assert.equal(data.scan.version, "g1-acq-v7.1");
    assert.deepEqual(data.scan.recentResponses, []);
    assert.equal(data.scan.scannedResponses, 5);
    assert.equal(storage.get(SCAN_KEY), before);
    const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
    assert(html.includes("旧采集记录；尚未保存本版采集响应记录"));
    run(variant.script, { url: "https://one.google.com/plans", body: SOURCE, storage });
    data = JSON.parse(run(variant.report, { url: REPORT + "?format=json", storage }).payload.response.body);
    assert.equal(data.scan.version, VERSION);
    assert.equal(data.scan.scannedResponses, 6);
    assert.equal(data.scan.matchedResponses, 2);
    assert.equal(data.scan.skus.length, 1);
    assert.equal(data.scan.skus[0].count, 5);
    assert.equal(data.scan.recentResponses.length, 1);
    assert.equal(data.scan.recentResponses[0].status, "known-skus");
    assert.equal(data.scan.recentResponses[0].addedCount, 0);
  });

  test("activity export rejects malformed metadata and excludes untrusted extra fields", () => {
    const event = {
      at: "2026-11-23T07:40:06.325Z", path: "/plans", bodyType: "text", status: "known-skus",
      candidateCount: 2, addedCount: 0, omittedCount: 0, body: "private-body", query: "private-token"
    };
    const storage = new Map([[SCAN_KEY, JSON.stringify({
      schemaVersion: 1, version: VERSION,
      recentResponses: [event, { ...event, at: "<script>private</script>" }, { ...event, status: "constructor" }, { ...event, bodyType: "unknown" }]
    })]]);
    const result = run(variant.report, { url: REPORT + "?format=json", storage });
    const data = JSON.parse(result.payload.response.body);
    assert.deepEqual(data.scan.recentResponses, [{
      at: event.at, path: event.path, bodyType: "text", status: "known-skus", candidateCount: 2, addedCount: 0, omittedCount: 0
    }]);
    assert(!result.payload.response.body.includes("private"));
  });

  test("unreadable settings pass through while record-write failure preserves valid default rewriting", () => {
    for (const flags of [{ storageAvailable: false }, { storageThrows: true }, { storageReadThrows: true }]) {
      const result = run(variant.script, { body: SOURCE, ...flags });
      assert.deepEqual(result.payload, {});
      if (flags.storageReadThrows) {
        const record = get(result.storage, TEST_KEY);
        assert.equal(record.status, "config-error");
        assert.equal(record.mappingStatus, "unavailable");
        assert.equal(record.mappingRevision, "unavailable");
        assert.equal(record.mode, "");
        assert.equal(record.hitCount, 0);
        assert.deepEqual(record.matchedFrom, []);
      }
    }
    const writeFailure = run(variant.script, { body: SOURCE, storageWriteFails: true });
    assert.equal(writeFailure.payload.body, TARGET);
  });

  test("test records omit cookies, headers and full response data", () => {
    const result = run(variant.script, { body: JSON.stringify({ sku: SOURCE, email: "private@example.test" }) });
    const saved = result.storage.get(TEST_KEY);
    assert(!saved.includes("private@example.test"));
    assert(!saved.includes("secret"));
    assert.deepEqual(new Set(result.reads), new Set([SCAN_KEY, MAPPING_KEY]));
    assert.equal(result.reads.filter(key => key === MAPPING_KEY).length, 1);
    assert(!result.writes.includes(MAPPING_KEY));
    assert(!result.storage.get(SCAN_KEY).includes("private@example.test"));
    assert(!result.storage.get(SCAN_KEY).includes("secret"));
  });

  test("report displays captured IDs and test sources without external assets", () => {
    const storage = new Map();
    run("g1-sku-scan.js", { body: SOURCE, storage });
    run(variant.script, { body: SOURCE, storage });
    const { payload } = run(variant.report, { url: REPORT, storage });
    assert.equal(payload.response.status, 200);
    assert.match(payload.response.body, /Google One SKU 管理/);
    assert(payload.response.body.includes(SOURCE));
    assert(payload.response.body.includes(TARGET));
    assert(payload.response.body.includes("本机脚本已接管 · v7.11.0"));
    assert.match(payload.response.body, /<button\b[^>]*name=format[^>]*value=json[^>]*>导出 JSON<\/button>/);
    assert(!/<(?:script|img|iframe)\b/i.test(payload.response.body));
    assert.equal(payload.response.headers["Cache-Control"], "no-store");
  });

  test("report export form resolves to a JSON attachment and supports a trailing slash", () => {
    const storage = new Map();
    run(variant.script, { body: SOURCE, storage });
    const html = run(variant.report, { url: REPORT + "/", storage }).payload.response.body;
    const action = html.match(/<form method=get action="([^"]+)"><button type=submit name=format value=json>/);
    assert(action, "the visible export button must submit a GET form");
    const url = new URL(action[1]);
    url.searchParams.set("format", "json");
    assert.equal(url.href, REPORT + "?format=json");
    for (const exportURL of [url.href, REPORT + "/?format=json"]) {
      const result = run(variant.report, { url: exportURL, storage });
      assert.equal(result.payload.response.status, 200);
      assert.equal(result.payload.response.headers["Content-Disposition"], 'attachment; filename="g1-sku-report.json"');
      assert.equal(result.payload.response.headers["X-G1-Report-Version"], "v7.11.0");
      const data = JSON.parse(result.payload.response.body);
      assert.equal(data.reportVersion, "v7.11.0");
      assert.equal(data.configuredTarget, TARGET);
      assert.equal(data.test.target, TARGET);
      assert.equal(data.test.targetOrigin, "user-specified");
      assert.equal(data.scan.skus[0].id, SOURCE);
      assert.equal(data.test.matchedFrom[0].to, TARGET);
      assert(result.logs.some(line => line.includes("[g1-sku-report] v7.11.0 json")));
    }
  });

  test("report exports fixed 75p targets as non-fallback rows and separates annual hits from total hits", () => {
    const storage = new Map();
    run(variant.script, { body: JSON.stringify([SOURCE, TWENTY, THIRTY, ...ULTRA_OFFERS]), storage });
    const result = run(variant.report, { url: REPORT + "?format=json", storage });
    const report = JSON.parse(result.payload.response.body);
    assert.equal(report.reportVersion, REPORT_VERSION);
    assert.equal(report.configuredMode, MODE);
    assert.equal(report.scan.mode, MODE);
    const data = report.test;
    assert.equal(data.version, VERSION);
    assert.equal(data.mode, MODE);
    assert.equal(data.hitCount, 3);
    assert.equal(data.annualHitCount, 1);
    assert.deepEqual(data.matchedFrom, [
      { id: TWENTY, count: 1, to: TWENTY_TARGET, fallback: false },
      { id: SOURCE, count: 1, to: TARGET, fallback: false },
      { id: THIRTY, count: 1, to: THIRTY_TARGET, fallback: false }
    ]);
    const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
    assert.match(html, /最近一次[^<]*映射/);
    assert(html.includes("其中 2TB：1"));
    for (const target of [TARGET, TWENTY_TARGET, THIRTY_TARGET]) {
      assert(html.includes(target + "</code></td><td>否</td>"));
    }
    assertModeText(html, "当前报告入口", MODE_LABELS[MODE]);
    assertModeText(html, "实际采集模式", MODE_LABELS[MODE]);
    assertModeText(html, "实际映射模式", MODE_LABELS[MODE]);
    assert(!html.includes("本版另一入口"));
  });

  test("report preserves historical 75p fallbacks and keeps old 90p defaults distinct", () => {
    const previous = {
      schemaVersion: 1, version: "g1-acq-v7.5", target: TARGET, targetOrigin: "user-specified",
      hitCount: 2, annualHitCount: 0, status: "rewritten",
      matchedFrom: [
        { id: TWENTY, to: LEGACY_TWENTY_FALLBACK, count: 1, fallback: true },
        { id: THIRTY, to: "g1.ai.ultra.3months_ip_90p.acq", count: 1, fallback: false }
      ]
    };
    const before = JSON.stringify(previous);
    const storage = new Map([[TEST_KEY, before]]);
    const result = run(variant.report, { url: REPORT + "?format=json", storage });
    const data = JSON.parse(result.payload.response.body).test;
    assert.equal(data.version, previous.version);
    assert.deepEqual(data.matchedFrom, previous.matchedFrom);
    const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
    assert(html.includes(LEGACY_TWENTY_FALLBACK + "</code></td><td>75p</td>"));
    assert(html.includes("g1.ai.ultra.3months_ip_90p.acq</code></td><td>否</td>"));
    assert.equal(storage.get(TEST_KEY), before);
  });

  test("report does not invent a discount for a fallback whose target was not recorded", () => {
    const storage = new Map([[TEST_KEY, JSON.stringify({
      schemaVersion: 1, version: "g1-acq-v7.5", matchedFrom: [{ id: TWENTY, count: 1, fallback: true }]
    })]]);
    const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
    assert(html.includes("<code>未记录</code></td><td>是</td>"));
  });

  test("new report preserves implicit 2TB targets in v1, v2 and early v7 records", () => {
    for (const version of ["pro-annual-test-v1", "pro-annual-test-v2", "g1-acq-v7", "g1-acq-v7.0", "g1-acq-v7.1"]) {
      const stored = JSON.stringify({
        schemaVersion: 1, version, hitCount: 2, status: "rewritten", matchedFrom: [{ id: SOURCE, count: 2 }]
      });
      const storage = new Map([[TEST_KEY, stored]]);
      const result = run(variant.report, { url: REPORT + "?format=json", storage });
      const data = JSON.parse(result.payload.response.body).test;
      assert.equal(data.version, version);
      assert.equal(data.mode, "");
      assert.equal(data.hitCount, 2);
      assert.equal(data.annualHitCount, 2);
      assert.equal(data.target, LEGACY_TARGET);
      assert.equal(data.targetOrigin, "legacy");
      assert.deepEqual(data.matchedFrom, [{ id: SOURCE, count: 2, to: LEGACY_TARGET, fallback: false }]);
      assert.equal(storage.get(TEST_KEY), stored);
      assert.deepEqual(result.writes, []);
    }
    const storage = new Map([[TEST_KEY, JSON.stringify({
      schemaVersion: 1, version: "pro-annual-test-v1", hitCount: 0, status: "no-match", matchedFrom: []
    })]]);
    const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
    assert(html.includes("旧 v1 记录：本次响应未命中 iOS 2TB 前缀"));
  });

  test("report preserves saved v7.1 through v7.7 targets and origins independently of current configuration", () => {
    for (const prior of [
      { version: "g1-acq-v7.1", target: LEGACY_TARGET, origin: "legacy" },
      { version: "g1-acq-v7.2", target: "g1.2tb.ai.annual.3months_ip_90p.acq", origin: "pattern-derived" },
      { version: "g1-acq-v7.3", target: "g1.2tb.ai.annual_ip_90p.acq", origin: "user-specified" },
      { version: "g1-acq-v7.4", target: "g1.2tb.ai.annual_ip_90p.acq", origin: "user-specified" },
      { version: "g1-acq-v7.5", target: TARGET, origin: "user-specified" },
      { version: "g1-acq-v7.6", target: TARGET, origin: "user-specified" },
      { version: "g1-acq-v7.7-trial", mode: "trial", target: TARGET, origin: "user-specified" },
      { version: "g1-acq-v7.7-discount", mode: "discount", target: TARGET, origin: "user-specified" }
    ]) {
      const record = {
        schemaVersion: 1, version: prior.version, mode: prior.mode, target: prior.target,
        status: "rewritten", hitCount: 9, annualHitCount: 9,
        matchedFrom: [{ id: "g1.ios.2tb.ai.a", to: prior.target, count: 9, fallback: false }]
      };
      if (prior.origin !== "legacy") record.targetOrigin = prior.origin;
      const storage = new Map([[TEST_KEY, JSON.stringify(record)]]);
      const before = storage.get(TEST_KEY);
      const data = JSON.parse(run(variant.report, { url: REPORT + "?format=json", storage }).payload.response.body);
      assert.equal(data.configuredTarget, TARGET);
      assert.equal(data.test.version, prior.version);
      assert.equal(data.test.mode, prior.mode || "");
      assert.equal(data.test.target, prior.target);
      assert.equal(data.test.targetOrigin, prior.origin);
      assert.equal(data.test.matchedFrom[0].to, prior.target);
      assert.equal(storage.get(TEST_KEY), before);
      const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
      assert(html.includes("当前配置的 2TB 前缀目标：<code>" + TARGET + "</code>"));
      assert(html.includes("该次记录的 2TB 目标：<code>" + prior.target + "</code>"));
    }
    const empty = JSON.parse(run(variant.report, { url: REPORT + "?format=json" }).payload.response.body);
    assert.equal(empty.configuredTarget, TARGET);
    assert.equal(empty.test.target, "");
    assert.equal(empty.test.targetOrigin, "");
    assert.equal(empty.test.status, "");
  });

  test("JSON export is limited to report fields and escapes untrusted HTML text", () => {
    const storage = new Map([[SCAN_KEY, JSON.stringify({
      schemaVersion: 1, updatedAt: "<script>fixture</script>", scannedResponses: 1,
      secret: "must-not-export", body: "must-not-export",
      skus: [{ id: SOURCE, count: 2, lastSeen: "<img src=x>", secret: "must-not-export" }]
    })]]);
    const jsonResult = run(variant.report, { url: REPORT + "?format=json", storage });
    assert.match(jsonResult.payload.response.headers["Content-Type"], /application\/json/);
    const report = JSON.parse(jsonResult.payload.response.body);
    assert.equal(report.scan.skus[0].id, SOURCE);
    assert(!jsonResult.payload.response.body.includes("must-not-export"));
    const htmlResult = run(variant.report, { url: REPORT, storage });
    assert(!htmlResult.payload.response.body.includes("<script>fixture"));
    assert(htmlResult.payload.response.body.includes("&lt;img src=x&gt;"));
  });

  test("new collection and mapping timestamps remain UTC in storage, JSON and HTML", () => {
    const result = run(variant.script, { body: SOURCE + " " + TWENTY });
    const scan = get(result.storage, SCAN_KEY);
    const record = get(result.storage, TEST_KEY);
    for (const timestamp of [scan.updatedAt, record.updatedAt, ...scan.skus.map(row => row.lastSeen), ...scan.recentResponses.map(event => event.at)]) {
      assert.match(timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      assert.equal(new Date(timestamp).toISOString(), timestamp);
    }
    assert(scan.skus.every(row => row.lastSeen === scan.updatedAt));
    assert.equal(scan.recentResponses.at(-1).at, scan.updatedAt);
    const data = JSON.parse(run(variant.report, { url: REPORT + "?format=json", storage: result.storage }).payload.response.body);
    assert.equal(data.scan.updatedAt, scan.updatedAt);
    assert.equal(data.test.updatedAt, record.updatedAt);
    assert.deepEqual(data.scan.skus, scan.skus);
    assert.deepEqual(data.scan.recentResponses, scan.recentResponses);
    const html = run(variant.report, { url: REPORT, storage: result.storage }).payload.response.body;
    assert(html.includes("最近保存时间（UTC）：" + scan.updatedAt));
    assert(html.includes("执行时间（UTC）：" + record.updatedAt));
    assert(html.includes("最近发现时间（UTC）"));
  });

  test("report sanitizes missing and malformed saved fields without mutating either record", () => {
    const storage = new Map([
      [SCAN_KEY, JSON.stringify({
        schemaVersion: 1, version: 42, mode: {}, updatedAt: [], scannedResponses: "3.9", matchedResponses: -1,
        nonTextResponses: "invalid", truncated: "true", secret: "must-not-export", recentResponses: [null, {}],
        skus: [null, { id: "invalid-id" }, { id: SOURCE, count: -2, lastSeen: {}, secret: "must-not-export" }]
      })],
      [TEST_KEY, JSON.stringify({
        schemaVersion: 1, version: false, mode: "Discount75", target: "<img src=x>", targetOrigin: [], status: {},
        hitCount: "3.9", annualHitCount: -1, secret: "must-not-export",
        matchedFrom: [null, { id: "invalid-id" },
          { id: TWENTY, to: "invalid-target", count: "2.9", fallback: "true", secret: "must-not-export" },
          { id: SOURCE, to: TARGET, count: 1, fallback: 1 },
          { id: THIRTY, to: THIRTY_TARGET, count: 1 }
        ]
      })]
    ]);
    const before = [...storage];
    const result = run(variant.report, { url: REPORT + "?format=json", storage });
    const data = JSON.parse(result.payload.response.body);
    assert.equal(data.configuredMode, MODE);
    assert.equal(data.scan.version, "");
    assert.equal(data.scan.mode, "");
    assert.equal(data.scan.updatedAt, "");
    assert.equal(data.scan.scannedResponses, 3);
    assert.equal(data.scan.matchedResponses, 0);
    assert.equal(data.scan.nonTextResponses, 0);
    assert.equal(data.scan.truncated, false);
    assert.deepEqual(data.scan.recentResponses, []);
    assert.deepEqual(data.scan.skus, [{ id: SOURCE, count: 0, lastSeen: "" }]);
    assert.equal(data.test.version, "");
    assert.equal(data.test.mode, "");
    assert.equal(data.test.status, "");
    assert.equal(data.test.hitCount, 3);
    assert.equal(data.test.annualHitCount, 0);
    assert.equal(data.test.target, TARGET);
    assert.equal(data.test.targetOrigin, "user-specified");
    assert.deepEqual(data.test.matchedFrom, [
      { id: TWENTY, to: "", count: 2, fallback: false },
      { id: SOURCE, to: TARGET, count: 1, fallback: false },
      { id: THIRTY, to: THIRTY_TARGET, count: 1, fallback: false }
    ]);
    assert(!result.payload.response.body.includes("must-not-export"));
    assert(!result.payload.response.body.includes("<img"));
    assert.deepEqual(result.writes, []);
    assert.deepEqual([...storage], before);
  });

  test("corrupt or mismatched schemas export empty records and recover only on real collection", () => {
    for (const stored of ["corrupt JSON", "null", "[]", JSON.stringify({ schemaVersion: 2, mode: "trial", skus: [{ id: SOURCE, count: 9 }] })]) {
      const storage = new Map([[SCAN_KEY, stored], [TEST_KEY, stored]]);
      const result = run(variant.report, { url: REPORT + "?format=json", storage });
      const data = JSON.parse(result.payload.response.body);
      assert.equal(data.scan.mode, "");
      assert.equal(data.test.mode, "");
      assert.equal(data.scan.scannedResponses, 0);
      assert.equal(data.test.hitCount, 0);
      assert.deepEqual(data.scan.skus, []);
      assert.deepEqual(data.test.matchedFrom, []);
      assert.deepEqual([...storage], [[SCAN_KEY, stored], [TEST_KEY, stored]]);
      run(variant.script, { url: "https://one.google.com/plans", body: SOURCE, storage });
      assert.equal(storage.get(TEST_KEY), stored);
      const scan = get(storage, SCAN_KEY);
      assert.equal(scan.schemaVersion, 1);
      assert.equal(scan.version, VERSION);
      assert.equal(scan.mode, MODE);
      assert.equal(scan.scannedResponses, 1);
      assert.equal(scan.skus[0].count, 1);
      assert.equal(scan.recentResponses.length, 1);
    }
  });

  test("clear action affects only the tool's two storage keys", () => {
    const storage = new Map([
      [SCAN_KEY, JSON.stringify({ schemaVersion: 1, skus: [{ id: SOURCE, count: 1 }] })],
      [TEST_KEY, JSON.stringify({ schemaVersion: 1, hitCount: 1 })],
      ["other-tool", "untouched"]
    ]);
    const result = run(variant.report, { url: REPORT + "?clear=1", storage });
    assert.deepEqual(get(storage, SCAN_KEY), {});
    assert.deepEqual(get(storage, TEST_KEY), {});
    assert.equal(storage.get("other-tool"), "untouched");
    assert.deepEqual(new Set(result.reads), new Set([SCAN_KEY, TEST_KEY, MAPPING_KEY]));
    assert(!result.writes.includes(MAPPING_KEY));
  });

  test("report handles unavailable storage and skips other URL paths", () => {
    const unavailable = run(variant.report, { url: REPORT + "?format=json", storageAvailable: false });
    assert.equal(JSON.parse(unavailable.payload.response.body).storageAvailable, false);
    for (const url of ["https://one.google.com/ai?x=1", REPORT + "-other", "https://example.test/g1-sku-report"]) {
      const result = run(variant.report, { url });
      assert.deepEqual(result.payload, {});
      assert.deepEqual(result.reads, []);
    }
  });

  test("discovery decodes all historical and current offers without changing their original bytes", () => {
    for (const [id, target, offers] of [
      [TWENTY, TWENTY_TARGET, ULTRA_OFFERS.slice(0, 3)],
      [THIRTY, THIRTY_TARGET, ULTRA_OFFERS.slice(3)]
    ]) {
      for (const offer of offers) {
        for (const separator of [String.raw`\u002e`, String.raw`\x2e`, "&#46;", "&#x2e;", "&period;"]) {
          const escaped = offer.replaceAll(".", separator);
          const body = id + " " + escaped;
          const result = run(variant.script, { body });
          assert.equal(result.payload.body, target + " " + escaped);
          assert.deepEqual(get(result.storage, TEST_KEY).matchedFrom, [{ id, to: target, count: 1, fallback: false }]);
          assert.deepEqual(get(result.storage, SCAN_KEY).skus.map(row => row.id), [id, offer].sort());
          assert(!result.logs.some(line => line.includes("fallback=")));
        }
      }
    }
  });

  test("nested price and date fields survive all three fixed mappings byte for byte", () => {
    const body = JSON.stringify({
      products: [
        { sku: TWENTY, price: 330, regularPrice: 3300, currency: "TWD", trialStart: "2026-11-23", regularStart: "2027-02-23" },
        { sku: THIRTY, price: "490.00", regularPrice: "4900.00", currency: "TWD", trialStart: "2026-11-24", regularStart: "2027-02-24" },
        { sku: SOURCE, price: 65, regularPrice: 650, renewAt: "2027-11-23T00:00:00.000Z" }
      ],
      offers: ULTRA_OFFERS,
      invoice: { total: 885, generatedAt: "2026-11-23T00:00:00.000Z", account: "fixture@example.test" }
    }, null, 2);
    const result = run(variant.script, { body });
    assert.equal(result.payload.body, body.replace(TWENTY, TWENTY_TARGET).replace(THIRTY, THIRTY_TARGET).replace(SOURCE, TARGET));
    assert(get(result.storage, TEST_KEY).matchedFrom.every(row => row.fallback === false));
    assert(!result.logs.some(line => line.includes("fallback=")));
    for (const value of result.storage.values()) {
      assert(!value.includes("fixture@example.test"));
      assert(!value.includes("regularPrice"));
      assert(!value.includes("invoice"));
    }
  });

  test("zero-hit and nontext executions retain mode on records and summary logs", () => {
    for (const [body, status, scanStatus] of [["", "no-match", "no-skus"], [undefined, "non-text", "non-text"]]) {
      const result = run(variant.script, { body });
      const scan = get(result.storage, SCAN_KEY);
      const record = get(result.storage, TEST_KEY);
      assert.equal(scan.schemaVersion, 1);
      assert.equal(record.schemaVersion, 1);
      assert.equal(scan.version, VERSION);
      assert.equal(record.version, VERSION);
      assert.equal(scan.mode, MODE);
      assert.equal(record.mode, MODE);
      assert.equal(record.status, status);
      assert.equal(scan.recentResponses.at(-1).status, scanStatus);
      assert.deepEqual(record.matchedFrom, []);
      assert.deepEqual(result.payload, {});
      assert(result.logs.includes("[g1-acq] " + VERSION + " hits=0 annualHits=0 mode=" + MODE));
      assert(result.logs.some(line => line.startsWith("[g1-acq] " + VERSION + " status=" + scanStatus + " ") && line.endsWith(" mode=" + MODE)));
    }
  });

  test("v7.7 fixtures migrate scan first, preserve historical mappings and keep cumulative SKUs and ten FIFO arrivals", () => {
    const other = VARIANTS.find(entry => entry.script !== variant.script);
    for (const oldMode of ["trial", "discount"]) {
      const oldVersion = "g1-acq-v7.7-" + oldMode;
      const recentResponses = Array.from({ length: 10 }, (_, index) => ({
        at: "2099-01-01T00:00:" + String(index).padStart(2, "0") + ".000Z",
        path: index % 2 ? "/plans" : "/ai", bodyType: "text", status: "known-skus",
        candidateCount: 2, addedCount: 0, omittedCount: 0
      }));
      const oldScan = {
        schemaVersion: 1, version: oldVersion, mode: oldMode, updatedAt: recentResponses.at(-1).at,
        scannedResponses: 12, matchedResponses: 11, nonTextResponses: 2, limit: 300, truncated: false,
        recentResponses,
        skus: [
          { id: TWENTY, count: 3, lastSeen: recentResponses.at(-1).at },
          { id: SOURCE, count: 7, lastSeen: recentResponses.at(-1).at },
          { id: THIRTY, count: 2, lastSeen: recentResponses.at(-1).at }
        ]
      };
      const oldTest = {
        schemaVersion: 1, version: oldVersion, mode: oldMode, updatedAt: oldScan.updatedAt,
        target: TARGET, targetOrigin: "user-specified", status: "rewritten", hitCount: 3, annualHitCount: 1,
        matchedFrom: [
          { id: TWENTY, to: oldMode === "trial" ? ULTRA_OFFERS[0] : ULTRA_OFFERS[1], count: 1, fallback: false },
          { id: SOURCE, to: TARGET, count: 1, fallback: false },
          { id: THIRTY, to: oldMode === "trial" ? ULTRA_OFFERS[4] : THIRTY_TARGET, count: 1, fallback: true }
        ]
      };
      const storage = new Map([[SCAN_KEY, JSON.stringify(oldScan)], [TEST_KEY, JSON.stringify(oldTest)]]);
      const previousTest = storage.get(TEST_KEY);
      for (const reportEntry of VARIANTS) {
        const before = [...storage];
        const data = JSON.parse(run(reportEntry.report, { url: REPORT + "?format=json", storage }).payload.response.body);
        assert.equal(data.configuredMode, MODE);
        assert.equal(data.scan.version, oldVersion);
        assert.equal(data.scan.mode, oldMode);
        assert.equal(data.test.version, oldVersion);
        assert.equal(data.test.mode, oldMode);
        assert.deepEqual(data.scan.skus, oldScan.skus);
        assert.deepEqual(data.scan.recentResponses, recentResponses);
        assert.deepEqual(data.test.matchedFrom, oldTest.matchedFrom);
        const html = run(reportEntry.report, { url: REPORT, storage }).payload.response.body;
        assertModeText(html, "当前报告入口", MODE_LABELS[MODE]);
        assertModeText(html, "实际采集模式", MODE_LABELS[oldMode]);
        assertModeText(html, "实际映射模式", MODE_LABELS[oldMode]);
        assert(html.includes("旧采集记录"));
        assert(!html.includes("本版另一入口"));
        const historicalFallback = oldTest.matchedFrom.at(-1);
        assert(html.includes(historicalFallback.to + "</code></td><td>" + (oldMode === "trial" ? "90p" : "75p") + "</td>"));
        assert.deepEqual([...storage], before);
      }
      const collection = run(variant.script, {
        url: "https://one.google.com/plans?fixture=2", body: JSON.stringify([SOURCE, OTHER_SOURCE, THIRTY]), storage
      });
      assert.deepEqual(collection.payload, {});
      assert.deepEqual(collection.writes, [SCAN_KEY]);
      assert.equal(storage.get(TEST_KEY), previousTest);
      const scan = get(storage, SCAN_KEY);
      assert.equal(scan.schemaVersion, 1);
      assert.equal(scan.mode, MODE);
      assert.equal(scan.version, VERSION);
      assert.equal(scan.scannedResponses, 13);
      assert.equal(scan.matchedResponses, 12);
      assert.equal(scan.nonTextResponses, 2);
      assert.equal(scan.limit, 300);
      assert.equal(scan.truncated, false);
      assert.deepEqual(scan.skus.map(row => [row.id, row.count]), [[TWENTY, 3], [OTHER_SOURCE, 1], [SOURCE, 8], [THIRTY, 3]]);
      assert.equal(scan.skus.find(row => row.id === TWENTY).lastSeen, oldScan.updatedAt);
      assert.equal(scan.recentResponses.length, 10);
      assert.deepEqual(scan.recentResponses.slice(0, -1), recentResponses.slice(1));
      assert.equal(scan.recentResponses.at(-1).path, "/plans");
      assert.equal(scan.recentResponses.at(-1).addedCount, 1);
      for (const reportEntry of VARIANTS) {
        const before = [...storage];
        const data = JSON.parse(run(reportEntry.report, { url: REPORT + "?format=json", storage }).payload.response.body);
        assert.equal(data.configuredMode, MODE);
        assert.equal(data.scan.mode, MODE);
        assert.equal(data.scan.version, VERSION);
        assert.equal(data.test.mode, oldMode);
        assert.equal(data.test.version, oldVersion);
        assert.deepEqual(data.test.matchedFrom, oldTest.matchedFrom);
        assert.deepEqual(data.scan.recentResponses, scan.recentResponses);
        const html = run(reportEntry.report, { url: REPORT, storage }).payload.response.body;
        assertModeText(html, "当前报告入口", MODE_LABELS[MODE]);
        assertModeText(html, "实际采集模式", MODE_LABELS[MODE]);
        assertModeText(html, "实际映射模式", MODE_LABELS[oldMode]);
        assert(html.includes("记录来自本版采集脚本"));
        assert(!html.includes("本版另一入口"));
        assert.deepEqual([...storage], before);
      }
      const mapped = run(other.script, { body: JSON.stringify([OTHER_SOURCE, THIRTY]), storage });
      assert.deepEqual(JSON.parse(mapped.payload.body), [TARGET, THIRTY_TARGET]);
      assert.deepEqual(mapped.writes, [SCAN_KEY, TEST_KEY]);
      assert.equal(get(storage, TEST_KEY).mode, MODE);
      assert.equal(get(storage, TEST_KEY).version, VERSION);
      assert.deepEqual(get(storage, TEST_KEY).matchedFrom, [
        { id: OTHER_SOURCE, to: TARGET, count: 1, fallback: false },
        { id: THIRTY, to: THIRTY_TARGET, count: 1, fallback: false }
      ]);
      const finalScan = get(storage, SCAN_KEY);
      assert.equal(finalScan.schemaVersion, 1);
      assert.equal(finalScan.version, VERSION);
      assert.equal(finalScan.mode, MODE);
      assert.equal(finalScan.scannedResponses, 14);
      assert.equal(finalScan.matchedResponses, 13);
      assert.equal(finalScan.nonTextResponses, 2);
      assert.deepEqual(finalScan.skus.map(row => [row.id, row.count]), [[TWENTY, 3], [OTHER_SOURCE, 2], [SOURCE, 8], [THIRTY, 4]]);
      assert.equal(finalScan.recentResponses.length, 10);
      assert.deepEqual(finalScan.recentResponses.slice(0, -1), scan.recentResponses.slice(1));
      assert.equal(finalScan.recentResponses.at(-1).path, "/ai");
      assert.equal(finalScan.recentResponses.at(-1).status, "known-skus");
      assert.deepEqual([...storage.keys()], [SCAN_KEY, TEST_KEY]);
    }
  });

  test("configured discount75 is independent of all sixteen saved scan and test mode pairs", () => {
    const mismatchedVersions = { trial: "g1-acq-v7.7-discount", discount: VERSION, discount75: "g1-acq-v7.7-trial", custom: "g1-acq-v7.8-75p" };
    for (const scanMode of Object.keys(MODE_LABELS)) {
      for (const testMode of Object.keys(MODE_LABELS)) {
        const scanVersion = mismatchedVersions[scanMode];
        const testVersion = mismatchedVersions[testMode];
        const storage = new Map([
          [SCAN_KEY, JSON.stringify({ schemaVersion: 1, version: scanVersion, mode: scanMode, skus: [{ id: SOURCE, count: 4 }] })],
          [TEST_KEY, JSON.stringify({ schemaVersion: 1, version: testVersion, mode: testMode, target: TARGET, matchedFrom: [{ id: SOURCE, to: TARGET, count: 4 }] })]
        ]);
        const before = [...storage];
        const result = run(variant.report, { url: REPORT + "?format=json", storage });
        const data = JSON.parse(result.payload.response.body);
        assert.equal(data.schemaVersion, 1);
        assert.equal(data.reportVersion, REPORT_VERSION);
        assert.equal(data.configuredMode, MODE);
        assert.equal(data.configuredTarget, TARGET);
        assert.equal(data.scan.mode, scanMode);
        assert.equal(data.test.mode, testMode);
        assert.equal(data.scan.version, scanVersion);
        assert.equal(data.test.version, testVersion);
        assert.deepEqual(result.writes, []);
        const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
        assertModeText(html, "当前报告入口", MODE_LABELS[MODE]);
        assertModeText(html, "实际采集模式", MODE_LABELS[scanMode]);
        assertModeText(html, "实际映射模式", MODE_LABELS[testMode]);
        assert(!html.includes("本版另一入口"));
        assert.deepEqual([...storage], before);
      }
    }
  });

  test("fresh reports leave both stored modes unrecorded rather than inferring the entry", () => {
    const storage = new Map();
    const result = run(variant.report, { url: REPORT + "?format=json", storage });
    const data = JSON.parse(result.payload.response.body);
    assert.equal(data.configuredMode, MODE);
    assert.equal(data.scan.mode, "");
    assert.equal(data.test.mode, "");
    const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
    assertModeText(html, "当前报告入口", MODE_LABELS[MODE]);
    assertModeText(html, "实际采集模式", "未记录");
    assertModeText(html, "实际映射模式", "未记录");
    assert.equal(storage.size, 0);
  });

  test("mode sanitization accepts only exact trial, discount, discount75 and custom strings", () => {
    const invalidModes = [
      undefined, null, "", "Trial", "DISCOUNT", "Discount75", " trial", "trial ", "discount\n", "discount\u0000",
      " discount75", "discount75 ", "discount75\n", "discount75\u0000", "75p", "unknown", "constructor", "__proto__",
      "Custom", "CUSTOM", " custom", "custom ", "custom\n", "custom\u0000", ["custom"], { mode: "custom" },
      0, 1, true, false, [], ["trial"], ["discount75"], {}, { mode: "discount75" }, "<img src=x onerror=fixture-mode>"
    ];
    for (const invalid of invalidModes) {
      for (const field of ["scan", "test"]) {
        const storage = new Map([
          [SCAN_KEY, JSON.stringify({ schemaVersion: 1, version: VERSION, mode: field === "scan" ? invalid : "trial" })],
          [TEST_KEY, JSON.stringify({ schemaVersion: 1, version: VERSION, mode: field === "test" ? invalid : "discount" })]
        ]);
        const before = [...storage];
        const result = run(variant.report, { url: REPORT + "?format=json", storage });
        const data = JSON.parse(result.payload.response.body);
        assert.equal(data.configuredMode, MODE);
        assert.equal(data[field].mode, "", field + " mode=" + JSON.stringify(invalid));
        assert.equal(data[field === "scan" ? "test" : "scan"].mode, field === "scan" ? "discount" : "trial");
        const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
        assertModeText(html, "当前报告入口", MODE_LABELS[MODE]);
        assertModeText(html, "实际采集模式", field === "scan" ? "未记录" : MODE_LABELS.trial);
        assertModeText(html, "实际映射模式", field === "test" ? "未记录" : MODE_LABELS.discount);
        assert(!html.includes("fixture-mode"));
        assert(!result.payload.response.body.includes("fixture-mode"));
        assert.deepEqual([...storage], before);
      }
    }
  });

  test("stored modes are never inferred from current or historical version strings", () => {
    for (const version of [VERSION, "g1-acq-v7.7-trial", "g1-acq-v7.7-discount"]) {
      for (const mode of [undefined, "unknown"]) {
        const stored = JSON.stringify({ schemaVersion: 1, version, mode });
        const storage = new Map([[SCAN_KEY, stored], [TEST_KEY, stored]]);
        const before = [...storage];
        const data = JSON.parse(run(variant.report, { url: REPORT + "?format=json", storage }).payload.response.body);
        assert.equal(data.configuredMode, MODE);
        assert.equal(data.scan.version, version);
        assert.equal(data.test.version, version);
        assert.equal(data.scan.mode, "");
        assert.equal(data.test.mode, "");
        const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
        assertModeText(html, "实际采集模式", "未记录");
        assertModeText(html, "实际映射模式", "未记录");
        assert.deepEqual([...storage], before);
      }
    }
  });

  test("only the exact v7.11 mappings collector version is labeled current in either report", () => {
    const oldVersions = [
      "pro-annual-test-v1", "pro-annual-test-v2", "g1-acq-v7", "g1-acq-v7.0", "g1-acq-v7.1",
      "g1-acq-v7.2", "g1-acq-v7.3", "g1-acq-v7.4", "g1-acq-v7.5", "g1-acq-v7.6",
      "g1-acq-v7.7-trial", "g1-acq-v7.7-discount", "g1-acq-v7.8", "g1-acq-v7.8-75p", "g1-acq-v7.8-75p-extra",
      "g1-acq-v7.9-75p", "g1-acq-v7.9-mappings", "g1-acq-v7.9-mappings-extra",
      "g1-acq-v7.10", "g1-acq-v7.10-75p", "g1-acq-v7.10-mappings", "g1-acq-v7.11-mappings-extra"
    ];
    for (const version of [VERSION, ...oldVersions]) {
      const isCurrent = version === VERSION;
      const mode = isCurrent ? "trial" : MODE;
      const storage = new Map([[SCAN_KEY, JSON.stringify({ schemaVersion: 1, version, mode })]]);
      const before = [...storage];
      const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
      assert(html.includes("实际采集脚本：<code>" + version + "</code>"));
      assert.equal(html.includes("记录来自本版采集脚本"), isCurrent);
      assert.equal(html.includes("旧采集记录"), !isCurrent);
      assert(!html.includes("本版另一入口"));
      assertModeText(html, "实际采集模式", MODE_LABELS[mode]);
      const data = JSON.parse(run(variant.report, { url: REPORT + "?format=json", storage }).payload.response.body);
      assert.equal(data.scan.version, version);
      assert.equal(data.scan.mode, mode);
      assert.deepEqual([...storage], before);
    }
  });

  test("v7.6 trial records keep their original versions, absent modes and actual 90p fallback", () => {
    const oldScan = {
      schemaVersion: 1, version: "g1-acq-v7.6", scannedResponses: 4, matchedResponses: 3,
      skus: [{ id: SOURCE, count: 4, lastSeen: "2026-11-23T07:40:06.325Z" }]
    };
    const oldTest = {
      schemaVersion: 1, version: "g1-acq-v7.6", target: TARGET, targetOrigin: "user-specified",
      status: "rewritten", hitCount: 2, annualHitCount: 0,
      matchedFrom: [
        { id: TWENTY, to: "g1.20tb.1month_eft.acq", count: 1, fallback: false },
        { id: THIRTY, to: "g1.ai.ultra.3months_ip_90p.acq", count: 1, fallback: true }
      ]
    };
    const storage = new Map([[SCAN_KEY, JSON.stringify(oldScan)], [TEST_KEY, JSON.stringify(oldTest)]]);
    const before = [...storage];
    const data = JSON.parse(run(variant.report, { url: REPORT + "?format=json", storage }).payload.response.body);
    assert.equal(data.configuredMode, MODE);
    assert.equal(data.scan.version, "g1-acq-v7.6");
    assert.equal(data.test.version, "g1-acq-v7.6");
    assert.equal(data.scan.mode, "");
    assert.equal(data.test.mode, "");
    assert.deepEqual(data.scan.skus, oldScan.skus);
    assert.deepEqual(data.test.matchedFrom, oldTest.matchedFrom);
    const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
    assert(html.includes("旧采集记录"));
    assert(html.includes("g1.20tb.1month_eft.acq</code></td><td>否</td>"));
    assert(html.includes("g1.ai.ultra.3months_ip_90p.acq</code></td><td>90p</td>"));
    assertModeText(html, "当前报告入口", MODE_LABELS[MODE]);
    assertModeText(html, "实际采集模式", "未记录");
    assertModeText(html, "实际映射模式", "未记录");
    assert.deepEqual([...storage], before);
    const collected = run(variant.script, { url: "https://one.google.com/plans", body: SOURCE + " " + OTHER_SOURCE, storage });
    assert.deepEqual(collected.payload, {});
    assert.equal(storage.get(TEST_KEY), before[1][1]);
    const scan = get(storage, SCAN_KEY);
    assert.equal(scan.version, VERSION);
    assert.equal(scan.mode, MODE);
    assert.equal(scan.scannedResponses, 5);
    assert.equal(scan.matchedResponses, 4);
    assert.deepEqual(scan.skus.map(row => [row.id, row.count]), [[OTHER_SOURCE, 1], [SOURCE, 5]]);
    const after = JSON.parse(run(variant.report, { url: REPORT + "?format=json", storage }).payload.response.body);
    assert.equal(after.scan.mode, MODE);
    assert.equal(after.test.mode, "");
    assert.equal(after.test.version, "g1-acq-v7.6");
    assert.deepEqual(after.test.matchedFrom, oldTest.matchedFrom);
  });

  test("both historical 75p Ultra targets retain their actual fallback labels in either report", () => {
    const rows = [
      { id: TWENTY, to: LEGACY_TWENTY_FALLBACK, count: 1, fallback: true },
      { id: THIRTY, to: LEGACY_THIRTY_FALLBACK, count: 2, fallback: true }
    ];
    const storage = new Map([[TEST_KEY, JSON.stringify({ schemaVersion: 1, version: "g1-acq-v7.5", matchedFrom: rows })]]);
    const before = [...storage];
    const data = JSON.parse(run(variant.report, { url: REPORT + "?format=json", storage }).payload.response.body);
    assert.equal(data.test.mode, "");
    assert.equal(data.test.version, "g1-acq-v7.5");
    assert.deepEqual(data.test.matchedFrom, rows);
    const html = run(variant.report, { url: REPORT, storage }).payload.response.body;
    for (const row of rows) assert(html.includes(row.to + "</code></td><td>75p</td>"));
    assert.deepEqual([...storage], before);
  });

}

nodeTest("collector discovers IDs and escaped dots while preserving the response", () => {
  const body = JSON.stringify([
    SOURCE, SOURCE, TARGET, "com.google.one.2tb.fixture.iog", "private@example.test"
  ]) + String.raw` "g1\u002eios\u002e2tb\u002eescaped" "g1&#46;2tb&#46;html"`;
  const result = run("g1-sku-scan.js", { body });
  assert.deepEqual(result.payload, {});
  const state = get(result.storage, SCAN_KEY);
  assert.equal(state.schemaVersion, 1);
  assert.equal(state.version, "pro-annual-test-v2");
  assert.equal(state.mode, undefined);
  assert.equal(state.scannedResponses, 1);
  assert.equal(state.matchedResponses, 1);
  assert.equal(state.skus.length, 5);
  assert.equal(state.skus.find(row => row.id === SOURCE).count, 2);
  assert(state.skus.some(row => row.id === "g1.ios.2tb.escaped"));
  assert(state.skus.some(row => row.id === "g1.2tb.html"));
  assert(!JSON.stringify(state).includes("private@example.test"));
  assert(!JSON.stringify(state).includes("secret"));
});

nodeTest("collector accumulates prior records and recovers corrupt storage", () => {
  const storage = new Map([[SCAN_KEY, "corrupt JSON"]]);
  run("g1-sku-scan.js", { body: SOURCE, storage });
  run("g1-sku-scan.js", { url: "https://one.google.com/plans", body: SOURCE + " " + TARGET, storage });
  const state = get(storage, SCAN_KEY);
  assert.equal(state.scannedResponses, 2);
  assert.equal(state.skus.length, 2);
  assert.equal(state.skus.find(row => row.id === SOURCE).count, 2);
});

nodeTest("collector bounds stored candidates at 300 and still counts existing IDs", () => {
  const body = Array.from({ length: 305 }, (_, index) => "g1.fixture." + index).join(" ");
  const result = run("g1-sku-scan.js", { body });
  assert.equal(get(result.storage, SCAN_KEY).skus.length, 300);
  assert.equal(get(result.storage, SCAN_KEY).truncated, true);
  run("g1-sku-scan.js", { body: "g1.fixture.0", storage: result.storage });
  assert.equal(get(result.storage, SCAN_KEY).skus.find(row => row.id === "g1.fixture.0").count, 2);
});

nodeTest("collector skips the local report, other domains and nontext bodies", () => {
  for (const options of [
    { url: REPORT, body: SOURCE },
    { url: REPORT + "?format=json", body: SOURCE },
    { url: REPORT + "/", body: SOURCE },
    { url: REPORT + "/?format=json", body: SOURCE },
    { url: "https://one.google.com.evil/ai?x=1", body: SOURCE },
    { body: undefined }, { body: new Uint8Array([1, 2]) }
  ]) {
    const result = run("g1-sku-scan.js", options);
    assert.deepEqual(result.payload, {});
    assert.equal(result.storage.size, 0);
  }
});

nodeTest("collector passes through on storage failure", () => {
  const result = run("g1-sku-scan.js", { body: SOURCE, storageThrows: true });
  assert.deepEqual(result.payload, {});
  assert(result.logs.some(line => line.includes("saved=no")));
});

nodeTest("exactly four modules pin v7.11.0 and pair the retained entries with their reports", () => {
  assert.equal(fs.existsSync(path.join(root, "g1-acq.sgmodule")), false);
  assert.equal(fs.existsSync(path.join(root, "g1-acq-ultra-trial.sgmodule")), false);
  const scriptBase = "https://cdn.jsdelivr.net/gh/crhywun/g1-acq@v7.11.0/";
  const modules = [
    { file: "g1-acq-ultra-discount.sgmodule", name: "G1 ACQ SKU 管理", script: "g1-acq-discount.js", report: "g1-sku-report-discount.js", allPaths: true },
    { file: "g1-acq-v7.sgmodule", name: "G1 ACQ", script: "g1-acq.js", report: "g1-sku-report.js", allPaths: true },
    { file: "g1-pro-annual-test.sgmodule", name: "G1 Pro Annual Test", script: "g1-acq.js", report: "g1-sku-report.js", allPaths: false },
    { file: "g1-sku-scan.sgmodule", name: "G1 SKU Scan", script: "g1-sku-scan.js", report: "g1-sku-report.js", allPaths: true }
  ];
  assert.deepEqual(fs.readdirSync(root).filter(file => file.endsWith(".sgmodule")).sort(), modules.map(entry => entry.file).sort());
  for (const entry of modules) {
    const module = fs.readFileSync(path.join(root, entry.file), "utf8");
    const scripts = module.split("\n").filter(line => line.includes("script-path="));
    assert.equal(scripts.length, 2, entry.file);
    if (entry.name) assert(module.split(/\r?\n/).includes("#!name=" + entry.name), entry.file);
    for (const script of scripts) {
      const url = script.match(/script-path=([^,\s]+)/)[1];
      assert.match(url, /^https:\/\/cdn\.jsdelivr\.net\/gh\/crhywun\/g1-acq@v7\.11\.0\/[a-z0-9.-]+\.js$/);
      assert.equal(url.slice(0, url.lastIndexOf("/") + 1), scriptBase);
      assert(fs.existsSync(path.join(root, url.split("/").at(-1))));
    }
    assert.match(module, /hostname = %APPEND% one\.google\.com/);
    assert(module.split(/\r?\n/).includes("AND,((PROTOCOL,UDP),(DEST-PORT,443)),REJECT-NO-DROP"), entry.file);
    const responseLines = scripts.filter(line => line.includes("type=http-response"));
    const requestLines = scripts.filter(line => line.includes("type=http-request"));
    assert.equal(responseLines.length, 1, entry.file);
    assert.equal(requestLines.length, 1, entry.file);
    const responseLine = responseLines[0];
    const requestLine = requestLines[0];
    assert.equal(responseLine.match(/script-path=([^,\s]+)/)[1], scriptBase + entry.script, entry.file);
    assert.equal(requestLine.match(/script-path=([^,\s]+)/)[1], scriptBase + entry.report, entry.file);
    assert.match(responseLine, /(?:^|,)requires-body=1(?:,|$)/);
    assert.match(responseLine, /(?:^|,)max-size=0(?:,|$)/);
    assert.match(requestLine, /(?:^|,)requires-body=1(?:,|$)/);
    assert.match(requestLine, /(?:^|,)max-size=0(?:,|$)/);
    const pattern = new RegExp(responseLine.match(/pattern=([^,]+)/)[1]);
    assert(pattern.test("https://one.google.com/ai?x=1"), entry.file);
    for (const url of ["https://one.google.com/", "https://one.google.com/plans", "https://one.google.com/ai", "https://one.google.com/ai/other?x=1", "https://one.google.com/_/fixture/data/batchexecute"]) {
      assert.equal(pattern.test(url), entry.allPaths, entry.file + " " + url);
    }
    for (const url of ["https://one.google.com.evil/ai?x=1", "http://one.google.com/ai?x=1", "https://example.test/ai?x=1"]) {
      assert(!pattern.test(url), entry.file + " " + url);
    }
    const reportPattern = new RegExp(requestLine.match(/pattern=([^,]+)/)[1]);
    for (const url of [REPORT, REPORT + "?format=json", REPORT + "/", REPORT + "/?format=json"]) {
      assert(reportPattern.test(url), entry.file + " " + url);
    }
    for (const url of [REPORT + "-other", REPORT + "/other", "https://one.google.com.evil/g1-sku-report", "http://one.google.com/g1-sku-report"]) {
      assert(!reportPattern.test(url), entry.file + " " + url);
    }
  }
});
