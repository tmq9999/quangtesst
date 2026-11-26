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
let gitSyncStatus = {
  state: "idle",
  lastSyncAt: currentConfig.updatedAt,
  message: "Đã đồng bộ sẵn sàng"
};

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
    message: "Đang đẩy cấu hình lên GitHub (fallback cho 4G/Tường lửa)..."
  };
  const cmd = 'git add remote-config.json && git commit -m "PC Web UI live config update" && git push origin main';
  exec(cmd, { cwd: ROOT_DIR }, (err, stdout, stderr) => {
    gitBusy = false;
    if (err && !/nothing to commit/i.test(String(stdout) + String(stderr))) {
      gitSyncStatus = {
        state: "warning",
        lastSyncAt: new Date().toISOString(),
        message: "Đã lưu LAN tức thời (Git push: " + (stderr || err.message).slice(0, 80) + ")"
      };
    } else {
      gitSyncStatus = {
        state: "ok",
        lastSyncAt: new Date().toISOString(),
        message: "Đã đồng bộ cả LAN (0ms) + GitHub Cloud thành công!"
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
      if (data.length > 200000) reject(new Error("Payload too large"));
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
    sendJson(res, 200, {
      config: currentConfig,
      presets: eng.presets(),
      gitSyncStatus,
      telemetry: telemetryLogs.slice(-30).reverse(),
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
      telemetryLogs.push({
        at: new Date().toISOString(),
        clientIp: req.socket.remoteAddress || "",
        url: String(body.url || ""),
        source: String(body.configSource || "pc-lan"),
        hitCount: Number(body.hitCount || 0),
        matchedFrom: Array.isArray(body.matchedFrom) ? body.matchedFrom : [],
        foundSkus: Array.isArray(body.foundSkus) ? body.foundSkus : []
      });
      if (telemetryLogs.length > 100) telemetryLogs = telemetryLogs.slice(-100);
      sendJson(res, 200, { ok: true });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message });
    }
    return;
  }

  // 6. Clear telemetry logs
  if (pathname === "/api/telemetry/clear" && req.method === "POST") {
    telemetryLogs = [];
    sendJson(res, 200, { ok: true });
    return;
  }

  // 7. Serve PC Web Dashboard HTML
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
  <title>G1 ACQ PC Control Center — Điều Khiển SKU iPhone Từ Máy Tính</title>
  <style>
    :root {
      --bg: #0f172a;
      --panel: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --muted: #94a3b8;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --success: #10b981;
      --warn: #f59e0b;
      --danger: #ef4444;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px 22px;
      margin-bottom: 20px;
    }
    h1 { margin: 0; font-size: 22px; }
    h2 { margin: 0 0 12px; font-size: 18px; }
    .status-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .pill {
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      background: #0f172a;
      border: 1px solid var(--border);
    }
    .pill.ok { border-color: var(--success); color: #34d399; }
    .pill.sync { border-color: var(--warn); color: #fbbf24; }
    .grid-2 { display: grid; grid-template-columns: 1.35fr 1fr; gap: 20px; align-items: start; }
    @media (max-width: 960px) { .grid-2 { grid-template-columns: 1fr; } }
    section {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .preset-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 14px;
    }
    .preset-card {
      background: #0f172a;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: border-color 0.15s;
    }
    .preset-card.active {
      border: 2px solid var(--success);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }
    .preset-title { font-weight: 700; font-size: 15px; }
    .preset-desc { font-size: 13px; color: var(--muted); margin: 0; }
    .pair-list {
      background: #162033;
      border-radius: 8px;
      padding: 8px 10px;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 12px;
      max-height: 135px;
      overflow-y: auto;
    }
    .pair-row { margin: 4px 0; word-break: break-all; }
    .pair-row .arrow { color: #38bdf8; margin: 0 6px; }
    button {
      font: inherit;
      font-weight: 600;
      padding: 9px 14px;
      border-radius: 8px;
      border: 0;
      cursor: pointer;
      background: var(--primary);
      color: white;
      transition: background 0.15s;
    }
    button:hover { background: var(--primary-hover); }
    button.success { background: var(--success); }
    button.danger { background: rgba(239, 68, 68, 0.18); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); }
    button.secondary { background: #334155; color: var(--text); }
    .rule-row {
      display: grid;
      grid-template-columns: 110px 1fr 1fr 70px 70px;
      gap: 8px;
      align-items: center;
      margin-bottom: 10px;
      background: #0f172a;
      padding: 10px;
      border-radius: 10px;
      border: 1px solid var(--border);
    }
    input[type="text"], select {
      width: 100%;
      padding: 8px 10px;
      border-radius: 7px;
      border: 1px solid var(--border);
      background: #1e293b;
      color: var(--text);
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 13px;
    }
    .toast {
      position: fixed;
      bottom: 22px;
      right: 22px;
      background: #065f46;
      border: 1px solid #10b981;
      color: white;
      padding: 12px 18px;
      border-radius: 10px;
      font-weight: 600;
      display: none;
      z-index: 999;
    }
    .log-item {
      background: #0f172a;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 10px;
      font-size: 13px;
    }
    code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; color: #38bdf8; }
    .muted { color: var(--muted); font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>⚡ G1 ACQ PC Control Center (Điều Khiển Trực Tiếp iPhone)</h1>
        <div class="muted" id="urls-info">Đang kết nối máy chủ local...</div>
      </div>
      <div class="status-bar">
        <span class="pill ok" id="active-preset-pill">Đang tải...</span>
        <span class="pill" id="git-sync-pill">GitHub Sync: Sẵn sàng</span>
      </div>
    </header>

    <section>
      <h2>1. Chọn Bộ Mẫu 1 Chạm (Bấm Trên Máy Tính → Tự Áp Dụng Cho iPhone)</h2>
      <p class="muted" style="margin-top:0">
        Khi bấm <strong>Áp dụng từ PC</strong>, cấu hình sẽ được phát trực tiếp qua mạng LAN (<code>0ms</code>) tới iPhone và đồng thời tự động push lên GitHub Cloud (để iPhone dùng 4G hoặc khác mạng Wi-Fi vẫn tự kéo về được). Sau khi bấm, chỉ cần <strong>vuốt đóng hẳn Google App trên iPhone rồi mở lại trang gói</strong>!
      </p>
      <div class="preset-grid" id="preset-grid"></div>
    </section>

    <div class="grid-2">
      <section>
        <h2>2. Chỉnh Sửa / Thêm Quy Tắc SKU Thủ Công Trên PC</h2>
        <p class="muted" style="margin-top:0">Mỗi nút nguồn nên gắn 1 mã đích duy nhất (Exact) để tránh lỗi trùng ID trên trang Google One.</p>
        <div id="rules-container"></div>
        <div style="display:flex; gap:10px; margin-top:14px; flex-wrap:wrap;">
          <button class="secondary" onclick="addEmptyRule()">+ Thêm dòng quy tắc</button>
          <button onclick="saveCustomRules()">💾 Lưu & Phát Sang iPhone</button>
        </div>
      </section>

      <section>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <h2 style="margin:0">3. Nhật Ký iPhone Bắt Gói (Real-time)</h2>
          <button class="secondary" style="padding:5px 10px; font-size:12px" onclick="clearTelemetry()">Xóa log</button>
        </div>
        <p class="muted" style="margin-top:0">Hiển thị tức thời mỗi khi iPhone mở trang gói Google One (khi cùng mạng LAN).</p>
        <div id="telemetry-container"><div class="muted">Đang chờ iPhone mở trang gói Google One...</div></div>
      </section>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    let appState = null;
    let draftRules = null;

    function showToast(msg) {
      const el = document.getElementById("toast");
      el.textContent = msg;
      el.style.display = "block";
      setTimeout(() => { el.style.display = "none"; }, 3500);
    }

    async function fetchState(preserveDraft = true) {
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
      document.getElementById("urls-info").innerHTML =
        "Web PC: <code>" + appState.localUrl + "</code> · IP LAN cho iPhone: <code>" + appState.lanUrl + "/api/config</code> · Revision: <code>" + appState.config.revision.slice(0, 10) + "</code>";
      document.getElementById("active-preset-pill").textContent =
        "Đang bật: " + (appState.config.activePresetId || "custom") + " (" + appState.config.rules.filter(r => r.enabled).length + " rule)";
      const gitPill = document.getElementById("git-sync-pill");
      gitPill.textContent = appState.gitSyncStatus.message;
      gitPill.className = "pill " + (appState.gitSyncStatus.state === "ok" ? "ok" : "sync");
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
      const container = document.getElementById("preset-grid");
      container.innerHTML = appState.presets.map(p => {
        const active = isPresetMatched(p);
        const pairs = p.rules.map(r =>
          '<div class="pair-row"><span>' + r.from + '</span><span class="arrow">→</span><strong>' + r.to + '</strong></div>'
        ).join("");
        return '<div class="preset-card ' + (active ? 'active' : '') + '">' +
          '<div class="preset-title">' + p.title + '</div>' +
          '<p class="preset-desc">' + p.description + '</p>' +
          '<div class="pair-list">' + pairs + '</div>' +
          '<button class="' + (active ? 'success' : '') + '" style="margin-top:auto" onclick="applyPreset(\\'' + p.id + '\\')">' +
          (active ? '✓ Đang áp dụng trên iPhone' : '⚡ Áp dụng ngay từ PC') +
          '</button></div>';
      }).join("");
    }

    function renderRules() {
      const container = document.getElementById("rules-container");
      if (!draftRules || !draftRules.length) {
        container.innerHTML = '<div class="muted">Chưa có quy tắc nào. Bấm "+ Thêm dòng quy tắc" hoặc chọn 1 bộ mẫu ở trên.</div>';
        return;
      }
      container.innerHTML = draftRules.map((r, i) =>
        '<div class="rule-row">' +
          '<select onchange="draftRules[' + i + '].match=this.value">' +
            '<option value="exact" ' + (r.match === "exact" ? "selected" : "") + '>Exact (1-1)</option>' +
            '<option value="prefix" ' + (r.match === "prefix" ? "selected" : "") + '>Prefix (.)</option>' +
          '</select>' +
          '<input type="text" value="' + r.from + '" placeholder="SKU gốc (vd: g1.ios.20tb.m.v2)" oninput="draftRules[' + i + '].from=this.value">' +
          '<input type="text" value="' + r.to + '" placeholder="SKU đích" oninput="draftRules[' + i + '].to=this.value">' +
          '<label style="display:flex;align-items:center;gap:5px;font-size:13px"><input type="checkbox" ' + (r.enabled ? "checked" : "") + ' onchange="draftRules[' + i + '].enabled=this.checked">Bật</label>' +
          '<button class="danger" onclick="removeRule(' + i + ')">Xóa</button>' +
        '</div>'
      ).join("");
    }

    function addEmptyRule() {
      if (!draftRules) draftRules = [];
      draftRules.push({ id: "", match: "exact", from: "g1.ios.20tb.m.v2", to: "com.google.gemini.2tb.ai.m.3month_ip_99p", enabled: true });
      renderRules();
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
      const container = document.getElementById("telemetry-container");
      if (!appState.telemetry || !appState.telemetry.length) {
        container.innerHTML = '<div class="muted">Chưa có gói tin nào từ iPhone. Hãy mở Google App → Quản lý Google One trên iPhone.</div>';
        return;
      }
      container.innerHTML = appState.telemetry.map(t => {
        const rewrites = (t.matchedFrom || []).map(m => '<div><code>' + m.id + '</code> → <strong>' + m.to + '</strong> (x' + m.count + ')</div>').join("");
        return '<div class="log-item">' +
          '<div style="display:flex;justify-content:space-between"><strong>Hits: ' + t.hitCount + ' (' + t.source + ')</strong><span class="muted">' + t.at.slice(11, 19) + ' UTC</span></div>' +
          '<div class="muted" style="word-break:break-all;margin:4px 0">' + t.url + '</div>' +
          (rewrites || '<div class="muted">Không có SKU nào khớp quy tắc</div>') +
        '</div>';
      }).join("");
    }

    async function clearTelemetry() {
      await fetch("/api/telemetry/clear", { method: "POST" });
      fetchState(true);
    }

    fetchState(false);
    setInterval(() => fetchState(true), 2000);
  </script>
</body>
</html>`;

server.listen(PORT, HOST, () => {
  console.log("[G1-PC-Server] Running at http://localhost:" + PORT + " and http://" + LAN_IP + ":" + PORT);
});
