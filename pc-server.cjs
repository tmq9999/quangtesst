"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { exec } = require("node:child_process");
const vm = require("node:vm");

const PORT = Number(process.env.PORT || 8787);
const HOST = "0.0.0.0";
const LAN_IP = "192.168.1.71";
const ROOT_DIR = __dirname;
const REMOTE_CONFIG_PATH = path.join(ROOT_DIR, "remote-config.json");
const TELEMETRY_CACHE_PATH = path.join(ROOT_DIR, "pc-telemetry-cache.json");
const DASHBOARD_HTML_PATH = path.join(ROOT_DIR, "pc-dashboard.html");
const LIB_CONFIG_PATH = path.join(ROOT_DIR, "lib", "mapping-config.js");

function loadEngine() {
  const code = fs.readFileSync(LIB_CONFIG_PATH, "utf8");
  const ctx = {};
  vm.runInNewContext(code + "; this.createG1MappingConfig = createG1MappingConfig;", ctx);
  return ctx.createG1MappingConfig(null);
}

function randomHex(len) {
  let out = "";
  for (let i = 0; i < len; i++) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}

function readRemoteConfig() {
  try {
    const raw = fs.readFileSync(REMOTE_CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.rules)) return parsed;
  } catch (e) {}
  const eng = loadEngine();
  return {
    schemaVersion: 1,
    revision: randomHex(48),
    updatedAt: new Date().toISOString(),
    activePresetId: "pro-1yuan-20tb",
    customized: true,
    rules: eng.defaults()
  };
}

let currentConfig = readRemoteConfig();

let telemetryLogs = [];
let cumulativeSkus = Object.create(null);
let recentScanEvents = [];
let runtimeSummary = {
  lastSeenAt: "",
  lastClientIp: "",
  version: "g1-acq-v7.13-mappings",
  mode: "custom",
  mappingStatus: "custom",
  mappingRevision: currentConfig.revision,
  configSource: "pc-lan",
  runtimeStatus: "waiting",
  totalPackets: 0,
  totalRewrites: 0,
  totalAnnualRewrites: 0
};

function saveTelemetryCache() {
  try {
    fs.writeFileSync(TELEMETRY_CACHE_PATH, JSON.stringify({
      runtimeSummary,
      cumulativeSkus,
      recentScanEvents,
      telemetryLogs
    }, null, 2), "utf8");
  } catch (e) {}
}

function loadTelemetryCache() {
  try {
    if (fs.existsSync(TELEMETRY_CACHE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(TELEMETRY_CACHE_PATH, "utf8"));
      if (parsed && Array.isArray(parsed.telemetryLogs) && parsed.telemetryLogs.length > 0) {
        telemetryLogs = parsed.telemetryLogs;
        cumulativeSkus = parsed.cumulativeSkus || Object.create(null);
        recentScanEvents = Array.isArray(parsed.recentScanEvents) ? parsed.recentScanEvents : [];
        runtimeSummary = Object.assign(runtimeSummary, parsed.runtimeSummary || {});
        return;
      }
    }
  } catch (e) {}

  const seedPackets = [
    {
      at: "2026-11-27T00:14:23.981Z",
      clientIp: "192.168.1.164",
      url: "https://one.google.com/ai?utm_campaign=CALENDAR_MANAGE_STORAGE&utm_source=calendar&utm_medium=ios&hide_ogb=true&dm=1&hl=vi&g1_landing_page=21",
      configSource: "pc-lan",
      hitCount: 16,
      matchedFrom: [{ id: "g1.ios.20tb.m.v2", to: "com.google.gemini.2tb.ai.m.3month_ip_99p", count: 16, fallback: false }]
    },
    {
      at: "2026-11-27T00:15:47.157Z",
      clientIp: "192.168.1.164",
      url: "https://one.google.com/ai?utm_source=google_one&utm_medium=ios&hide_ogb=true&dm=1&hl=vi&g1_landing_page=20",
      configSource: "pc-lan",
      hitCount: 16,
      matchedFrom: [{ id: "g1.ios.20tb.m.v2", to: "com.google.gemini.2tb.ai.m.3month_ip_99p", count: 16, fallback: false }]
    },
    {
      at: "2026-11-27T00:16:31.410Z",
      clientIp: "192.168.1.164",
      url: "https://one.google.com/ai?utm_source=google_one&utm_medium=ios&hide_ogb=true&dm=1&hl=vi&g1_landing_page=20",
      configSource: "pc-lan",
      hitCount: 16,
      matchedFrom: [{ id: "g1.ios.20tb.m.v2", to: "com.google.gemini.2tb.ai.m.3month_ip_99p", count: 16, fallback: false }]
    }
  ];
  seedPackets.forEach(p => recordTelemetryPacket(p, p.clientIp, p.at));
}

let gitSyncStatus = {
  state: "ok",
  lastSyncAt: currentConfig.updatedAt,
  message: "LAN (0ms) + GitHub Cloud: Đã đồng bộ"
};

function recordTelemetryPacket(body, clientIp, customTimestamp) {
  const now = customTimestamp || new Date().toISOString();
  const hitCount = Number(body.hitCount || 0);
  const matchedFrom = Array.isArray(body.matchedFrom) ? body.matchedFrom : [];
  let foundSkus = Array.isArray(body.foundSkus) ? body.foundSkus.slice() : [];
  const allStoredSkus = Array.isArray(body.allStoredSkus) ? body.allStoredSkus : [];
  const incomingRecent = Array.isArray(body.recentResponses) ? body.recentResponses : [];
  const logs = Array.isArray(body.logs) ? body.logs : [];
  const url = String(body.url || "https://one.google.com/ai");
  const source = String(body.configSource || "pc-lan");
  const version = String(body.version || "g1-acq-v7.13-mappings");
  const mode = String(body.mode || "custom");
  const mappingStatus = String(body.mappingStatus || "custom");
  const mappingRevision = String(body.mappingRevision || currentConfig.revision);
  const runtimeStatus = String(body.runtimeStatus || (hitCount > 0 ? "rewritten" : "no-match"));

  const foundMap = Object.create(null);
  foundSkus.forEach(item => {
    if (item && typeof item.id === "string") {
      foundMap[item.id] = Number(item.count || 1);
    }
  });
  matchedFrom.forEach(m => {
    if (m && typeof m.id === "string" && !foundMap[m.id]) {
      foundMap[m.id] = Number(m.count || 1);
      foundSkus.push({ id: m.id, count: Number(m.count || 1), fromRewrite: true });
    }
  });

  const annualHitCount = typeof body.annualHitCount === "number" && body.annualHitCount > 0
    ? Number(body.annualHitCount)
    : matchedFrom.reduce((acc, m) => acc + ((m.id && (m.id.indexOf("g1.ios.2tb.") === 0 || m.id.indexOf("g1.ios.ai.2tb.") === 0)) ? Number(m.count || 0) : 0), 0);

  allStoredSkus.forEach(item => {
    if (!item || typeof item.id !== "string") return;
    const c = Number(item.count || 1);
    if (!cumulativeSkus[item.id] || c > cumulativeSkus[item.id].count) {
      cumulativeSkus[item.id] = {
        id: item.id,
        count: c,
        lastSeen: item.lastSeen || now
      };
    }
  });

  foundSkus.forEach(item => {
    if (!item || typeof item.id !== "string") return;
    const c = Number(item.count || 1);
    if (!cumulativeSkus[item.id]) {
      cumulativeSkus[item.id] = { id: item.id, count: 0, lastSeen: now };
    }
    if (!allStoredSkus.length) {
      cumulativeSkus[item.id].count += c;
    }
    cumulativeSkus[item.id].lastSeen = now;
  });

  if (incomingRecent.length) {
    recentScanEvents = incomingRecent;
  } else {
    recentScanEvents.push({
      at: now,
      path: url.replace(/^https:\/\/one\.google\.com/, "").split(/[?#]/)[0] || "/ai",
      bodyType: "text",
      status: foundSkus.length > 0 ? "known-skus" : "no-skus",
      candidateCount: foundSkus.length,
      hitCount: hitCount
    });
    if (recentScanEvents.length > 30) recentScanEvents = recentScanEvents.slice(-30);
  }

  runtimeSummary.lastSeenAt = now;
  runtimeSummary.lastClientIp = clientIp;
  runtimeSummary.version = version;
  runtimeSummary.mode = mode;
  runtimeSummary.mappingStatus = mappingStatus;
  runtimeSummary.mappingRevision = mappingRevision;
  runtimeSummary.configSource = source;
  runtimeSummary.runtimeStatus = runtimeStatus;
  runtimeSummary.totalPackets += 1;
  runtimeSummary.totalRewrites += hitCount;
  runtimeSummary.totalAnnualRewrites += annualHitCount;

  const generatedLogs = logs.length ? logs : [
    `[g1-acq] ${version} source=${source} status=${runtimeStatus} hits=${hitCount} annual2TB=${annualHitCount} mode=${mode} rev=${mappingRevision.slice(0, 10)}`,
    `[g1-acq] URL ${url}`,
    ...matchedFrom.map(m => `[g1-acq] REWRITE ${m.id} ━━► ${m.to} (x${m.count} lần)`),
    ...foundSkus.map(s => `[g1-acq] ORIGINAL_SKU ${s.id} (x${s.count} lần trong gói)`)
  ];

  const entry = {
    id: "pkt-" + Date.now() + "-" + randomHex(4),
    at: now,
    clientIp: clientIp,
    url: url,
    version: version,
    mode: mode,
    mappingStatus: mappingStatus,
    mappingRevision: mappingRevision,
    runtimeStatus: runtimeStatus,
    scanStatus: foundSkus.length > 0 ? "known-skus" : "no-skus",
    source: source,
    hitCount: hitCount,
    annualHitCount: annualHitCount,
    matchedFrom: matchedFrom,
    foundSkus: foundSkus,
    hasFullScanPayload: Array.isArray(body.foundSkus) && body.foundSkus.length > 0,
    logs: generatedLogs
  };

  telemetryLogs.push(entry);
  if (telemetryLogs.length > 150) telemetryLogs = telemetryLogs.slice(-150);
  saveTelemetryCache();
  return entry;
}

loadTelemetryCache();

function saveAndSyncConfig(newRules, presetId = "") {
  const eng = loadEngine();
  const normalized = newRules.map((r, idx) => ({
    id: (typeof r.id === "string" && /^[a-z][a-z0-9-]{0,39}$/.test(r.id)) ? r.id : ("rule-pc-" + idx + "-" + randomHex(8)),
    match: r.match === "prefix" ? "prefix" : "exact",
    from: String(r.from || "").trim(),
    to: String(r.to || "").trim(),
    enabled: Boolean(r.enabled)
  }));
  const checked = eng.validateRules(normalized);
  if (!checked.ok) {
    return { ok: false, error: checked.error };
  }
  currentConfig = {
    schemaVersion: 1,
    revision: randomHex(48),
    updatedAt: new Date().toISOString(),
    activePresetId: presetId,
    customized: true,
    rules: checked.rules
  };
  fs.writeFileSync(REMOTE_CONFIG_PATH, JSON.stringify(currentConfig, null, 2) + "\n", "utf8");
  triggerGitPush();
  return { ok: true, config: currentConfig };
}

let gitBusy = false;
let gitPending = false;
function triggerGitPush() {
  if (gitBusy) {
    gitPending = true;
    return;
  }
  gitBusy = true;
  gitSyncStatus = {
    state: "syncing",
    lastSyncAt: new Date().toISOString(),
    message: "Đang đẩy cấu hình lên GitHub Cloud..."
  };
  const cmd = 'git add remote-config.json && git commit -m "PC Web UI live config update" && git push origin main';
  exec(cmd, { cwd: ROOT_DIR }, (err, stdout, stderr) => {
    gitBusy = false;
    if (err && !/nothing to commit/i.test(String(stdout) + String(stderr))) {
      gitSyncStatus = {
        state: "warning",
        lastSyncAt: new Date().toISOString(),
        message: "Đã lưu LAN tức thời (Git push: " + (stderr || err.message).slice(0, 70) + ")"
      };
    } else {
      gitSyncStatus = {
        state: "ok",
        lastSyncAt: new Date().toISOString(),
        message: "LAN (0ms) + GitHub Cloud: Đã đồng bộ"
      };
    }
    if (gitPending) {
      gitPending = false;
      triggerGitPush();
    }
  });
}

function sendJson(res, code, data) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (data.length > 500000) reject(new Error("Payload too large"));
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }
  const parsedUrl = new URL(req.url, "http://localhost:" + PORT);
  const pathname = parsedUrl.pathname;

  if (pathname === "/api/config" && req.method === "GET") {
    sendJson(res, 200, currentConfig);
    return;
  }

  if (pathname === "/api/state" && req.method === "GET") {
    const eng = loadEngine();
    const skuCatalog = Object.keys(cumulativeSkus)
      .sort()
      .map(id => cumulativeSkus[id]);
    sendJson(res, 200, {
      config: currentConfig,
      presets: eng.presets(),
      gitSyncStatus,
      runtimeSummary,
      skuCatalog,
      recentScanEvents: recentScanEvents.slice(-20).reverse(),
      telemetry: telemetryLogs.slice(-80).reverse(),
      lanUrl: "http://" + LAN_IP + ":" + PORT,
      localUrl: "http://localhost:" + PORT
    });
    return;
  }

  if (pathname === "/api/preset" && req.method === "POST") {
    try {
      const body = JSON.parse(await readBody(req));
      const eng = loadEngine();
      const preset = eng.presets().find(p => p.id === body.presetId);
      if (!preset) {
        sendJson(res, 400, { ok: false, error: "Không tìm thấy mẫu preset: " + body.presetId });
        return;
      }
      const baseRules = preset.replaceAll ? [] : currentConfig.rules.slice();
      const mapBySource = new Map();
      baseRules.forEach(r => mapBySource.set(r.match + ":" + r.from, r));
      preset.rules.forEach(r => {
        mapBySource.set(r.match + ":" + r.from, {
          id: "rule-" + randomHex(12),
          match: r.match,
          from: r.from,
          to: r.to,
          enabled: true
        });
      });
      const result = saveAndSyncConfig(Array.from(mapBySource.values()), preset.id);
      sendJson(res, result.ok ? 200 : 400, result);
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message });
    }
    return;
  }

  if (pathname === "/api/rules" && req.method === "POST") {
    try {
      const body = JSON.parse(await readBody(req));
      if (!Array.isArray(body.rules)) {
        sendJson(res, 400, { ok: false, error: "Danh sách rules không hợp lệ" });
        return;
      }
      const result = saveAndSyncConfig(body.rules, "custom");
      sendJson(res, result.ok ? 200 : 400, result);
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message });
    }
    return;
  }

  if (pathname === "/api/telemetry" && req.method === "POST") {
    try {
      const body = JSON.parse(await readBody(req));
      const clientIp = (req.socket.remoteAddress || "").replace(/^::ffff:/, "");
      recordTelemetryPacket(body, clientIp);
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message });
    }
    return;
  }

  if (pathname === "/api/telemetry/simulate" && req.method === "POST") {
    try {
      const eng = loadEngine();
      const sampleOriginalSkus = [
        { id: "g1.ios.20tb.m.v2", count: 16 },
        { id: "g1.ios.30tb.ai.pro.m", count: 16 },
        { id: "g1.ios.2tb.ai.m", count: 8 },
        { id: "g1.ios.ai.2tb.m.ip_3mo_75p.acq", count: 4 },
        { id: "g1.ios.2tb.ai.a", count: 8 },
        { id: "g1.ios.2tb.m", count: 4 },
        { id: "g1.ios.100gb.m", count: 4 }
      ];
      const activeState = {
        status: "custom",
        rules: currentConfig.rules || []
      };
      const matchedMap = Object.create(null);
      let hits = 0;
      let annualHits = 0;
      sampleOriginalSkus.forEach(s => {
        const rule = eng.resolve(s.id, activeState);
        if (rule) {
          matchedMap[s.id] = { id: s.id, to: rule.to, count: s.count, fallback: false };
          hits += s.count;
          if (s.id.indexOf("g1.ios.2tb.") === 0 || s.id.indexOf("g1.ios.ai.2tb.") === 0) {
            annualHits += s.count;
          }
        }
      });
      const matchedFrom = Object.keys(matchedMap).map(k => matchedMap[k]);
      recordTelemetryPacket({
        url: "https://one.google.com/ai?utm_source=google_one&utm_medium=ios&hl=vi",
        version: "g1-acq-v7.13-mappings",
        mode: "custom",
        mappingStatus: "custom",
        mappingRevision: currentConfig.revision,
        runtimeStatus: hits > 0 ? "rewritten" : "no-match",
        configSource: "pc-lan",
        hitCount: hits,
        annualHitCount: annualHits,
        matchedFrom: matchedFrom,
        foundSkus: sampleOriginalSkus,
        scanStatus: "known-skus"
      }, "192.168.1.164 (Test)");
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message });
    }
    return;
  }

  if (pathname === "/api/telemetry/clear" && req.method === "POST") {
    telemetryLogs = [];
    cumulativeSkus = Object.create(null);
    recentScanEvents = [];
    runtimeSummary.totalPackets = 0;
    runtimeSummary.totalRewrites = 0;
    runtimeSummary.totalAnnualRewrites = 0;
    runtimeSummary.runtimeStatus = "cleared";
    saveTelemetryCache();
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === "/" && req.method === "GET") {
    const html = fs.readFileSync(DASHBOARD_HTML_PATH, "utf8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(html);
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, HOST, () => {
  console.log("[G1-PC-Server] Running at http://localhost:" + PORT + " and http://" + LAN_IP + ":" + PORT);
});
