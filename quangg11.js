/**
 * quangg11.js — Shadowrocket http-response script cho Google AI Ultra (20TB / 30TB)
 * Repo: https://github.com/tmq9999/quangtesst
 *
 * Tính năng:
 *   1. CHỈ GÓI ULTRA (20TB 5x & 30TB 20x) — không dùng gói Pro.
 *   2. Tự động quét toàn bộ mã SKU (cả .acq, _eft, 6months, 12months, 1year...) có trong phản hồi one.google.com/ai.
 *   3. Bảng chọn nhanh (Floating HUD) gắn trực tiếp vào trang one.google.com/ai trong Google App (icon G):
 *      chạm 1 phát để đổi cặp mã SKU Ultra 6 Tháng / 1 Năm Free Trial cho 2 nút 20TB & 30TB mà không cần sửa code hay push GitHub lại.
 */
"use strict";

console.log("[g1-acq-ultra] v8 ultra-only loaded");

var STORE_U20 = "quang.ultra.u20.v1";
var STORE_U30 = "quang.ultra.u30.v1";
var STORE_SEEN = "quang.ultra.seen.v1";

/* Danh sách Preset CHỈ GÓI ULTRA (99p / 75p / 6 Tháng / 1 Năm / 1 Tháng Free Trial) */
var ULTRA_PRESETS = [
  {
    id: "p_gemini99",
    name: "Bộ Gist hectocg25: Gemini AI Ultra 3 Tháng 99p (giảm 99%)",
    u20: "com.google.gemini.ai.ultra.m.3month_ip_99p",
    u30: "com.google.gemini.20tb.ai.m.3month_ip_99p"
  },
  {
    id: "p_gemini_eft",
    name: "Bộ Gemini Namespace: AI Ultra 6 Tháng & 12 Tháng EFT",
    u20: "com.google.gemini.ai.ultra.m.6month_eft",
    u30: "com.google.gemini.ai.ultra.m.12month_eft"
  },
  {
    id: "p_75p",
    name: "Bộ Ultra 75p (crhywun v7.8+): Ultra 20TB & 30TB 3 Tháng Giảm 75%",
    u20: "g1.20tb.3months_ip_75p.acq",
    u30: "g1.ai.ultra.3months_ip_75p.acq"
  },
  {
    id: "p1",
    name: "Bộ 1: Ultra 30TB · 6 Tháng & 1 Năm Free Trial (.acq)",
    u20: "g1.ai.ultra.6months_eft.acq",
    u30: "g1.ai.ultra.12months_eft.acq"
  },
  {
    id: "p2",
    name: "Bộ 2: Ultra 30TB · 1 Năm (1year_eft.acq) & 6 Tháng (không .acq)",
    u20: "g1.ai.ultra.6months_eft",
    u30: "g1.ai.ultra.1year_eft.acq"
  },
  {
    id: "p3",
    name: "Bộ 3: Ultra 30TB · 12 Tháng & 1 Năm (không .acq)",
    u20: "g1.ai.ultra.12months_eft",
    u30: "g1.ai.ultra.1year_eft"
  },
  {
    id: "p4",
    name: "Bộ 4: Ultra 30TB · 6month_eft.acq (số ít) & 180days_eft.acq",
    u20: "g1.ai.ultra.6month_eft.acq",
    u30: "g1.ai.ultra.180days_eft.acq"
  },
  {
    id: "p5",
    name: "Bộ 5: Ultra 30TB nhánh play · 6 Tháng & 12 Tháng",
    u20: "g1.play.ai.pro.6months_eft",
    u30: "g1.play.ai.pro.12months_eft"
  },
  {
    id: "p6",
    name: "Bộ 6: Ultra 30TB nhánh g1.30tb · 6 Tháng & 12 Tháng (.acq)",
    u20: "g1.30tb.6months_eft.acq",
    u30: "g1.30tb.12months_eft.acq"
  },
  {
    id: "p7",
    name: "Bộ 7: Ultra 20TB · 6 Tháng (.acq) & 12 Tháng (g1.play.20tb.12months_eft)",
    u20: "g1.20tb.6months_eft.acq",
    u30: "g1.play.20tb.12months_eft"
  },
  {
    id: "p8",
    name: "Bộ 8: Ultra 20TB · 12 Tháng (.acq) & 1 Năm (1year_eft.acq)",
    u20: "g1.20tb.12months_eft.acq",
    u30: "g1.20tb.1year_eft.acq"
  },
  {
    id: "p9",
    name: "Bộ 9: Ultra 20TB · 6 Tháng & 12 Tháng (không .acq)",
    u20: "g1.20tb.6months_eft",
    u30: "g1.20tb.12months_eft"
  },
  {
    id: "p10",
    name: "Bộ 10: Ultra 20TB & 30TB · 3 Tháng Free Trial (.acq)",
    u20: "g1.20tb.3months_eft.acq",
    u30: "g1.ai.ultra.3months_eft.acq"
  },
  {
    id: "p11",
    name: "Bộ 11 (Gốc): Ultra 30TB 1 Tháng $0 + Ultra 30TB 3 Tháng Giảm 90%",
    u20: "g1.ai.ultra.1month_eft.acq",
    u30: "g1.ai.ultra.3months_ip_90p.acq"
  },
  {
    id: "p12",
    name: "Bộ 12: Ultra 20TB 1 Tháng $0 + Ultra 30TB 1 Tháng $0",
    u20: "g1.20tb.1month_eft.acq",
    u30: "g1.ai.ultra.1month_eft.acq"
  }
];

/* Dự phòng khi chọn bộ giảm 90% */
var FALLBACK = {
  "g1.ai.ultra.3months_ip_90p.acq": "g1.ai.ultra.3months_ip_75p.acq",
  "g1.20tb.3months_ip_90p.acq": "g1.20tb.3months_ip_75p.acq"
};

function readStore(key, defVal) {
  try {
    if (typeof $persistentStore !== "undefined" && typeof $persistentStore.read === "function") {
      var v = $persistentStore.read(key);
      if (v && typeof v === "string" && v.trim() !== "") return v.trim();
    }
  } catch (e) {}
  return defVal;
}

function writeStore(key, val) {
  try {
    if (typeof $persistentStore !== "undefined" && typeof $persistentStore.write === "function") {
      $persistentStore.write(String(val), key);
    }
  } catch (e) {}
}

function getQueryParam(url, name) {
  var re = new RegExp("[?&]" + name + "=([^&#]*)");
  var m = re.exec(url);
  return m ? decodeURIComponent(m[1].replace(/\+/g, " ")).trim() : "";
}

function htmlEsc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function occurrences(s, needle) {
  return needle ? s.split(needle).length - 1 : 0;
}

function run() {
  var body = $response && $response.body;
  if (typeof body !== "string" || body === "") {
    $done({});
    return;
  }

  var reqUrl = (typeof $request === "object" && $request && $request.url) ? String($request.url) : "https://one.google.com/ai?utm_campaign=SEARCH_MANAGE_PLAN";

  /* 1. Đọc lựa chọn đổi SKU từ URL (khi bấm chọn bộ SKU ngay trong Google App) */
  var pid = getQueryParam(reqUrl, "upreset");
  var q20 = getQueryParam(reqUrl, "u20");
  var q30 = getQueryParam(reqUrl, "u30");
  var flashMsg = "";

  if (pid) {
    for (var i = 0; i < ULTRA_PRESETS.length; i++) {
      if (ULTRA_PRESETS[i].id === pid) {
        writeStore(STORE_U20, ULTRA_PRESETS[i].u20);
        writeStore(STORE_U30, ULTRA_PRESETS[i].u30);
        flashMsg = "Đã áp dụng: " + ULTRA_PRESETS[i].name;
        break;
      }
    }
  } else if (q20 || q30) {
    if (q20) writeStore(STORE_U20, q20);
    if (q30) writeStore(STORE_U30, q30);
    flashMsg = "Đã lưu mã SKU Ultra tùy chỉnh!";
  }

  var activeU20 = readStore(STORE_U20, ULTRA_PRESETS[0].u20);
  var activeU30 = readStore(STORE_U30, ULTRA_PRESETS[0].u30);

  /* 2. Quét toàn bộ mã SKU có mặt trong phản hồi gốc của Google (giải mã cả \u002e) */
  var decoded = body.replace(/\\u002e|\\x2e/gi, ".");
  var allMatches = decoded.match(/\b(?:g1\.|com\.google\.(?:one|gemini)\.)[A-Za-z0-9._-]{3,80}\b/g) || [];
  var seenMap = {};
  var pageSkus = [];
  for (var mIdx = 0; mIdx < allMatches.length; mIdx++) {
    var s = allMatches[mIdx];
    if (!seenMap[s]) {
      seenMap[s] = 1;
      pageSkus.push(s);
    }
  }
  pageSkus.sort();
  console.log("[g1-acq-ultra] Toàn bộ SKU trong trang (" + pageSkus.length + "): " + (pageSkus.join(", ") || "无"));

  /* Lưu tích lũy các mã SKU từng xuất hiện */
  var historySkus = [];
  try {
    var oldJson = readStore(STORE_SEEN, "[]");
    var parsed = JSON.parse(oldJson);
    if (Array.isArray(parsed)) historySkus = parsed;
  } catch (e) {}
  for (var hIdx = 0; hIdx < pageSkus.length; hIdx++) {
    if (historySkus.indexOf(pageSkus[hIdx]) === -1 && historySkus.length < 200) {
      historySkus.push(pageSkus[hIdx]);
    }
  }
  historySkus.sort();
  writeStore(STORE_SEEN, JSON.stringify(historySkus));

  /* 3. Thực hiện thay thế mã gốc iOS -> mã Ultra mục tiêu (bao gồm cả g1.ios.5tb.m.v2) */
  var SKU_MAP = {
    "g1.ios.20tb.m.v2": activeU20,
    "g1.ios.5tb.m.v2": activeU20,
    "g1.ios.30tb.ai.pro.m": activeU30,
    "g1.ios.30tb.m": activeU30
  };

  var out = body;
  var total = 0;
  var froms = Object.keys(SKU_MAP);
  for (var k = 0; k < froms.length; k++) {
    var from = froms[k];
    var n = occurrences(out, from);
    if (n === 0) continue;

    var to = SKU_MAP[from];
    if (pageSkus.indexOf(to) === -1 && FALLBACK[to] && pageSkus.indexOf(FALLBACK[to]) !== -1) {
      console.log("[g1-acq-ultra] 主档不在目录,降级 " + to + " -> " + FALLBACK[to]);
      to = FALLBACK[to];
    }

    out = out.split(from).join(to);
    total += n;
    console.log("[g1-acq-ultra] " + from + " -> " + to + " x" + n);
  }

  /* 4. Nhúng thanh chọn nhanh SKU Ultra (thu gọn ở góc trên, thuần HTML không bị chặn bởi CSP) */
  var basePath = reqUrl.split("?")[0] || "https://one.google.com/ai";
  var presetLinks = "";
  for (var pIdx = 0; pIdx < ULTRA_PRESETS.length; pIdx++) {
    var pr = ULTRA_PRESETS[pIdx];
    var isCur = (pr.u20 === activeU20 && pr.u30 === activeU30);
    var href = basePath + "?utm_campaign=SEARCH_MANAGE_PLAN&utm_source=search&upreset=" + encodeURIComponent(pr.id) + "&_t=" + Date.now();
    presetLinks +=
      "<a href=\"" + htmlEsc(href) + "\" style=\"display:block;padding:8px 10px;margin:6px 0;border-radius:8px;text-decoration:none;font-size:12px;line-height:1.4;" +
      (isCur ? "background:#1d4ed8;color:#ffffff;border:1px solid #60a5fa;" : "background:#1e293b;color:#e2e8f0;border:1px solid #334155;") + "\">" +
      "<b>" + (isCur ? "✅ " : "⚡ ") + htmlEsc(pr.name) + "</b><br>" +
      "<span style=\"color:#93c5fd;font-family:monospace;font-size:11px;\">Nút 20TB &rarr; " + htmlEsc(pr.u20) + "</span><br>" +
      "<span style=\"color:#fde047;font-family:monospace;font-size:11px;\">Nút 30TB &rarr; " + htmlEsc(pr.u30) + "</span>" +
      "</a>";
  }

  var detectedHtml = "";
  for (var dIdx = 0; dIdx < pageSkus.length; dIdx++) {
    var dSku = pageSkus[dIdx];
    var set20Href = basePath + "?utm_campaign=SEARCH_MANAGE_PLAN&utm_source=search&u20=" + encodeURIComponent(dSku) + "&u30=" + encodeURIComponent(activeU30) + "&_t=" + Date.now();
    var set30Href = basePath + "?utm_campaign=SEARCH_MANAGE_PLAN&utm_source=search&u20=" + encodeURIComponent(activeU20) + "&u30=" + encodeURIComponent(dSku) + "&_t=" + Date.now();
    detectedHtml +=
      "<div style=\"display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1e293b;font-size:11px;font-family:monospace;\">" +
      "<span style=\"color:#38bdf8;word-break:break-all;\">" + htmlEsc(dSku) + "</span>" +
      "<span style=\"white-space:nowrap;margin-left:6px;\">" +
      "<a href=\"" + htmlEsc(set20Href) + "\" style=\"color:#93c5fd;text-decoration:none;padding:2px 5px;background:#0f172a;border:1px solid #334155;border-radius:4px;margin-right:4px;\">Gán 20TB</a>" +
      "<a href=\"" + htmlEsc(set30Href) + "\" style=\"color:#fde047;text-decoration:none;padding:2px 5px;background:#0f172a;border:1px solid #334155;border-radius:4px;\">Gán 30TB</a>" +
      "</span></div>";
  }

  var panelHtml =
    "<details style=\"position:fixed;top:6px;left:6px;right:6px;z-index:2147483647;background:#0f172a;color:#f8fafc;border:1px solid #3b82f6;border-radius:10px;padding:6px 10px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;box-shadow:0 8px 24px rgba(0,0,0,0.65);max-height:82vh;overflow-y:auto;\">" +
    "<summary style=\"cursor:pointer;font-weight:600;color:#60a5fa;outline:none;list-style:none;\">" +
    "⚡ ULTRA SKU [20TB: " + htmlEsc(activeU20) + "] | [30TB: " + htmlEsc(activeU30) + "] (Chạm đổi)" +
    "</summary>" +
    "<div style=\"margin-top:8px;padding-top:8px;border-top:1px solid #334155;\">" +
    (flashMsg ? "<div style=\"padding:6px 8px;margin-bottom:8px;background:#14532d;color:#86efac;border-radius:6px;font-weight:bold;\">" + htmlEsc(flashMsg) + "</div>" : "") +
    "<div style=\"margin-bottom:8px;background:#1e293b;padding:8px;border-radius:6px;font-size:11px;line-height:1.5;\">" +
    "<div><b>Nút 20TB (5x):</b> <code style=\"color:#93c5fd;\">" + htmlEsc(activeU20) + "</code></div>" +
    "<div><b>Nút 30TB (20x):</b> <code style=\"color:#fde047;\">" + htmlEsc(activeU30) + "</code></div>" +
    "<div><b>Số vị trí đã thay thế:</b> " + total + "</div>" +
    "</div>" +
    "<form method=\"GET\" action=\"" + htmlEsc(basePath) + "\" style=\"margin-bottom:10px;background:#1e293b;padding:8px;border-radius:6px;\">" +
    "<input type=\"hidden\" name=\"utm_campaign\" value=\"SEARCH_MANAGE_PLAN\">" +
    "<input type=\"hidden\" name=\"utm_source\" value=\"search\">" +
    "<div style=\"font-weight:bold;margin-bottom:4px;color:#e2e8f0;\">Nhập thử mã SKU Ultra bất kỳ:</div>" +
    "<div style=\"margin-bottom:4px;\"><input type=\"text\" name=\"u20\" value=\"" + htmlEsc(activeU20) + "\" placeholder=\"Mã cho nút 20TB\" style=\"width:100%;box-sizing:border-box;padding:6px;border-radius:4px;border:1px solid #475569;background:#0f172a;color:#93c5fd;font-family:monospace;font-size:12px;\"></div>" +
    "<div style=\"margin-bottom:6px;\"><input type=\"text\" name=\"u30\" value=\"" + htmlEsc(activeU30) + "\" placeholder=\"Mã cho nút 30TB\" style=\"width:100%;box-sizing:border-box;padding:6px;border-radius:4px;border:1px solid #475569;background:#0f172a;color:#fde047;font-family:monospace;font-size:12px;\"></div>" +
    "<button type=\"submit\" style=\"width:100%;padding:7px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-weight:bold;font-size:12px;\">Áp dụng &amp; Tải lại trang</button>" +
    "</form>" +
    "<div style=\"font-weight:bold;margin:6px 0 4px;color:#e2e8f0;\">Chọn nhanh 12 bộ SKU Google AI Ultra (6M / 1Y / 1M):</div>" +
    presetLinks +
    "<div style=\"font-weight:bold;margin:10px 0 4px;color:#38bdf8;\">Mã SKU Google trả về trong trang /ai này (" + pageSkus.length + "):</div>" +
    (detectedHtml || "<div style=\"color:#94a3b8;font-size:11px;\">Không tìm thấy mã g1.* nào trong response</div>") +
    "</div></details>";

  if (out.indexOf("</body>") !== -1) {
    out = out.replace("</body>", panelHtml + "</body>");
  } else {
    out = out + panelHtml;
  }

  console.log(total ? "[g1-acq-ultra] 共改写 " + total + " 处" : "[g1-acq-ultra] 未命中 (vẫn hiển thị HUD)");
  $done({ body: out });
}

run();
