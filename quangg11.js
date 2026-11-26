/**
 * quangg11.js — Google One AI Ultra (20TB / 30TB) cho Shadowrocket (v10)
 * Repo: https://github.com/tmq9999/quangtesst
 *
 * Nguyên tắc chống xoay vòng / chống lỗi "Something went wrong":
 *   1. Trên trang one.google.com/ai? : TUYỆT ĐỐI KHÔNG chèn HTML/JS vào trang của Google,
 *      chỉ thay đúng chuỗi SKU như bản v6 và trả $done({}) nếu không khớp (không đụng batchexecute).
 *   2. Đổi bộ mã SKU độc lập trên Safari tại: https://one.google.com/g1-sku-report
 */
"use strict";

var STORE_U20 = "quang.ultra.u20.v10";
var STORE_U30 = "quang.ultra.u30.v10";
var STORE_SEEN = "quang.ultra.seen.v10";

var ULTRA_PRESETS = [
  {
    id: "p_75p",
    name: "Mặc định: Ultra 20TB & 30TB · 3 Tháng Giảm 75% (crhywun v7.8+)",
    u20: "g1.20tb.3months_ip_75p.acq",
    u30: "g1.ai.ultra.3months_ip_75p.acq"
  },
  {
    id: "p12",
    name: "Bộ Trial 1M: Ultra 20TB 1 Tháng $0 + Ultra 30TB 1 Tháng $0",
    u20: "g1.20tb.1month_eft.acq",
    u30: "g1.ai.ultra.1month_eft.acq"
  },
  {
    id: "p11",
    name: "Bộ 90p: Ultra 20TB & 30TB · 3 Tháng Giảm 90%",
    u20: "g1.20tb.3months_ip_90p.acq",
    u30: "g1.ai.ultra.3months_ip_90p.acq"
  },
  {
    id: "p_tr",
    name: "Bộ Thổ Nhĩ Kỳ (TR): Ultra 20TB 75p + Ultra 30TB mã cũ (g1.ios.30tb.m)",
    u20: "g1.20tb.3months_ip_75p.acq",
    u30: "g1.ios.30tb.m"
  },
  {
    id: "p_gist99",
    name: "Bộ Gist hectocg25: Gemini AI Ultra 3 Tháng 99p",
    u20: "com.google.gemini.ai.ultra.m.3month_ip_99p",
    u30: "com.google.gemini.20tb.ai.m.3month_ip_99p"
  },
  {
    id: "p1",
    name: "Test 1: Ultra 30TB · 6 Tháng & 12 Tháng Free Trial (.acq)",
    u20: "g1.ai.ultra.6months_eft.acq",
    u30: "g1.ai.ultra.12months_eft.acq"
  },
  {
    id: "p2",
    name: "Test 2: Ultra 30TB · 6 Tháng (không .acq) & 1 Năm (1year_eft.acq)",
    u20: "g1.ai.ultra.6months_eft",
    u30: "g1.ai.ultra.1year_eft.acq"
  },
  {
    id: "p3",
    name: "Test 3: Ultra 30TB · 12 Tháng & 1 Năm (không .acq)",
    u20: "g1.ai.ultra.12months_eft",
    u30: "g1.ai.ultra.1year_eft"
  },
  {
    id: "p4",
    name: "Test 4: Ultra 30TB · 6month_eft.acq & 180days_eft.acq",
    u20: "g1.ai.ultra.6month_eft.acq",
    u30: "g1.ai.ultra.180days_eft.acq"
  },
  {
    id: "p5",
    name: "Test 5: Ultra 30TB nhánh play · 6 Tháng & 12 Tháng",
    u20: "g1.play.ai.pro.6months_eft",
    u30: "g1.play.ai.pro.12months_eft"
  },
  {
    id: "p7",
    name: "Test 6: Ultra 20TB · 6 Tháng (.acq) & 12 Tháng (g1.play.20tb.12months_eft)",
    u20: "g1.20tb.6months_eft.acq",
    u30: "g1.play.20tb.12months_eft"
  },
  {
    id: "p8",
    name: "Test 7: Ultra 20TB · 12 Tháng (.acq) & 1 Năm (1year_eft.acq)",
    u20: "g1.20tb.12months_eft.acq",
    u30: "g1.20tb.1year_eft.acq"
  }
];

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
      return Boolean($persistentStore.write(String(val), key));
    }
  } catch (e) {}
  return false;
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

function serveSafariReport(reqUrl) {
  var pid = getQueryParam(reqUrl, "upreset");
  var q20 = getQueryParam(reqUrl, "u20");
  var q30 = getQueryParam(reqUrl, "u30");
  var msg = "";

  if (pid) {
    for (var i = 0; i < ULTRA_PRESETS.length; i++) {
      if (ULTRA_PRESETS[i].id === pid) {
        writeStore(STORE_U20, ULTRA_PRESETS[i].u20);
        writeStore(STORE_U30, ULTRA_PRESETS[i].u30);
        msg = "Đã chuyển sang: " + ULTRA_PRESETS[i].name;
        break;
      }
    }
  } else if (q20 || q30) {
    if (q20) writeStore(STORE_U20, q20);
    if (q30) writeStore(STORE_U30, q30);
    msg = "Đã lưu mã SKU Ultra tùy chỉnh!";
  }

  var activeU20 = readStore(STORE_U20, ULTRA_PRESETS[0].u20);
  var activeU30 = readStore(STORE_U30, ULTRA_PRESETS[0].u30);
  var historySkus = [];
  try {
    var parsed = JSON.parse(readStore(STORE_SEEN, "[]"));
    if (Array.isArray(parsed)) historySkus = parsed;
  } catch (e) {}

  var cards = "";
  for (var k = 0; k < ULTRA_PRESETS.length; k++) {
    var pr = ULTRA_PRESETS[k];
    var isCur = (pr.u20 === activeU20 && pr.u30 === activeU30);
    cards +=
      "<a href=\"https://one.google.com/g1-sku-report?upreset=" + encodeURIComponent(pr.id) + "&_t=" + Date.now() + "\" " +
      "style=\"display:block;padding:10px 12px;margin:8px 0;border-radius:8px;text-decoration:none;font-size:13px;" +
      (isCur ? "background:#1d4ed8;color:#fff;border:1px solid #60a5fa;" : "background:#1e293b;color:#e2e8f0;border:1px solid #334155;") + "\">" +
      "<b>" + (isCur ? "✅ ĐANG BẬT: " : "👉 Bấm chọn: ") + htmlEsc(pr.name) + "</b><br>" +
      "<span style=\"color:#93c5fd;font-family:monospace;font-size:12px;\">20TB &rarr; " + htmlEsc(pr.u20) + "</span><br>" +
      "<span style=\"color:#fde047;font-family:monospace;font-size:12px;\">30TB &rarr; " + htmlEsc(pr.u30) + "</span></a>";
  }

  var seenHtml = "";
  for (var j = 0; j < historySkus.length; j++) {
    var s = historySkus[j];
    seenHtml +=
      "<div style=\"display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1e293b;font-family:monospace;font-size:12px;\">" +
      "<span style=\"color:#38bdf8;word-break:break-all;\">" + htmlEsc(s) + "</span>" +
      "<span style=\"white-space:nowrap;margin-left:8px;\">" +
      "<a href=\"https://one.google.com/g1-sku-report?u20=" + encodeURIComponent(s) + "&u30=" + encodeURIComponent(activeU30) + "\" style=\"color:#93c5fd;margin-right:8px;\">[Gán 20TB]</a>" +
      "<a href=\"https://one.google.com/g1-sku-report?u20=" + encodeURIComponent(activeU20) + "&u30=" + encodeURIComponent(s) + "\" style=\"color:#fde047;\">[Gán 30TB]</a>" +
      "</span></div>";
  }

  var html =
    "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
    "<title>Ultra SKU Switcher (v10)</title></head>" +
    "<body style=\"font-family:-apple-system,sans-serif;background:#0f172a;color:#f8fafc;padding:14px;margin:0;\">" +
    "<h3 style=\"margin:0 0 8px;color:#60a5fa;\">⚡ Đổi Mã Google AI Ultra (v10)</h3>" +
    (msg ? "<div style=\"padding:10px;margin-bottom:10px;background:#14532d;color:#86efac;border-radius:8px;font-weight:bold;\">✅ " + htmlEsc(msg) + "<br><small style=\"color:#bbf7d0;\">Giờ qua Google App đóng trang Google One rồi bấm Xem chi tiết lại!</small></div>" : "") +
    "<div style=\"background:#1e293b;padding:10px;border-radius:8px;font-size:12px;line-height:1.6;margin-bottom:12px;\">" +
    "<div><b>Nút 20TB / 5TB đang gán:</b> <code style=\"color:#93c5fd;\">" + htmlEsc(activeU20) + "</code></div>" +
    "<div><b>Nút 30TB đang gán:</b> <code style=\"color:#fde047;\">" + htmlEsc(activeU30) + "</code></div></div>" +
    "<form method=\"GET\" action=\"https://one.google.com/g1-sku-report\" style=\"background:#1e293b;padding:10px;border-radius:8px;margin-bottom:12px;\">" +
    "<div style=\"font-weight:bold;margin-bottom:6px;font-size:13px;\">Nhập tay mã SKU Ultra bất kỳ:</div>" +
    "<input type=\"text\" name=\"u20\" value=\"" + htmlEsc(activeU20) + "\" style=\"width:100%;box-sizing:border-box;padding:8px;margin-bottom:6px;border-radius:6px;border:1px solid #475569;background:#0f172a;color:#93c5fd;font-family:monospace;\">" +
    "<input type=\"text\" name=\"u30\" value=\"" + htmlEsc(activeU30) + "\" style=\"width:100%;box-sizing:border-box;padding:8px;margin-bottom:8px;border-radius:6px;border:1px solid #475569;background:#0f172a;color:#fde047;font-family:monospace;\">" +
    "<button type=\"submit\" style=\"width:100%;padding:9px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-weight:bold;\">Lưu cấu hình</button></form>" +
    "<div style=\"font-weight:bold;margin-bottom:6px;\">Chạm 1 lần để đổi bộ mã:</div>" + cards +
    "<div style=\"font-weight:bold;margin:14px 0 6px;color:#38bdf8;\">Mã SKU thu được từ trang /ai (" + historySkus.length + "):</div>" +
    (seenHtml || "<div style=\"color:#94a3b8;font-size:12px;\">Chưa có dữ liệu — hãy mở trang Xem chi tiết trong Google App 1 lần.</div>") +
    "</body></html>";

  $done({
    response: {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      body: html
    }
  });
}

function run() {
  var reqUrl = (typeof $request === "object" && $request && $request.url) ? String($request.url) : "";
  var isResponse = (typeof $response === "object" && $response !== null);

  /* 1. Chế độ trang điều khiển Safari: https://one.google.com/g1-sku-report */
  if (/^https:\/\/one\.google\.com\/g1-sku-report\/?(?:\?|$)/.test(reqUrl) && !isResponse) {
    serveSafariReport(reqUrl);
    return;
  }

  /* 2. Chế độ thay chuỗi thuần túy trên https://one.google.com/ai? (giống hệt v6, không chèn HTML) */
  if (!isResponse) {
    $done({});
    return;
  }

  var body = $response.body;
  if (typeof body !== "string" || body === "" || !/^https:\/\/one\.google\.com\/(?:u\/\d+\/)?ai\?/.test(reqUrl)) {
    $done({});
    return;
  }

  var activeU20 = readStore(STORE_U20, ULTRA_PRESETS[0].u20);
  var activeU30 = readStore(STORE_U30, ULTRA_PRESETS[0].u30);

  /* Quét ngầm SKU gốc lưu vào bộ nhớ để xem bên Safari (không sửa nội dung trang) */
  try {
    var decoded = body.replace(/\\u002e|\\x2e/gi, ".");
    var matches = decoded.match(/\b(?:g1\.|com\.google\.(?:one|gemini)\.)[A-Za-z0-9._-]{3,80}\b/g) || [];
    var historySkus = [];
    try {
      var p = JSON.parse(readStore(STORE_SEEN, "[]"));
      if (Array.isArray(p)) historySkus = p;
    } catch (e) {}
    var changed = false;
    for (var i = 0; i < matches.length; i++) {
      if (historySkus.indexOf(matches[i]) === -1 && historySkus.length < 200) {
        historySkus.push(matches[i]);
        changed = true;
      }
    }
    if (changed) {
      historySkus.sort();
      writeStore(STORE_SEEN, JSON.stringify(historySkus));
    }
  } catch (e) {}

  var SKU_MAP = {
    "g1.ios.20tb.m.v2": activeU20,
    "g1.ios.5tb.m.v2": activeU20,
    "g1.ios.30tb.ai.pro.m": activeU30
  };

  var out = body;
  var total = 0;
  var froms = Object.keys(SKU_MAP);
  for (var k = 0; k < froms.length; k++) {
    var from = froms[k];
    var to = SKU_MAP[from];
    if (!to || from === to) continue;
    var n = occurrences(out, from);
    if (n === 0) continue;
    out = out.split(from).join(to);
    total += n;
    console.log("[g1-acq-v10] " + from + " -> " + to + " x" + n);
  }

  /* QUAN TRỌNG: Nếu không có gì thay đổi thì trả $done({}) nguyên bản, tuyệt đối không ghi đè body */
  $done(total ? { body: out } : {});
}

run();
