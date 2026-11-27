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

// Persistent Telemetry & SKU Store (survives server restarts!)
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
      if (parsed && Array.isArray(parsed.telemetryLogs)) {
        telemetryLogs = parsed.telemetryLogs;
        cumulativeSkus = parsed.cumulativeSkus || Object.create(null);
        recentScanEvents = Array.isArray(parsed.recentScanEvents) ? parsed.recentScanEvents : [];
        runtimeSummary = Object.assign(runtimeSummary, parsed.runtimeSummary || {});
        return;
      }
    }
  } catch (e) {}

  // Seed with the 3 real iPhone packets captured from 192.168.1.164 so nothing is blank
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

  // Ensure matchedFrom SKUs are ALWAYS included in foundSkus even if the iPhone is running an older cached script!
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

  // Merge allStoredSkus from iPhone's $persistentStore if provided
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

  // Accumulate foundSkus (including matchedFrom fallback) into cumulativeSkus
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

  // 1. iPhone & PC config endpoint
  if (pathname === "/api/config" && req.method === "GET") {
    sendJson(res, 200, currentConfig);
    return;
  }

  // 2. Full state endpoint for PC Web UI
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

  // 3. Apply preset from PC Web UI
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

  // 4. Save custom rules from PC Web UI
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

  // 5. Receive live telemetry from iPhone Shadowrocket
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

  // 6. Simulate a realistic telemetry packet for testing UI / rules
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

  // 7. Clear telemetry logs
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

  // 8. Serve PC Web Dashboard HTML
  if (pathname === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(DASHBOARD_HTML);
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

const DASHBOARD_HTML = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>G1 ACQ Control Center v7.13.0 — Bảng Điều Khiển & Nhật Ký Bắt Gói Realtime</title>
  <style>
    :root {
      --bg: #070b14;
      --bg-elev: #0f172a;
      --panel: #131c31;
      --border: #263554;
      --border-bright: #3b5280;
      --text: #f8fafc;
      --muted: #94a3b8;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --cyan: #38bdf8;
      --success: #10b981;
      --success-bg: rgba(16, 185, 129, 0.14);
      --warn: #f59e0b;
      --warn-bg: rgba(245, 158, 11, 0.14);
      --danger: #ef4444;
      --danger-bg: rgba(239, 68, 68, 0.15);
      --mono: "JetBrains Mono", "Cascadia Code", ui-monospace, SFMono-Regular, Consolas, monospace;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font: 14.5px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
      background: radial-gradient(circle at top right, #111d38 0%, var(--bg) 55%);
      color: var(--text);
      min-height: 100vh;
      padding: 12px 18px 32px;
    }
    .container { max-width: 1680px; margin: 0 auto; }

    /* Compact Top Header + Tabs so main content sits right above the fold */
    header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      background: linear-gradient(135deg, #131e36 0%, #0e1628 100%);
      border: 1px solid var(--border);
      border-radius: 13px;
      padding: 12px 18px;
      margin-bottom: 12px;
    }
    .brand-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      font-size: 19px;
      font-weight: 800;
    }
    .brand-badge {
      font-size: 11.5px;
      font-weight: 700;
      padding: 2px 9px;
      border-radius: 999px;
      background: rgba(56, 189, 248, 0.16);
      color: var(--cyan);
      border: 1px solid rgba(56, 189, 248, 0.35);
    }
    .status-bar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .pill {
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 12.5px;
      font-weight: 600;
      background: var(--bg-elev);
      border: 1px solid var(--border);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .pill.ok { border-color: var(--success); color: #34d399; background: var(--success-bg); }
    .pill.sync { border-color: var(--warn); color: #fbbf24; background: var(--warn-bg); }
    .dot-live {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 8px var(--success);
      animation: pulse 1.6s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.45; transform: scale(1.2); }
    }

    /* Main Navigation Tabs */
    .tabs-bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      background: var(--bg-elev);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 6px;
      margin-bottom: 14px;
    }
    @media (max-width: 860px) { .tabs-bar { grid-template-columns: 1fr; } }
    .tab-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      padding: 11px 16px;
      border-radius: 9px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--muted);
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .tab-btn:hover { background: rgba(59, 130, 246, 0.08); color: var(--text); }
    .tab-btn.active {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff;
      border-color: #60a5fa;
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);
    }
    .tab-counter {
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11.5px;
      font-weight: 800;
      background: rgba(15, 23, 42, 0.55);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.35);
    }
    .tab-btn.active .tab-counter {
      background: #ffffff;
      color: #1e3a8a;
      border-color: #ffffff;
    }

    .tab-panel { display: none; }
    .tab-panel.active { display: block; }

    /* KPI Strip */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 14px;
    }
    @media (max-width: 1180px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    .kpi-card {
      background: linear-gradient(145deg, #15223c 0%, #0f172a 100%);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .kpi-label { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); }
    .kpi-value { font-size: 21px; font-weight: 800; color: var(--text); font-family: var(--mono); }
    .kpi-sub { font-size: 12.5px; color: var(--muted); }

    /* 2-Column Main Runtime Workspace (Visible Above the Fold on 1080p!) */
    .runtime-workspace {
      display: grid;
      grid-template-columns: 1.28fr 1fr;
      gap: 16px;
      align-items: start;
    }
    @media (max-width: 1150px) { .runtime-workspace { grid-template-columns: 1fr; } }

    .panel-box {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px 18px;
      margin-bottom: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    }
    .panel-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border);
    }
    .panel-title { margin: 0; font-size: 16.5px; font-weight: 800; display: flex; align-items: center; gap: 8px; }

    /* Tables for Original SKUs & Runtime Scan History */
    .data-table-wrap {
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      background: #0b1222;
      max-height: 290px;
      overflow-y: auto;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    table.data-table th {
      position: sticky;
      top: 0;
      background: #16223b;
      color: #93c5fd;
      font-weight: 700;
      text-align: left;
      padding: 9px 12px;
      border-bottom: 1px solid var(--border);
      z-index: 2;
    }
    table.data-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #1a2640;
      color: #e2e8f0;
      vertical-align: middle;
    }
    table.data-table tr:hover td { background: rgba(59, 130, 246, 0.07); }

    /* Live Terminal Stream */
    .terminal-window {
      background: #050811;
      border: 1px solid #1e2d4a;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    .terminal-topbar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 9px 14px;
      background: #0d1424;
      border-bottom: 1px solid #1e2d4a;
    }
    .terminal-dots { display: flex; align-items: center; gap: 7px; font-family: var(--mono); font-size: 12.5px; font-weight: 700; color: var(--cyan); }
    .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .dot.r { background: #ef4444; }
    .dot.y { background: #f59e0b; }
    .dot.g { background: #10b981; }
    .terminal-body {
      padding: 12px 16px;
      font-family: var(--mono);
      font-size: 13px;
      line-height: 1.65;
      max-height: 250px;
      min-height: 160px;
      overflow-y: auto;
      color: #cbd5e1;
    }
    .term-line {
      padding: 2px 0;
      border-bottom: 1px dashed rgba(51, 65, 85, 0.28);
      word-break: break-all;
    }
    .term-time { color: #64748b; margin-right: 8px; }
    .term-tag-rewrite { color: #34d399; font-weight: 700; }
    .term-tag-scan { color: #38bdf8; }
    .term-tag-head { color: #fbbf24; font-weight: 700; }

    /* Packet Capture Inspector Cards */
    .packet-card {
      background: #0b1222;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 12px;
    }
    .packet-card.rewritten {
      border-left: 5px solid var(--success);
      border-color: rgba(16, 185, 129, 0.45);
    }
    .packet-card.no-match { border-left: 5px solid var(--warn); }
    .packet-card.scan-only { border-left: 5px solid var(--cyan); }
    .packet-top {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 9px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(51, 65, 85, 0.45);
    }
    .packet-badges { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .badge {
      padding: 3px 9px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 700;
      font-family: var(--mono);
    }
    .badge.green { background: var(--success-bg); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); }
    .badge.yellow { background: var(--warn-bg); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35); }
    .badge.blue { background: rgba(56, 189, 248, 0.14); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); }
    .badge.gray { background: #1e293b; color: #cbd5e1; border: 1px solid #334155; }
    .packet-url {
      font-family: var(--mono);
      font-size: 12.5px;
      color: #93c5fd;
      background: #111b30;
      padding: 7px 10px;
      border-radius: 7px;
      word-break: break-all;
      margin-bottom: 10px;
    }
    .packet-box {
      background: #111a2e;
      border: 1px solid #223252;
      border-radius: 9px;
      padding: 11px 13px;
      margin-top: 8px;
    }
    .packet-box-title {
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--muted);
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .rewrite-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      background: rgba(16, 185, 129, 0.09);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 7px;
      margin-bottom: 6px;
      font-family: var(--mono);
      font-size: 12.5px;
    }
    .rewrite-from { color: #f8fafc; font-weight: 700; }
    .rewrite-arrow { color: #34d399; font-weight: 800; }
    .rewrite-to { color: #34d399; font-weight: 700; }
    .rewrite-count {
      margin-left: auto;
      background: #065f46;
      color: #a7f3d0;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11.5px;
      font-weight: 700;
    }
    .sku-chip-list { display: flex; flex-wrap: wrap; gap: 7px; }
    .sku-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 9px;
      background: #0b1324;
      border: 1px solid #293b5f;
      border-radius: 7px;
      font-family: var(--mono);
      font-size: 12px;
      color: #e2e8f0;
    }
    .sku-chip-count { color: var(--cyan); font-weight: 700; }
    .sku-chip-btn {
      padding: 2px 7px;
      font-size: 11px;
      border-radius: 5px;
      background: #1e3a8a;
      color: #bfdbfe;
      border: 0;
      cursor: pointer;
    }
    .sku-chip-btn:hover { background: #2563eb; color: white; }

    /* Presets Grid */
    .preset-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 14px;
    }
    .preset-card {
      background: #0b1222;
      border: 1px solid var(--border);
      border-radius: 13px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .preset-card.active {
      border: 2px solid var(--success);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }
    .preset-title { font-weight: 800; font-size: 15px; }
    .preset-desc { font-size: 13px; color: var(--muted); margin: 0; }
    .pair-list {
      background: #111a2e;
      border: 1px solid #1f2e4d;
      border-radius: 9px;
      padding: 8px 10px;
      font-family: var(--mono);
      font-size: 12px;
      max-height: 150px;
      overflow-y: auto;
    }
    .pair-row { margin: 4px 0; word-break: break-all; }
    .pair-row .arrow { color: var(--cyan); margin: 0 6px; font-weight: 700; }

    button {
      font: inherit;
      font-weight: 700;
      padding: 8px 14px;
      border-radius: 8px;
      border: 0;
      cursor: pointer;
      background: var(--primary);
      color: white;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    button:hover { background: var(--primary-hover); }
    button.success { background: var(--success); }
    button.danger { background: var(--danger-bg); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); }
    button.secondary { background: #1e293b; color: var(--text); border: 1px solid var(--border); }
    button.secondary:hover { background: #334155; }
    button.sm { padding: 5px 10px; font-size: 12px; border-radius: 6px; }

    .rule-row {
      display: grid;
      grid-template-columns: 140px 1fr 1fr 85px 80px;
      gap: 10px;
      align-items: center;
      margin-bottom: 10px;
      background: #0b1222;
      padding: 11px;
      border-radius: 11px;
      border: 1px solid var(--border);
    }
    input[type="text"], select {
      width: 100%;
      padding: 8px 11px;
      border-radius: 7px;
      border: 1px solid var(--border);
      background: #131c31;
      color: var(--text);
      font-family: var(--mono);
      font-size: 13px;
    }
    .filter-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .toast {
      position: fixed;
      bottom: 22px;
      right: 22px;
      background: #065f46;
      border: 1px solid #10b981;
      color: white;
      padding: 12px 18px;
      border-radius: 10px;
      font-weight: 700;
      display: none;
      z-index: 999;
    }
    code { font-family: var(--mono); color: var(--cyan); }
    .muted { color: var(--muted); font-size: 12.5px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <div class="brand-title">
          ⚡ G1 ACQ PC Control Center
          <span class="brand-badge">v7.13.0 · Live Runtime & Packet Capture</span>
        </div>
        <div class="muted" id="urls-info">Đang kết nối máy chủ điều khiển...</div>
      </div>
      <div class="status-bar">
        <span class="pill ok"><span class="dot-live"></span><span id="active-preset-pill">Đang tải...</span></span>
        <span class="pill" id="git-sync-pill">GitHub Sync: Sẵn sàng</span>
      </div>
    </header>

    <!-- 3 BIG DEDICATED TABS -->
    <nav class="tabs-bar">
      <button class="tab-btn active" id="tab-btn-runtime" onclick="switchTab('runtime')">
        📡 Nhật Ký Bắt Gói · SKU Gốc · Log Runtime
        <span class="tab-counter" id="tab-count-packets">0 gói</span>
      </button>
      <button class="tab-btn" id="tab-btn-presets" onclick="switchTab('presets')">
        ⚡ Chọn Bộ Mẫu 1 Chạm (Presets)
        <span class="tab-counter" id="tab-count-presets">11 mẫu</span>
      </button>
      <button class="tab-btn" id="tab-btn-rules" onclick="switchTab('rules')">
        🛠️ Quản Lý & Sửa Tay Quy Tắc SKU
        <span class="tab-counter" id="tab-count-rules">0 rule</span>
      </button>
    </nav>

    <!-- TAB 1: DEDICATED FULL-SCREEN REALTIME LOG, ORIGINAL SKUS & PACKET CAPTURE -->
    <div class="tab-panel active" id="tab-panel-runtime">
      <!-- 4 Compact Runtime KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Trạng Thái Runtime & Phiên Bản</span>
          <div class="kpi-value" id="kpi-runtime-status" style="color:#34d399">SẴN SÀNG</div>
          <div class="kpi-sub">Script: <code id="kpi-runtime-version">g1-acq-v7.13-mappings</code></div>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Nguồn Cấu Hình & Thiết Bị</span>
          <div class="kpi-value" id="kpi-config-source" style="color:#38bdf8">PC-LAN</div>
          <div class="kpi-sub">IP iPhone: <code id="kpi-client-ip">--</code> · Lúc: <code id="kpi-last-seen">--:--:--</code></div>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Tổng Gói Tin Bắt Được / Lượt Đè SKU</span>
          <div class="kpi-value"><span id="kpi-total-packets">0</span> gói / <span id="kpi-total-rewrites" style="color:#34d399">0</span> đè</div>
          <div class="kpi-sub">Trong đó lượt đè 2TB/Pro: <code id="kpi-annual-rewrites">0</code> lần</div>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Kho Mã SKU Gốc Đã Thu Thập</span>
          <div class="kpi-value" id="kpi-unique-skus" style="color:#fbbf24">0 SKU</div>
          <div class="kpi-sub">Revision đang chạy: <code id="kpi-revision">----------</code></div>
        </div>
      </div>

      <!-- 2-COLUMN WORKSPACE DIRECTLY VISIBLE ABOVE THE FOLD -->
      <div class="runtime-workspace">
        <!-- LEFT COLUMN: DETAILED PACKET CAPTURE & REWRITE INSPECTOR -->
        <div>
          <div class="panel-box">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">🔍 Chi Tiết Gói Tin Bắt Được & Kết Quả Ghi Đè SKU (Packet Inspector)</h2>
                <div class="muted">Hiển thị trực tiếp từng gói phản hồi từ iPhone: URL, từng cặp <code>SKU Gốc ━━► SKU Đích</code> và các SKU trong gói.</div>
              </div>
              <div class="filter-bar">
                <select id="packet-filter-mode" onchange="renderTelemetry()" style="width:auto;padding:6px 10px;font-size:12.5px">
                  <option value="all">Tất cả gói tin</option>
                  <option value="rewritten">Có Ghi đè SKU (Hits > 0)</option>
                  <option value="no-match">Không khớp (0 Hit)</option>
                </select>
                <input type="text" id="packet-search-input" placeholder="Tìm mã SKU / URL..." oninput="renderTelemetry()" style="width:190px;padding:6px 10px;font-size:12.5px">
              </div>
            </div>
            <div id="packets-inspector-container"></div>
          </div>
        </div>

        <!-- RIGHT COLUMN: ORIGINAL SKU TABLE + RUNTIME CONSOLE STREAM + SCAN LOG TABLE -->
        <div>
          <!-- 1. BẢNG KHO MÃ SKU GỐC THU THẬP ĐƯỢC -->
          <div class="panel-box">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">📦 Bảng Mã SKU Gốc Thu Thập Được Từ Google (<span id="sku-table-count">0</span> Mã)</h2>
                <div class="muted">Danh sách cộng dồn tất cả mã SKU gốc bắt được từ iPhone. Bấm <strong>+ Đưa vào Rule</strong> để gán mã đích.</div>
              </div>
            </div>
            <div class="data-table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Mã SKU Gốc Đầy Đủ</th>
                    <th>Tổng Số Lần</th>
                    <th>Lần Cuối (VN)</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody id="sku-catalog-tbody">
                  <tr><td colspan="4" class="muted">Chưa có mã SKU nào.</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 2. LIVE TERMINAL CONSOLE LOG STREAM -->
          <div class="terminal-window">
            <div class="terminal-topbar">
              <div class="terminal-dots">
                <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
                <span style="margin-left:5px">RUNTIME CONSOLE LOG STREAM (REAL-TIME)</span>
              </div>
              <div class="filter-bar">
                <button class="secondary sm" onclick="simulatePacket()">🧪 Bắn gói test</button>
                <button class="secondary sm" id="btn-pause-log" onclick="togglePauseLog()">⏸ Tạm dừng</button>
                <button class="secondary sm" onclick="exportTelemetryJson()">📥 Xuất JSON</button>
                <button class="danger sm" onclick="clearTelemetry()">🗑 Xóa log</button>
              </div>
            </div>
            <div class="terminal-body" id="terminal-stream"></div>
          </div>

          <!-- 3. BẢNG NHẬT KÝ QUÉT PHẢN HỒI RUNTIME (10-20 PHẢN HỒI GẦN NHẤT) -->
          <div class="panel-box">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">📋 Nhật Ký Quét Phản Hồi Runtime (Recent Responses)</h2>
                <div class="muted">Lịch sử từng phản hồi <code>one.google.com</code> mà Runtime trên iPhone đã quét qua.</div>
              </div>
            </div>
            <div class="data-table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Thời Gian (VN)</th>
                    <th>Đường Dẫn</th>
                    <th>Trạng Thái</th>
                    <th>Số SKU</th>
                    <th>Lượt Đè</th>
                  </tr>
                </thead>
                <tbody id="recent-scan-tbody">
                  <tr><td colspan="5" class="muted">Chưa có lịch sử phản hồi.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: PRESETS 1-CLICK -->
    <div class="tab-panel" id="tab-panel-presets">
      <div class="panel-box">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">⚡ Chọn Bộ Mẫu 1 Chạm (Bấm Trên Máy Tính → Tự Động Đổi Ngay Cho iPhone)</h2>
            <div class="muted">
              Khi bấm <strong>Áp dụng ngay từ PC</strong>, cấu hình phát tức thời qua mạng LAN (<code>0ms</code>) tới iPhone và tự động đồng bộ lên GitHub Cloud.
            </div>
          </div>
        </div>
        <div class="preset-grid" id="preset-grid"></div>
      </div>
    </div>

    <!-- TAB 3: MANUAL RULES EDITOR -->
    <div class="tab-panel" id="tab-panel-rules">
      <div class="panel-box">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">🛠️ Quản Lý & Chỉnh Sửa Quy Tắc Ánh Xạ SKU Thủ Công</h2>
            <div class="muted">Mỗi nút nguồn nên gắn 1 mã đích duy nhất (Exact 1-1) để tránh lỗi đè trùng ID trên trang Google One.</div>
          </div>
          <div class="filter-bar">
            <button class="secondary" onclick="addEmptyRule()">+ Thêm dòng quy tắc mới</button>
            <button class="success" onclick="saveCustomRules()">💾 Lưu & Phát Sang iPhone</button>
          </div>
        </div>
        <div id="rules-container"></div>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    let appState = null;
    let draftRules = null;
    let activeTab = "runtime";
    let logPaused = false;

    function switchTab(tabName) {
      activeTab = tabName;
      ["runtime", "presets", "rules"].forEach(name => {
        document.getElementById("tab-btn-" + name).classList.toggle("active", name === tabName);
        document.getElementById("tab-panel-" + name).classList.toggle("active", name === tabName);
      });
    }

    function showToast(msg) {
      const el = document.getElementById("toast");
      el.textContent = msg;
      el.style.display = "block";
      setTimeout(() => { el.style.display = "none"; }, 3500);
    }

    function escapeHtml(str) {
      return String(str || "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      }[c]));
    }

    function formatTimeVN(isoStr) {
      if (!isoStr) return "--:--:--";
      try {
        const d = new Date(isoStr);
        return d.toLocaleTimeString("vi-VN", { hour12: false });
      } catch (e) {
        return isoStr;
      }
    }

    async function fetchState(preserveDraft = true) {
      if (logPaused && preserveDraft) return;
      try {
        const res = await fetch("/api/state");
        const data = await res.json();
        appState = data;
        if (!preserveDraft || !draftRules) {
          draftRules = JSON.parse(JSON.stringify(data.config.rules || []));
        }
        renderHeader();
        renderPresets();
        if (!preserveDraft) renderRules();
        renderTelemetry();
      } catch (e) {}
    }

    function renderHeader() {
      if (!appState) return;
      const enabledCount = (appState.config.rules || []).filter(r => r.enabled).length;
      document.getElementById("urls-info").innerHTML =
        "Bảng điều khiển PC: <code>" + escapeHtml(appState.localUrl) + "</code> · Cổng LAN iPhone: <code>" +
        escapeHtml(appState.lanUrl) + "/api/config</code> · Revision: <code>" +
        escapeHtml((appState.config.revision || "").slice(0, 12)) + "</code>";
      document.getElementById("active-preset-pill").textContent =
        "Đang chạy: " + (appState.config.activePresetId || "custom") + " (" + enabledCount + " quy tắc bật)";
      const gitPill = document.getElementById("git-sync-pill");
      gitPill.textContent = appState.gitSyncStatus.message;
      gitPill.className = "pill " + (appState.gitSyncStatus.state === "ok" ? "ok" : "sync");

      const totalPkts = appState.runtimeSummary ? appState.runtimeSummary.totalPackets : 0;
      const totalSkus = (appState.skuCatalog || []).length;
      document.getElementById("tab-count-packets").textContent = totalPkts + " gói · " + totalSkus + " SKU";
      document.getElementById("tab-count-presets").textContent = (appState.presets || []).length + " mẫu";
      document.getElementById("tab-count-rules").textContent = enabledCount + "/" + (appState.config.rules || []).length + " rule";
    }

    function isPresetMatched(preset) {
      if (!appState || !appState.config || !Array.isArray(appState.config.rules)) return false;
      const enabledRules = appState.config.rules.filter(r => r.enabled);
      if (enabledRules.length !== preset.rules.length) return false;
      return preset.rules.every(pr =>
        enabledRules.some(r => r.match === pr.match && r.from === pr.from && r.to === pr.to)
      );
    }

    function renderPresets() {
      if (!appState) return;
      const container = document.getElementById("preset-grid");
      container.innerHTML = appState.presets.map(p => {
        const active = isPresetMatched(p);
        const pairs = p.rules.map(r =>
          '<div class="pair-row"><span>' + escapeHtml(r.from) + '</span><span class="arrow">→</span><strong>' + escapeHtml(r.to) + '</strong></div>'
        ).join("");
        return '<div class="preset-card ' + (active ? 'active' : '') + '">' +
          '<div class="preset-title">' + escapeHtml(p.title) + '</div>' +
          '<p class="preset-desc">' + escapeHtml(p.description) + '</p>' +
          '<div class="pair-list">' + pairs + '</div>' +
          '<button class="' + (active ? 'success' : '') + '" style="margin-top:auto" onclick="applyPreset(\\'' + escapeHtml(p.id) + '\\')">' +
          (active ? '✓ Đang áp dụng cho iPhone' : '⚡ Áp dụng ngay từ PC') +
          '</button></div>';
      }).join("");
    }

    function renderRules() {
      const container = document.getElementById("rules-container");
      if (!draftRules || !draftRules.length) {
        container.innerHTML = '<div class="muted">Chưa có quy tắc nào. Bấm "+ Thêm dòng quy tắc mới" hoặc chọn 1 bộ mẫu ở tab bên cạnh.</div>';
        return;
      }
      container.innerHTML = draftRules.map((r, i) =>
        '<div class="rule-row">' +
          '<select onchange="draftRules[' + i + '].match=this.value">' +
            '<option value="exact" ' + (r.match === "exact" ? "selected" : "") + '>Exact (Khớp 1-1)</option>' +
            '<option value="prefix" ' + (r.match === "prefix" ? "selected" : "") + '>Prefix (Tiền tố .)</option>' +
          '</select>' +
          '<input type="text" value="' + escapeHtml(r.from) + '" placeholder="SKU gốc (vd: g1.ios.20tb.m.v2)" oninput="draftRules[' + i + '].from=this.value">' +
          '<input type="text" value="' + escapeHtml(r.to) + '" placeholder="SKU đích" oninput="draftRules[' + i + '].to=this.value">' +
          '<label style="display:flex;align-items:center;gap:6px;font-size:13.5px;font-weight:600;cursor:pointer"><input type="checkbox" style="width:17px;height:17px" ' + (r.enabled ? "checked" : "") + ' onchange="draftRules[' + i + '].enabled=this.checked">Bật</label>' +
          '<button class="danger" onclick="removeRule(' + i + ')">Xóa</button>' +
        '</div>'
      ).join("");
    }

    function addEmptyRule(prefillFrom = "g1.ios.20tb.m.v2") {
      if (!draftRules) draftRules = [];
      draftRules.push({
        id: "",
        match: "exact",
        from: prefillFrom,
        to: "com.google.gemini.2tb.ai.m.3month_ip_99p",
        enabled: true
      });
      renderRules();
    }

    function useSkuAsSource(skuId) {
      addEmptyRule(skuId);
      switchTab("rules");
      showToast("Đã đưa SKU gốc [" + skuId + "] sang Tab Sửa Tay Quy Tắc!");
    }

    function removeRule(idx) {
      draftRules.splice(idx, 1);
      renderRules();
    }

    async function applyPreset(presetId) {
      const res = await fetch("/api/preset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId })
      });
      const data = await res.json();
      if (data.ok) {
        showToast("Đã kích hoạt mẫu [" + presetId + "] cho iPhone!");
        await fetchState(false);
      } else {
        alert("Lỗi: " + data.error);
      }
    }

    async function saveCustomRules() {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: draftRules })
      });
      const data = await res.json();
      if (data.ok) {
        showToast("Đã lưu quy tắc tùy chỉnh & phát sang iPhone!");
        await fetchState(false);
      } else {
        alert("Lỗi: " + data.error);
      }
    }

    function renderTelemetry() {
      if (!appState) return;
      const sum = appState.runtimeSummary || {};
      const statusEl = document.getElementById("kpi-runtime-status");
      const statusMap = {
        "rewritten": { text: "ĐÃ GHI ĐÈ SKU", color: "#34d399" },
        "no-match": { text: "KHÔNG KHỚP RULE", color: "#fbbf24" },
        "scan-only": { text: "QUÉT SKU GỐC", color: "#38bdf8" },
        "waiting": { text: "ĐANG CHỜ GÓI TIN", color: "#94a3b8" },
        "cleared": { text: "ĐÃ XÓA LOG", color: "#94a3b8" }
      };
      const st = statusMap[sum.runtimeStatus] || { text: (sum.runtimeStatus || "SẴN SÀNG").toUpperCase(), color: "#34d399" };
      statusEl.textContent = st.text;
      statusEl.style.color = st.color;

      document.getElementById("kpi-runtime-version").textContent = sum.version || "g1-acq-v7.13-mappings";
      document.getElementById("kpi-config-source").textContent = (sum.configSource || "pc-lan").toUpperCase();
      document.getElementById("kpi-client-ip").textContent = sum.lastClientIp || "Chưa kết nối";
      document.getElementById("kpi-last-seen").textContent = sum.lastSeenAt ? formatTimeVN(sum.lastSeenAt) : "--:--:--";
      document.getElementById("kpi-total-packets").textContent = sum.totalPackets || 0;
      document.getElementById("kpi-total-rewrites").textContent = sum.totalRewrites || 0;
      document.getElementById("kpi-annual-rewrites").textContent = sum.totalAnnualRewrites || 0;
      const catalog = appState.skuCatalog || [];
      document.getElementById("kpi-unique-skus").textContent = catalog.length + " SKU";
      document.getElementById("sku-table-count").textContent = catalog.length;
      document.getElementById("kpi-revision").textContent = (appState.config.revision || "").slice(0, 12);

      // 1. Render SKU Catalog Table (Right Column Top)
      const skuTbody = document.getElementById("sku-catalog-tbody");
      if (!catalog.length) {
        skuTbody.innerHTML = '<tr><td colspan="4" class="muted">Chưa có mã SKU gốc nào. Khi iPhone mở trang gói Google One, mã SKU sẽ tự động hiện tại đây.</td></tr>';
      } else {
        skuTbody.innerHTML = catalog.map(s =>
          '<tr>' +
            '<td><code>' + escapeHtml(s.id) + '</code></td>' +
            '<td><strong style="color:#38bdf8">×' + Number(s.count || 0) + '</strong></td>' +
            '<td class="muted">' + escapeHtml(formatTimeVN(s.lastSeen)) + '</td>' +
            '<td><button class="sku-chip-btn" onclick="useSkuAsSource(\\'' + escapeHtml(s.id) + '\\')">+ Đưa vào Rule</button></td>' +
          '</tr>'
        ).join("");
      }

      // 2. Render Terminal Console Stream (Right Column Middle)
      const termEl = document.getElementById("terminal-stream");
      const packets = appState.telemetry || [];
      if (!packets.length) {
        termEl.innerHTML = '<div class="muted">Đang lắng nghe gói tin HTTPS từ iPhone (one.google.com/ai) qua cổng LAN 192.168.1.71:8787...</div>';
      } else {
        const linesHtml = [];
        packets.slice(0, 25).forEach(pkt => {
          const tStr = formatTimeVN(pkt.at);
          (pkt.logs || []).forEach(line => {
            let cls = "term-tag-head";
            if (line.indexOf("REWRITE ") !== -1) cls = "term-tag-rewrite";
            else if (line.indexOf("ORIGINAL_SKU ") !== -1 || line.indexOf("SCAN ") !== -1) cls = "term-tag-scan";
            linesHtml.push(
              '<div class="term-line"><span class="term-time">[' + escapeHtml(tStr) + ']</span><span class="' + cls + '">' + escapeHtml(line) + '</span></div>'
            );
          });
        });
        termEl.innerHTML = linesHtml.join("");
      }

      // 3. Render Recent Scan Responses Table (Right Column Bottom)
      const scanTbody = document.getElementById("recent-scan-tbody");
      const recentEvents = appState.recentScanEvents || [];
      if (!recentEvents.length && !packets.length) {
        scanTbody.innerHTML = '<tr><td colspan="5" class="muted">Chưa có lịch sử phản hồi.</td></tr>';
      } else {
        const rowsSource = packets.length ? packets.slice(0, 20) : recentEvents;
        scanTbody.innerHTML = rowsSource.map(ev => {
          const p = (ev.url || ev.path || "/ai").replace(/^https:\/\/one\.google\.com/, "").split("#")[0];
          const shortPath = p.length > 42 ? p.slice(0, 42) + "…" : p;
          const skuCnt = Array.isArray(ev.foundSkus) ? ev.foundSkus.length : Number(ev.candidateCount || 0);
          const hitCnt = Number(ev.hitCount || 0);
          return '<tr>' +
            '<td class="muted" style="font-family:var(--mono)">' + escapeHtml(formatTimeVN(ev.at)) + '</td>' +
            '<td><code style="font-size:12px">' + escapeHtml(shortPath) + '</code></td>' +
            '<td>' + (hitCnt > 0 ? '<span style="color:#34d399;font-weight:700">Đã đè SKU</span>' : '<span style="color:#38bdf8">Đã quét</span>') + '</td>' +
            '<td>' + skuCnt + ' mã</td>' +
            '<td><strong style="color:#34d399">' + hitCnt + '</strong></td>' +
          '</tr>';
        }).join("");
      }

      // 4. Render Detailed Packet Inspector Cards (Left Column)
      const inspector = document.getElementById("packets-inspector-container");
      const filterMode = document.getElementById("packet-filter-mode").value;
      const query = (document.getElementById("packet-search-input").value || "").trim().toLowerCase();

      const filtered = packets.filter(pkt => {
        if (filterMode === "rewritten" && !(pkt.hitCount > 0)) return false;
        if (filterMode === "no-match" && pkt.hitCount > 0) return false;
        if (!query) return true;
        return JSON.stringify(pkt).toLowerCase().indexOf(query) !== -1;
      });

      if (!filtered.length) {
        inspector.innerHTML = '<div class="muted" style="padding:14px 0">Chưa có gói tin nào khớp bộ lọc hiện tại.</div>';
        return;
      }

      inspector.innerHTML = filtered.map(pkt => {
        const cardCls = pkt.hitCount > 0 ? "rewritten" : (pkt.runtimeStatus === "scan-only" ? "scan-only" : "no-match");
        const statusBadge = pkt.hitCount > 0
          ? '<span class="badge green">✓ ĐÃ GHI ĐÈ ' + pkt.hitCount + ' VỊ TRÍ SKU</span>'
          : '<span class="badge yellow">⚠ KHÔNG KHỚP QUY TẮC (0 HIT)</span>';

        const rewritesHtml = (pkt.matchedFrom && pkt.matchedFrom.length)
          ? pkt.matchedFrom.map(m =>
              '<div class="rewrite-row">' +
                '<span class="rewrite-from">' + escapeHtml(m.id) + '</span>' +
                '<span class="rewrite-arrow">━━►</span>' +
                '<span class="rewrite-to">' + escapeHtml(m.to) + '</span>' +
                '<span class="rewrite-count">×' + Number(m.count || 1) + ' lần</span>' +
              '</div>'
            ).join("")
          : '<div class="muted">Không có mã SKU nào bị thay thế trong phản hồi này.</div>';

        const foundHtml = (pkt.foundSkus && pkt.foundSkus.length)
          ? '<div class="sku-chip-list">' + pkt.foundSkus.map(s =>
              '<div class="sku-chip">' +
                '<code>' + escapeHtml(s.id) + '</code>' +
                '<span class="sku-chip-count">×' + Number(s.count || 1) + '</span>' +
                '<button class="sku-chip-btn" onclick="useSkuAsSource(\\'' + escapeHtml(s.id) + '\\')">+ Đưa vào Rule</button>' +
              '</div>'
            ).join("") + '</div>'
          : '<div class="muted">Không có mã SKU gốc nào trong gói này.</div>';

        const cachedHint = !pkt.hasFullScanPayload
          ? '<div class="muted" style="margin-top:6px;font-size:11.5px;color:#fbbf24">💡 Gói này gửi từ script bản cũ đang cache trên Shadowrocket (chỉ gửi mã đã khớp quy tắc). Để iPhone gửi toàn bộ 100% mã SKU gốc chưa khớp trong trang, hãy vào Shadowrocket → Mô-đun → bấm Cập nhật module.</div>'
          : '';

        return '<div class="packet-card ' + cardCls + '">' +
          '<div class="packet-top">' +
            '<div class="packet-badges">' +
              statusBadge +
              '<span class="badge blue">Nguồn: ' + escapeHtml((pkt.source || "pc-lan").toUpperCase()) + '</span>' +
              '<span class="badge gray">' + escapeHtml(pkt.version || "g1-acq-v7.13-mappings") + '</span>' +
              '<span class="badge gray">Rev: ' + escapeHtml((pkt.mappingRevision || "").slice(0, 10)) + '</span>' +
            '</div>' +
            '<div class="muted" style="font-family:var(--mono);font-weight:700">' +
              '🕒 ' + escapeHtml(formatTimeVN(pkt.at)) + ' · 📱 ' + escapeHtml(pkt.clientIp || "iPhone") +
            '</div>' +
          '</div>' +
          '<div class="packet-url">GET ' + escapeHtml(pkt.url) + '</div>' +
          '<div class="packet-box">' +
            '<div class="packet-box-title"><span>⚡ KẾT QUẢ GHI ĐÈ SKU (SKU GỐC ━━► SKU ĐÍCH)</span><span>' + (pkt.matchedFrom || []).length + ' quy tắc khớp</span></div>' +
            rewritesHtml +
          '</div>' +
          '<div class="packet-box">' +
            '<div class="packet-box-title"><span>📦 MÃ SKU GỐC BẮT ĐƯỢC TRONG GÓI TIN</span><span>' + (pkt.foundSkus || []).length + ' mã</span></div>' +
            foundHtml +
            cachedHint +
          '</div>' +
        '</div>';
      }).join("");
    }

    async function simulatePacket() {
      await fetch("/api/telemetry/simulate", { method: "POST" });
      await fetchState(true);
      showToast("Đã bắn 1 gói tin đầy đủ 7 SKU gốc vào Nhật ký Realtime!");
    }

    function togglePauseLog() {
      logPaused = !logPaused;
      const btn = document.getElementById("btn-pause-log");
      btn.textContent = logPaused ? "▶ Tiếp tục" : "⏸ Tạm dừng";
      btn.className = logPaused ? "success sm" : "secondary sm";
    }

    function exportTelemetryJson() {
      if (!appState) return;
      const blob = new Blob([JSON.stringify({
        exportedAt: new Date().toISOString(),
        runtimeSummary: appState.runtimeSummary,
        skuCatalog: appState.skuCatalog,
        recentScanEvents: appState.recentScanEvents,
        telemetry: appState.telemetry
      }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "g1-acq-realtime-logs.json";
      a.click();
      URL.revokeObjectURL(url);
    }

    async function clearTelemetry() {
      await fetch("/api/telemetry/clear", { method: "POST" });
      await fetchState(true);
      showToast("Đã xóa toàn bộ nhật ký bắt gói!");
    }

    fetchState(false);
    setInterval(() => fetchState(true), 1500);
  </script>
</body>
</html>`;

server.listen(PORT, HOST, () => {
  console.log("[G1-PC-Server] Running at http://localhost:" + PORT + " and http://" + LAN_IP + ":" + PORT);
});
