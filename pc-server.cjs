"use strict";

const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { exec } = require("node:child_process");
const vm = require("node:vm");

const PORT = Number(process.env.PORT || 8787);
const HOST = "0.0.0.0";
const ROOT_DIR = __dirname;
const REMOTE_CONFIG_PATH = path.join(ROOT_DIR, "remote-config.json");
const TELEMETRY_CACHE_PATH = path.join(ROOT_DIR, "pc-telemetry-cache.json");
const UPSTREAM_CACHE_PATH = path.join(ROOT_DIR, "pc-upstream-cache.json");
const DASHBOARD_HTML_PATH = path.join(ROOT_DIR, "pc-dashboard.html");
const GUIDE_HTML_PATH = path.join(ROOT_DIR, "HUONG_DAN_SU_DUNG.html");
const LIB_CONFIG_PATH = path.join(ROOT_DIR, "lib", "mapping-config.js");
const RUNTIME_SCRIPT_PATH = path.join(ROOT_DIR, "g1-acq.js");
const REPORT_SCRIPT_PATH = path.join(ROOT_DIR, "g1-sku-report.js");

function detectLanInterfaces() {
  const nets = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(nets)) {
    const lower = name.toLowerCase();
    const isVirtual = /(vethernet|wsl|hyper-v|vmware|virtualbox|vbox|docker|loopback|npcap|tailscale|zerotier|radmin|hamachi|tun|tap)/.test(lower);
    for (const iface of nets[name] || []) {
      const fam = typeof iface.family === "string" ? iface.family : (iface.family === 4 ? "IPv4" : "");
      if (fam !== "IPv4" || iface.internal) continue;
      if (/^169\.254\./.test(iface.address)) continue;
      let score = isVirtual ? 10 : 100;
      if (/(wi-fi|wifi|wlan)/.test(lower)) score += 30;
      else if (/(ethernet|eth|en0)/.test(lower)) score += 20;
      if (/^192\.168\./.test(iface.address)) score += 15;
      else if (/^10\./.test(iface.address) || /^172\.(1[6-9]|2\d|3[01])\./.test(iface.address)) score += 10;
      candidates.push({ name, address: iface.address, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  if (!candidates.length) {
    candidates.push({ name: "Localhost", address: "127.0.0.1", score: 0 });
  }
  return candidates;
}

let lanCandidates = detectLanInterfaces();
let selectedLanIp = process.env.LAN_IP || lanCandidates[0].address;

function getActiveLanIp() {
  lanCandidates = detectLanInterfaces();
  if (!lanCandidates.some(c => c.address === selectedLanIp)) {
    selectedLanIp = lanCandidates[0].address;
  }
  return selectedLanIp;
}

const UPSTREAM_REPOS = [
  {
    key: "crhywun",
    name: "crhywun/g1-acq",
    repoUrl: "https://github.com/crhywun/g1-acq",
    gitUrl: "https://github.com/crhywun/g1-acq.git",
    atomUrl: "https://github.com/crhywun/g1-acq/commits/main.atom",
    apiCommitUrl: "https://api.github.com/repos/crhywun/g1-acq/commits/",
    rawBase: "https://raw.githubusercontent.com/crhywun/g1-acq/",
    configFile: "lib/mapping-config.js",
    reportFile: "g1-sku-report.js",
    runtimeFile: "g1-acq.js"
  },
  {
    key: "dgkncn",
    name: "Dgkncn/g1-acq-plus",
    repoUrl: "https://github.com/Dgkncn/g1-acq-plus",
    gitUrl: "https://github.com/Dgkncn/g1-acq-plus.git",
    atomUrl: "https://github.com/Dgkncn/g1-acq-plus/commits/main.atom",
    apiCommitUrl: "https://api.github.com/repos/Dgkncn/g1-acq-plus/commits/",
    rawBase: "https://raw.githubusercontent.com/Dgkncn/g1-acq-plus/",
    configFile: "g1-acq.js",
    reportFile: "g1-sku-report.js",
    runtimeFile: "g1-acq.js",
    catalogFile: "sku-catalog.json"
  }
];

function hasGitRepo() {
  return fs.existsSync(path.join(ROOT_DIR, ".git"));
}

function execAsync(command, timeoutMs = 15000) {
  return new Promise(resolve => {
    exec(command, { cwd: ROOT_DIR, timeout: timeoutMs }, (err, stdout, stderr) => {
      resolve({
        ok: !err,
        stdout: String(stdout || ""),
        stderr: String(stderr || ""),
        error: err ? err.message : ""
      });
    });
  });
}

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

function computeRulesSignature(rules) {
  if (!Array.isArray(rules)) return "";
  return rules
    .map(r => `${r.match || "exact"}:${String(r.from || "").trim()}->${String(r.to || "").trim()}`)
    .sort()
    .join("|");
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

// ============================================================================
// UPSTREAM AUTO-UPDATER STATE & ENGINE (WORKS EVEN WITHOUT GIT INSTALLED)
// ============================================================================
let upstreamState = {
  autoCheckEnabled: true,
  intervalMinutes: 5,
  autoSyncToSource: true,
  checking: false,
  lastCheckedAt: "",
  lastUpdatedAt: "",
  statusMessage: "Đang khởi tạo kiểm tra Repo Gốc...",
  repos: {
    crhywun: {
      name: "crhywun/g1-acq",
      repoUrl: "https://github.com/crhywun/g1-acq",
      sha: "",
      shortSha: "",
      version: "",
      collectorVersion: "",
      commitMessage: "",
      commitDate: "",
      presets: [],
      skus: []
    },
    dgkncn: {
      name: "Dgkncn/g1-acq-plus",
      repoUrl: "https://github.com/Dgkncn/g1-acq-plus",
      sha: "",
      shortSha: "",
      version: "",
      collectorVersion: "",
      commitMessage: "",
      commitDate: "",
      presets: [],
      skus: [],
      promoCatalogSkus: []
    }
  },
  autoImportedPresets: [],
  newlyDiscoveredSkus: [],
  knownSkusMap: {},
  history: []
};

function loadUpstreamCache() {
  try {
    if (fs.existsSync(UPSTREAM_CACHE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(UPSTREAM_CACHE_PATH, "utf8"));
      if (parsed && typeof parsed === "object") {
        upstreamState = Object.assign(upstreamState, parsed, { checking: false });
      }
    }
  } catch (e) {}
}

function saveUpstreamCache() {
  try {
    const copy = Object.assign({}, upstreamState, { checking: false });
    fs.writeFileSync(UPSTREAM_CACHE_PATH, JSON.stringify(copy, null, 2), "utf8");
  } catch (e) {}
}

loadUpstreamCache();

function addUpstreamHistory(type, message) {
  upstreamState.history.unshift({
    at: new Date().toISOString(),
    type,
    message
  });
  if (upstreamState.history.length > 60) {
    upstreamState.history = upstreamState.history.slice(0, 60);
  }
}

function getAllPresets() {
  const localPresets = loadEngine().presets().map(p => Object.assign({}, p, { origin: "local" }));
  const seenIds = new Set(localPresets.map(p => p.id));
  const seenSigs = new Set(localPresets.map(p => computeRulesSignature(p.rules)));
  const merged = localPresets.slice();

  (upstreamState.autoImportedPresets || []).forEach(up => {
    const sig = computeRulesSignature(up.rules);
    if (!sig || seenSigs.has(sig)) return;
    let id = up.id;
    if (seenIds.has(id)) id = `${up.repoKey}-${up.id}`;
    seenIds.add(id);
    seenSigs.add(sig);
    merged.push({
      id,
      title: up.title,
      description: up.description,
      replaceAll: true,
      origin: "upstream",
      repoName: up.repoName,
      version: up.version || "",
      rules: up.rules
    });
  });

  return merged;
}

async function fetchTextWithTimeout(url, timeoutMs = 10000, extraHeaders = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: Object.assign({ "User-Agent": "G1-ACQ-PC-Control-Center/7.13" }, extraHeaders)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function decodeXmlEntities(str) {
  return String(str || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function resolveLatestCommit(repoDef, prevRepoState) {
  let sha = "";
  let commitMessage = "";
  let commitDate = "";

  // Tier 1: GitHub Atom Feed (Works on ANY PC without Git installed AND has 0 REST API rate limit!)
  try {
    const atomXml = await fetchTextWithTimeout(repoDef.atomUrl, 8000);
    const entryMatch = atomXml.match(/<entry>([\s\S]*?)<\/entry>/);
    if (entryMatch) {
      const entry = entryMatch[1];
      const shaMatch = entry.match(/Commit\/([0-9a-f]{40})/i);
      const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const updatedMatch = entry.match(/<updated>([^<]+)<\/updated>/i);
      if (shaMatch) sha = shaMatch[1];
      if (titleMatch) commitMessage = decodeXmlEntities(titleMatch[1]).trim().split(/\r?\n/)[0];
      if (updatedMatch) commitDate = updatedMatch[1].trim();
    }
  } catch (e) {}

  // Tier 2: git ls-remote fallback
  if (!sha) {
    const lsRes = await execAsync(`git ls-remote ${repoDef.gitUrl} refs/heads/main`, 8000);
    if (lsRes.ok && lsRes.stdout) {
      const m = lsRes.stdout.trim().match(/^([0-9a-f]{40})\s+/i);
      if (m) sha = m[1];
    }
  }

  // Tier 3: GitHub REST API fallback
  if (!sha || !commitMessage) {
    if (prevRepoState && prevRepoState.sha === sha && prevRepoState.commitMessage) {
      commitMessage = prevRepoState.commitMessage;
      commitDate = prevRepoState.commitDate;
    } else {
      try {
        const targetRef = sha || "main";
        const rawJson = await fetchTextWithTimeout(repoDef.apiCommitUrl + targetRef, 8000, {
          Accept: "application/vnd.github.v3+json"
        });
        const info = JSON.parse(rawJson);
        if (info && info.sha) {
          sha = info.sha;
          commitMessage = (info.commit && info.commit.message ? info.commit.message.split(/\r?\n/)[0] : "");
          commitDate = (info.commit && info.commit.committer && info.commit.committer.date) || new Date().toISOString();
        }
      } catch (e) {
        if (!commitMessage) commitMessage = "Đã lấy commit mới nhất";
        if (!commitDate) commitDate = new Date().toISOString();
      }
    }
  }

  return { sha, shortSha: sha ? sha.slice(0, 7) : "", commitMessage, commitDate };
}

function parseCreateG1MappingConfigFromSource(sourceCode) {
  const start = sourceCode.indexOf("function createG1MappingConfig");
  if (start === -1) return { presets: [], defaults: [] };
  const iife = sourceCode.indexOf("(function () {", start);
  const endMarker = sourceCode.indexOf("// END GENERATED MAPPING CONFIG", start);
  let end = sourceCode.length;
  if (endMarker !== -1 && endMarker > start) end = endMarker;
  else if (iife !== -1 && iife > start) end = iife;

  const fnSlice = sourceCode.slice(start, end);
  const ctx = {};
  vm.runInNewContext(fnSlice + "\n;this.__eng = createG1MappingConfig(null);", ctx, { timeout: 1500 });
  const eng = ctx.__eng;
  const presets = (eng && typeof eng.presets === "function") ? eng.presets() : [];
  const defaults = (eng && typeof eng.defaults === "function") ? eng.defaults() : [];
  return { presets, defaults };
}

function extractSkusFromText(text) {
  const set = new Set();
  const re = /(?:g1\.|com\.google\.(?:one|gemini)\.)[A-Za-z0-9._-]{1,160}/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const token = m[0].replace(/\.+$/, "");
    if (/^(?:g1\.|com\.google\.(?:one|gemini)\.)[A-Za-z0-9._-]*[A-Za-z0-9_-]$/.test(token)) {
      set.add(token);
    }
  }
  return Array.from(set).sort();
}

function syncNewPresetsAndVersionToDisk(crhywunRepo) {
  try {
    let changedFiles = false;
    if (crhywunRepo.version && /^v\d+\.\d+\.\d+$/.test(crhywunRepo.version) &&
        crhywunRepo.collectorVersion && /^g1-acq-v[\d.]+-mappings$/.test(crhywunRepo.collectorVersion)) {
      const curReport = fs.readFileSync(REPORT_SCRIPT_PATH, "utf8");
      const curRuntime = fs.readFileSync(RUNTIME_SCRIPT_PATH, "utf8");

      const nextReport = curReport
        .replace(/var VERSION = "v\d+\.\d+\.\d+";/, `var VERSION = "${crhywunRepo.version}";`)
        .replace(/var COLLECTOR_VERSION = "g1-acq-v[\d.]+-mappings";/, `var COLLECTOR_VERSION = "${crhywunRepo.collectorVersion}";`);
      const nextRuntime = curRuntime
        .replace(/var VERSION = "g1-acq-v[\d.]+-mappings";/, `var VERSION = "${crhywunRepo.collectorVersion}";`);

      if (nextReport !== curReport) {
        fs.writeFileSync(REPORT_SCRIPT_PATH, nextReport, "utf8");
        changedFiles = true;
      }
      if (nextRuntime !== curRuntime) {
        fs.writeFileSync(RUNTIME_SCRIPT_PATH, nextRuntime, "utf8");
        changedFiles = true;
      }
    }

    if (changedFiles && fs.existsSync(path.join(ROOT_DIR, "tools", "build-variants.cjs"))) {
      exec("node tools/build-variants.cjs", { cwd: ROOT_DIR }, err => {
        if (!err && hasGitRepo()) triggerGitPush(true);
      });
    }
    return changedFiles;
  } catch (e) {
    return false;
  }
}

async function checkUpstreamRepos(forceFetch = false) {
  if (upstreamState.checking) {
    return { ok: true, skipped: true, state: upstreamState };
  }
  upstreamState.checking = true;
  upstreamState.statusMessage = "Đang kiểm tra cập nhật từ Repo Gốc...";

  try {
    const localEng = loadEngine();
    const localSigs = new Set(localEng.presets().map(p => computeRulesSignature(p.rules)));
    const isInitialBootstrap = Object.keys(upstreamState.knownSkusMap || {}).length === 0;
    if (isInitialBootstrap) {
      const localRaw = fs.readFileSync(LIB_CONFIG_PATH, "utf8");
      extractSkusFromText(localRaw).forEach(s => {
        upstreamState.knownSkusMap[s] = "local-init";
      });
    }

    let anyNewCommit = false;
    const importedList = [];
    const importedSigSet = new Set();
    const discoveredThisRun = [];

    for (const repoDef of UPSTREAM_REPOS) {
      const prev = upstreamState.repos[repoDef.key] || {};
      const commitInfo = await resolveLatestCommit(repoDef, prev);
      if (!commitInfo.sha) continue;

      const shaChanged = prev.sha !== commitInfo.sha;
      const needDownload = forceFetch || shaChanged || !Array.isArray(prev.presets) || prev.presets.length === 0;

      let version = prev.version || "";
      let collectorVersion = prev.collectorVersion || "";
      let presets = Array.isArray(prev.presets) ? prev.presets : [];
      let skus = Array.isArray(prev.skus) ? prev.skus : [];
      let promoCatalogSkus = Array.isArray(prev.promoCatalogSkus) ? prev.promoCatalogSkus : [];

      if (needDownload) {
        const ref = commitInfo.sha;
        const [cfgText, reportText, runtimeText] = await Promise.all([
          fetchTextWithTimeout(`${repoDef.rawBase}${ref}/${repoDef.configFile}`),
          fetchTextWithTimeout(`${repoDef.rawBase}${ref}/${repoDef.reportFile}`).catch(() => ""),
          repoDef.runtimeFile === repoDef.configFile
            ? Promise.resolve("")
            : fetchTextWithTimeout(`${repoDef.rawBase}${ref}/${repoDef.runtimeFile}`).catch(() => "")
        ]);

        const verMatch = reportText.match(/var\s+VERSION\s*=\s*"([^"]+)"/);
        if (verMatch) version = verMatch[1];
        const colMatch = (runtimeText || cfgText).match(/var\s+VERSION\s*=\s*"(g1-acq-[^"]+)"/);
        if (colMatch) collectorVersion = colMatch[1];

        const parsed = parseCreateG1MappingConfigFromSource(cfgText);
        presets = (parsed.presets || []).map(p => ({
          id: String(p.id || ""),
          title: String(p.title || p.id || ""),
          description: String(p.description || ""),
          rules: Array.isArray(p.rules) ? p.rules.map(r => ({
            match: r.match === "prefix" ? "prefix" : "exact",
            from: String(r.from || ""),
            to: String(r.to || ""),
            enabled: true
          })) : []
        }));

        skus = extractSkusFromText(cfgText + "\n" + reportText);

        if (repoDef.catalogFile) {
          try {
            const catRaw = await fetchTextWithTimeout(`${repoDef.rawBase}${ref}/${repoDef.catalogFile}`, 12000);
            const catSkus = extractSkusFromText(catRaw);
            promoCatalogSkus = catSkus.filter(s =>
              /(?:99p|90p|80p|75p|eft|gemini|ultra|20tb|30tb|subs_variant|g1\.ios\.ai\.)/i.test(s)
            );
            skus = Array.from(new Set(skus.concat(promoCatalogSkus))).sort();
          } catch (e) {}
        }

        skus.forEach(sku => {
          if (!upstreamState.knownSkusMap[sku]) {
            upstreamState.knownSkusMap[sku] = `${repoDef.name}@${commitInfo.shortSha}`;
            if (!isInitialBootstrap || /(?:99p|ip_3mo|gemini|ultra|eft)/i.test(sku)) {
              discoveredThisRun.push({
                id: sku,
                repoName: repoDef.name,
                shortSha: commitInfo.shortSha,
                at: new Date().toISOString()
              });
            }
          }
        });

        if (shaChanged && prev.sha) {
          anyNewCommit = true;
          addUpstreamHistory(
            "update",
            `Phát hiện bản cập nhật mới trên ${repoDef.name} (${version || commitInfo.shortSha}): "${commitInfo.commitMessage}"`
          );
        }
      }

      presets.forEach(p => {
        const sig = computeRulesSignature(p.rules);
        if (!sig || localSigs.has(sig) || importedSigSet.has(sig)) return;
        importedSigSet.add(sig);
        importedList.push({
          id: `${repoDef.key}-${p.id}`,
          origId: p.id,
          repoKey: repoDef.key,
          repoName: repoDef.name,
          version: version || commitInfo.shortSha,
          title: `🔄 [Repo Gốc ${repoDef.key === "crhywun" ? (version || "crhywun") : "Plus " + (version || "")}] ${p.title}`,
          description: `[Tự động đồng bộ từ ${repoDef.name} · commit ${commitInfo.shortSha}] ${p.description}`,
          rules: p.rules
        });
      });

      upstreamState.repos[repoDef.key] = {
        name: repoDef.name,
        repoUrl: repoDef.repoUrl,
        sha: commitInfo.sha,
        shortSha: commitInfo.shortSha,
        version,
        collectorVersion,
        commitMessage: commitInfo.commitMessage,
        commitDate: commitInfo.commitDate,
        presets,
        skus: skus.slice(0, 120),
        totalSkusCount: skus.length,
        promoCatalogSkus: promoCatalogSkus.slice(0, 80)
      };
    }

    upstreamState.autoImportedPresets = importedList;
    if (discoveredThisRun.length > 0) {
      const existingIds = new Set((upstreamState.newlyDiscoveredSkus || []).map(x => x.id));
      const fresh = discoveredThisRun.filter(x => !existingIds.has(x.id));
      upstreamState.newlyDiscoveredSkus = fresh.concat(upstreamState.newlyDiscoveredSkus || []).slice(0, 80);
    }

    const nowIso = new Date().toISOString();
    upstreamState.lastCheckedAt = nowIso;
    if (anyNewCommit || !upstreamState.lastUpdatedAt) {
      upstreamState.lastUpdatedAt = nowIso;
    }

    if (upstreamState.autoSyncToSource && upstreamState.repos.crhywun) {
      syncNewPresetsAndVersionToDisk(upstreamState.repos.crhywun);
    }

    const crVer = upstreamState.repos.crhywun.version || upstreamState.repos.crhywun.shortSha || "--";
    const dgVer = upstreamState.repos.dgkncn.version || upstreamState.repos.dgkncn.shortSha || "--";
    upstreamState.statusMessage = anyNewCommit
      ? `Đã tự động cập nhật bản mới! (crhywun ${crVer} · plus ${dgVer})`
      : `Đã mới nhất: crhywun ${crVer} (${upstreamState.repos.crhywun.shortSha}) · plus ${dgVer} (${upstreamState.repos.dgkncn.shortSha})`;

    addUpstreamHistory(
      anyNewCommit ? "update" : "check",
      `Kiểm tra thành công: crhywun ${crVer} (${upstreamState.repos.crhywun.shortSha}), plus ${dgVer} (${upstreamState.repos.dgkncn.shortSha}) — Đồng bộ ${importedList.length} preset bổ sung vào Web.`
    );

    saveUpstreamCache();
    upstreamState.checking = false;
    return { ok: true, anyNewCommit, importedCount: importedList.length, state: upstreamState };
  } catch (err) {
    upstreamState.checking = false;
    upstreamState.lastCheckedAt = new Date().toISOString();
    upstreamState.statusMessage = "Lỗi kiểm tra Repo Gốc: " + err.message;
    addUpstreamHistory("error", "Lỗi khi kết nối Repo Gốc: " + err.message);
    saveUpstreamCache();
    return { ok: false, error: err.message, state: upstreamState };
  }
}

let autoCheckTimer = null;
function restartUpstreamSchedule() {
  if (autoCheckTimer) {
    clearInterval(autoCheckTimer);
    autoCheckTimer = null;
  }
  if (upstreamState.autoCheckEnabled && upstreamState.intervalMinutes > 0) {
    const ms = Math.max(1, Number(upstreamState.intervalMinutes)) * 60 * 1000;
    autoCheckTimer = setInterval(() => {
      checkUpstreamRepos(false).catch(() => {});
    }, ms);
  }
}

// ============================================================================
// TELEMETRY & CONFIG ENGINE
// ============================================================================
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
      }
    }
  } catch (e) {}
}

let gitSyncStatus = {
  state: "ok",
  lastSyncAt: currentConfig.updatedAt,
  message: hasGitRepo() ? "LAN (0ms) + GitHub Cloud: Sẵn sàng" : "Chế độ LAN Trực Tiếp (0ms)"
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
  triggerGitPush(false);
  return { ok: true, config: currentConfig };
}

let gitBusy = false;
let gitPending = false;
function triggerGitPush(includeAllScripts = false) {
  if (!hasGitRepo()) {
    gitSyncStatus = {
      state: "ok",
      lastSyncAt: new Date().toISOString(),
      message: "Chế độ LAN Trực Tiếp (0ms) — Đã lưu cấu hình"
    };
    return;
  }
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
  const filesToAdd = includeAllScripts
    ? "remote-config.json g1-acq.js g1-sku-report.js"
    : "remote-config.json";
  const cmd = `git add ${filesToAdd} && git commit -m "PC Web UI live sync update" && git push origin main`;
  exec(cmd, { cwd: ROOT_DIR }, (err, stdout, stderr) => {
    gitBusy = false;
    if (err && !/nothing to commit/i.test(String(stdout) + String(stderr))) {
      gitSyncStatus = {
        state: "ok",
        lastSyncAt: new Date().toISOString(),
        message: "Chế độ LAN Trực Tiếp (0ms) — Đang hoạt động"
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
      triggerGitPush(false);
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
  const activeLanIp = getActiveLanIp();
  const baseLanUrl = `http://${activeLanIp}:${PORT}`;

  // Dynamic Shadowrocket .sgmodule (Works on ANY PC out-of-the-box without GitHub!)
  if (pathname === "/g1-acq-live.sgmodule" && req.method === "GET") {
    const sgmoduleContent = [
      `#!name=G1 ACQ SKU Quản Lý (PC Live Control · ${activeLanIp})`,
      `#!desc=Điều khiển trực tiếp từ Dashboard PC (${baseLanUrl}). Tự động đồng bộ cấu hình 0ms qua Wi-Fi LAN và bắn log bắt gói realtime về máy tính.`,
      `#!system=ios`,
      ``,
      `[Rule]`,
      `AND,((PROTOCOL,UDP),(DEST-PORT,443)),REJECT-NO-DROP`,
      `IP-CIDR,192.168.0.0/16,DIRECT,no-resolve`,
      `IP-CIDR,10.0.0.0/8,DIRECT,no-resolve`,
      `IP-CIDR,172.16.0.0/12,DIRECT,no-resolve`,
      ``,
      `[Script]`,
      `g1-acq = type=http-response,pattern=^https:\\/\\/one\\.google\\.com\\/,requires-body=1,max-size=0,script-path=${baseLanUrl}/scripts/g1-acq.js`,
      `g1-sku-report = type=http-request,pattern=^https:\\/\\/one\\.google\\.com\\/g1-sku-report\\/?(?:\\?.*)?$,requires-body=1,max-size=0,script-path=${baseLanUrl}/scripts/g1-sku-report.js`,
      ``,
      `[MITM]`,
      `hostname = %APPEND% one.google.com`,
      ``
    ].join("\n");
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end(sgmoduleContent);
    return;
  }

  // Dynamic runtime script with auto-injected PC LAN IP
  if (pathname === "/scripts/g1-acq.js" && req.method === "GET") {
    const rawJs = fs.readFileSync(RUNTIME_SCRIPT_PATH, "utf8");
    const patchedJs = rawJs.replace(
      /var\s+PC_LAN_API\s*=\s*"[^"]+";/,
      `var PC_LAN_API = "${baseLanUrl}";`
    );
    res.writeHead(200, {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end(patchedJs);
    return;
  }

  if (pathname === "/scripts/g1-sku-report.js" && req.method === "GET") {
    const rawReportJs = fs.readFileSync(REPORT_SCRIPT_PATH, "utf8");
    res.writeHead(200, {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end(rawReportJs);
    return;
  }

  // Serve User Guide HTML
  if (pathname === "/guide" && req.method === "GET") {
    if (fs.existsSync(GUIDE_HTML_PATH)) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      res.end(fs.readFileSync(GUIDE_HTML_PATH, "utf8"));
      return;
    }
  }

  if (pathname === "/api/config" && req.method === "GET") {
    sendJson(res, 200, currentConfig);
    return;
  }

  if (pathname === "/api/lan-ip" && req.method === "POST") {
    try {
      const body = JSON.parse(await readBody(req));
      if (body.ip && typeof body.ip === "string") {
        selectedLanIp = body.ip.trim();
      }
      sendJson(res, 200, { ok: true, selectedLanIp });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message });
    }
    return;
  }

  if (pathname === "/api/state" && req.method === "GET") {
    const skuCatalog = Object.keys(cumulativeSkus)
      .sort()
      .map(id => cumulativeSkus[id]);
    sendJson(res, 200, {
      config: currentConfig,
      presets: getAllPresets(),
      gitSyncStatus,
      lanCandidates,
      selectedLanIp: activeLanIp,
      liveModuleUrl: `${baseLanUrl}/g1-acq-live.sgmodule`,
      shadowrocketDeepLink: `shadowrocket://install?module=${encodeURIComponent(baseLanUrl + "/g1-acq-live.sgmodule")}`,
      upstream: {
        autoCheckEnabled: upstreamState.autoCheckEnabled,
        intervalMinutes: upstreamState.intervalMinutes,
        autoSyncToSource: upstreamState.autoSyncToSource,
        checking: upstreamState.checking,
        lastCheckedAt: upstreamState.lastCheckedAt,
        lastUpdatedAt: upstreamState.lastUpdatedAt,
        statusMessage: upstreamState.statusMessage,
        repos: upstreamState.repos,
        autoImportedCount: (upstreamState.autoImportedPresets || []).length,
        newlyDiscoveredSkus: (upstreamState.newlyDiscoveredSkus || []).slice(0, 50),
        history: (upstreamState.history || []).slice(0, 30)
      },
      runtimeSummary,
      skuCatalog,
      recentScanEvents: recentScanEvents.slice(-20).reverse(),
      telemetry: telemetryLogs.slice(-80).reverse(),
      lanUrl: baseLanUrl,
      localUrl: "http://localhost:" + PORT
    });
    return;
  }

  if (pathname === "/api/upstream/check" && req.method === "POST") {
    try {
      const bodyRaw = await readBody(req);
      const body = bodyRaw ? JSON.parse(bodyRaw) : {};
      const result = await checkUpstreamRepos(Boolean(body.force));
      sendJson(res, 200, result);
    } catch (e) {
      sendJson(res, 500, { ok: false, error: e.message });
    }
    return;
  }

  if (pathname === "/api/upstream/settings" && req.method === "POST") {
    try {
      const body = JSON.parse(await readBody(req));
      if (typeof body.autoCheckEnabled === "boolean") {
        upstreamState.autoCheckEnabled = body.autoCheckEnabled;
      }
      if (typeof body.intervalMinutes === "number" && body.intervalMinutes >= 1 && body.intervalMinutes <= 1440) {
        upstreamState.intervalMinutes = Math.floor(body.intervalMinutes);
      }
      if (typeof body.autoSyncToSource === "boolean") {
        upstreamState.autoSyncToSource = body.autoSyncToSource;
      }
      saveUpstreamCache();
      restartUpstreamSchedule();
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message });
    }
    return;
  }

  if (pathname === "/api/preset" && req.method === "POST") {
    try {
      const body = JSON.parse(await readBody(req));
      let preset = getAllPresets().find(p => p.id === body.presetId);
      if (!preset && body.repoKey && body.origId && upstreamState.repos[body.repoKey]) {
        const upFound = (upstreamState.repos[body.repoKey].presets || []).find(p => p.id === body.origId);
        if (upFound) {
          preset = {
            id: `${body.repoKey}-${upFound.id}`,
            replaceAll: true,
            rules: upFound.rules
          };
        }
      }
      if (!preset) {
        sendJson(res, 400, { ok: false, error: "Không tìm thấy mẫu preset: " + body.presetId });
        return;
      }
      const baseRules = preset.replaceAll !== false ? [] : currentConfig.rules.slice();
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
      }, "iPhone-Test-Sim");
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
  const ip = getActiveLanIp();
  console.log("=================================================================");
  console.log("  G1 ACQ PC CONTROL CENTER v7.13.0 DA KHOI DONG THANH CONG!");
  console.log("  - Trang dieu khien tren PC : http://localhost:" + PORT);
  console.log("  - Link Module cho iPhone   : http://" + ip + ":" + PORT + "/g1-acq-live.sgmodule");
  console.log("  - Tai lieu Huong dan A-Z   : http://localhost:" + PORT + "/guide");
  console.log("=================================================================");
  checkUpstreamRepos(false).catch(() => {});
  restartUpstreamSchedule();
});
