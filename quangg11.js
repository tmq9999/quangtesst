/**
 * quangg11.js — Shadowrocket script cho Google AI Ultra (20TB / 30TB)
 * Repo: https://github.com/tmq9999/quangtesst
 *
 * Hỗ trợ 2 chế độ:
 *   1. Ngay trong Google App (trang one.google.com/ai): dùng CSP nonce gốc của Google + stopPropagation
 *      để không bị WIZ/WKWebView chặn click, lưu cấu hình qua fetch ngầm đồng nguồn (/ai?__quang_save=1) rồi tự reload.
 *   2. Trên Safari (https://one.google.com/g1-sku-report): trang điều khiển độc lập 1 chạm.
 */
"use strict";

console.log("[g1-acq-ultra] v9 loaded");

var STORE_U20 = "quang.ultra.u20.v2";
var STORE_U30 = "quang.ultra.u30.v2";
var STORE_SEEN = "quang.ultra.seen.v2";

/* Danh sách Preset CHỈ GÓI ULTRA (75p / 6 Tháng / 1 Năm / 1 Tháng Free Trial / TR / Gemini) */
var ULTRA_PRESETS = [
  {
    id: "p_75p",
    name: "Mặc định (crhywun v7.8+): Ultra 20TB & 30TB · 3 Tháng Giảm 75%",
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
    name: "Bộ Thổ Nhĩ Kỳ (TR): Ultra 20TB 75p + Ultra 30TB mã gốc cũ (g1.ios.30tb.m)",
    u20: "g1.20tb.3months_ip_75p.acq",
    u30: "g1.ios.30tb.m"
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
    name: "Test 4: Ultra 30TB · 6month_eft.acq (số ít) & 180days_eft.acq",
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
    id: "p6",
    name: "Test 6: Ultra 30TB nhánh g1.30tb · 6 Tháng & 12 Tháng (.acq)",
    u20: "g1.30tb.6months_eft.acq",
    u30: "g1.30tb.12months_eft.acq"
  },
  {
    id: "p7",
    name: "Test 7: Ultra 20TB · 6 Tháng (.acq) & 12 Tháng (g1.play.20tb.12months_eft)",
    u20: "g1.20tb.6months_eft.acq",
    u30: "g1.play.20tb.12months_eft"
  },
  {
    id: "p8",
    name: "Test 8: Ultra 20TB · 12 Tháng (.acq) & 1 Năm (1year_eft.acq)",
    u20: "g1.20tb.12months_eft.acq",
    u30: "g1.20tb.1year_eft.acq"
  },
  {
    id: "p_gemini_eft",
    name: "Test 9: Namespace Gemini · AI Ultra 6 Tháng & 12 Tháng EFT",
    u20: "com.google.gemini.ai.ultra.m.6month_eft",
    u30: "com.google.gemini.ai.ultra.m.12month_eft"
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

function applyParamsFromUrl(reqUrl) {
  var pid = getQueryParam(reqUrl, "upreset");
  var q20 = getQueryParam(reqUrl, "u20");
  var q30 = getQueryParam(reqUrl, "u30");
  var msg = "";

  if (pid) {
    for (var i = 0; i < ULTRA_PRESETS.length; i++) {
      if (ULTRA_PRESETS[i].id === pid) {
        writeStore(STORE_U20, ULTRA_PRESETS[i].u20);
        writeStore(STORE_U30, ULTRA_PRESETS[i].u30);
        msg = "Đã lưu: " + ULTRA_PRESETS[i].name;
        break;
      }
    }
  } else if (q20 || q30) {
    if (q20) writeStore(STORE_U20, q20);
    if (q30) writeStore(STORE_U30, q30);
    msg = "Đã lưu mã SKU Ultra tùy chỉnh!";
  }
  return msg;
}

function serveSafariReport(reqUrl) {
  var msg = applyParamsFromUrl(reqUrl);
  var activeU20 = readStore(STORE_U20, ULTRA_PRESETS[0].u20);
  var activeU30 = readStore(STORE_U30, ULTRA_PRESETS[0].u30);
  var historySkus = [];
  try {
    var parsed = JSON.parse(readStore(STORE_SEEN, "[]"));
    if (Array.isArray(parsed)) historySkus = parsed;
  } catch (e) {}

  var cards = "";
  for (var i = 0; i < ULTRA_PRESETS.length; i++) {
    var pr = ULTRA_PRESETS[i];
    var isCur = (pr.u20 === activeU20 && pr.u30 === activeU30);
    cards +=
      "<a href=\"/g1-sku-report?upreset=" + encodeURIComponent(pr.id) + "&_t=" + Date.now() + "\" style=\"display:block;padding:10px 12px;margin:8px 0;border-radius:8px;text-decoration:none;font-size:13px;" +
      (isCur ? "background:#1d4ed8;color:#fff;border:1px solid #60a5fa;" : "background:#1e293b;color:#e2e8f0;border:1px solid #334155;") + "\">" +
      "<b>" + (isCur ? "✅ ĐANG DÙNG: " : "👉 Chọn: ") + htmlEsc(pr.name) + "</b><br>" +
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
      "<a href=\"/g1-sku-report?u20=" + encodeURIComponent(s) + "&u30=" + encodeURIComponent(activeU30) + "\" style=\"color:#93c5fd;margin-right:8px;\">[Gán 20TB]</a>" +
      "<a href=\"/g1-sku-report?u20=" + encodeURIComponent(activeU20) + "&u30=" + encodeURIComponent(s) + "\" style=\"color:#fde047;\">[Gán 30TB]</a>" +
      "</span></div>";
  }

  var html =
    "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
    "<title>QUANGPRO Ultra SKU Switcher</title></head>" +
    "<body style=\"font-family:-apple-system,sans-serif;background:#0f172a;color:#f8fafc;padding:14px;margin:0;\">" +
    "<h3 style=\"margin:0 0 8px;color:#60a5fa;\">⚡ Bảng Đổi Mã Google AI Ultra (v9)</h3>" +
    (msg ? "<div style=\"padding:10px;margin-bottom:10px;background:#14532d;color:#86efac;border-radius:8px;font-weight:bold;\">" + htmlEsc(msg) + " — Giờ hãy mở lại trang Xem chi tiết trong Google App!</div>" : "") +
    "<div style=\"background:#1e293b;padding:10px;border-radius:8px;font-size:12px;line-height:1.6;margin-bottom:12px;\">" +
    "<div><b>Nút 20TB đang gán:</b> <code style=\"color:#93c5fd;\">" + htmlEsc(activeU20) + "</code></div>" +
    "<div><b>Nút 30TB đang gán:</b> <code style=\"color:#fde047;\">" + htmlEsc(activeU30) + "</code></div></div>" +
    "<form method=\"GET\" action=\"/g1-sku-report\" style=\"background:#1e293b;padding:10px;border-radius:8px;margin-bottom:12px;\">" +
    "<div style=\"font-weight:bold;margin-bottom:6px;font-size:13px;\">Nhập tay mã SKU Ultra bất kỳ:</div>" +
    "<input type=\"text\" name=\"u20\" value=\"" + htmlEsc(activeU20) + "\" style=\"width:100%;box-sizing:border-box;padding:8px;margin-bottom:6px;border-radius:6px;border:1px solid #475569;background:#0f172a;color:#93c5fd;font-family:monospace;\">" +
    "<input type=\"text\" name=\"u30\" value=\"" + htmlEsc(activeU30) + "\" style=\"width:100%;box-sizing:border-box;padding:8px;margin-bottom:8px;border-radius:6px;border:1px solid #475569;background:#0f172a;color:#fde047;font-family:monospace;\">" +
    "<button type=\"submit\" style=\"width:100%;padding:9px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-weight:bold;\">Lưu cấu hình</button></form>" +
    "<div style=\"font-weight:bold;margin-bottom:6px;\">Chọn nhanh bộ mã Ultra:</div>" + cards +
    "<div style=\"font-weight:bold;margin:14px 0 6px;color:#38bdf8;\">Các mã SKU thu thập được từ Google (" + historySkus.length + "):</div>" +
    (seenHtml || "<div style=\"color:#94a3b8;font-size:12px;\">Chưa có dữ liệu — hãy mở trang nâng cấp trong Google App 1 lần.</div>") +
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

  /* Chế độ 1: Mở https://one.google.com/g1-sku-report trên Safari hoặc gọi API lưu ngầm */
  if (/^https:\/\/one\.google\.com\/g1-sku-report\/?(?:\?|$)/.test(reqUrl) && !isResponse) {
    if (getQueryParam(reqUrl, "ajax") === "1") {
      var ajaxMsg = applyParamsFromUrl(reqUrl);
      var cur20 = readStore(STORE_U20, ULTRA_PRESETS[0].u20);
      var cur30 = readStore(STORE_U30, ULTRA_PRESETS[0].u30);
      $done({
        response: {
          status: 200,
          headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
          body: JSON.stringify({ ok: true, msg: ajaxMsg, u20: cur20, u30: cur30 })
        }
      });
      return;
    }
    serveSafariReport(reqUrl);
    return;
  }

  if (!isResponse) {
    $done({});
    return;
  }

  var body = $response.body;
  if (typeof body !== "string" || body === "") {
    $done({});
    return;
  }

  /* Nếu gọi fetch ngầm vào /ai?__quang_save=1 (hoạt động cả khi chưa cài lại .sgmodule mới) */
  if (getQueryParam(reqUrl, "__quang_save") === "1") {
    var saveMsg = applyParamsFromUrl(reqUrl);
    var s20 = readStore(STORE_U20, ULTRA_PRESETS[0].u20);
    var s30 = readStore(STORE_U30, ULTRA_PRESETS[0].u30);
    $done({
      body: JSON.stringify({ ok: true, msg: saveMsg, u20: s20, u30: s30 })
    });
    return;
  }

  var flashMsg = applyParamsFromUrl(reqUrl);
  var activeU20 = readStore(STORE_U20, ULTRA_PRESETS[0].u20);
  var activeU30 = readStore(STORE_U30, ULTRA_PRESETS[0].u30);

  /* Quét toàn bộ mã SKU có trong trang /ai */
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
  console.log("[g1-acq-ultra] SKU trong trang (" + pageSkus.length + "): " + (pageSkus.join(", ") || "无"));

  var historySkus = [];
  try {
    var parsedHist = JSON.parse(readStore(STORE_SEEN, "[]"));
    if (Array.isArray(parsedHist)) historySkus = parsedHist;
  } catch (e) {}
  for (var hIdx = 0; hIdx < pageSkus.length; hIdx++) {
    if (historySkus.indexOf(pageSkus[hIdx]) === -1 && historySkus.length < 200) {
      historySkus.push(pageSkus[hIdx]);
    }
  }
  historySkus.sort();
  writeStore(STORE_SEEN, JSON.stringify(historySkus));

  /* Thay thế mã gốc iOS -> mã Ultra mục tiêu */
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
    if (n === 0 || from === SKU_MAP[from]) continue;
    var to = SKU_MAP[from];
    out = out.split(from).join(to);
    total += n;
    console.log("[g1-acq-ultra] " + from + " -> " + to + " x" + n);
  }

  /* Lấy CSP nonce gốc từ HTML của Google để script đổi bộ hoạt động 100% trong WKWebView */
  var nonceMatch = out.match(/<script\b[^>]*?\bnonce=["']([^"']+)["']/i);
  var nonceAttr = nonceMatch ? " nonce=\"" + htmlEsc(nonceMatch[1]) + "\"" : "";

  var presetBtns = "";
  for (var pIdx = 0; pIdx < ULTRA_PRESETS.length; pIdx++) {
    var pr = ULTRA_PRESETS[pIdx];
    var isCur = (pr.u20 === activeU20 && pr.u30 === activeU30);
    presetBtns +=
      "<button type=\"button\" class=\"qp-preset-btn\" data-u20=\"" + htmlEsc(pr.u20) + "\" data-u30=\"" + htmlEsc(pr.u30) + "\" " +
      "style=\"display:block;width:100%;text-align:left;padding:9px 10px;margin:6px 0;border-radius:8px;font-size:12px;line-height:1.4;cursor:pointer;" +
      (isCur ? "background:#1d4ed8;color:#ffffff;border:1px solid #60a5fa;" : "background:#1e293b;color:#e2e8f0;border:1px solid #334155;") + "\">" +
      "<b>" + (isCur ? "✅ ĐANG DÙNG: " : "⚡ ") + htmlEsc(pr.name) + "</b><br>" +
      "<span style=\"color:#93c5fd;font-family:monospace;font-size:11px;\">20TB &rarr; " + htmlEsc(pr.u20) + "</span><br>" +
      "<span style=\"color:#fde047;font-family:monospace;font-size:11px;\">30TB &rarr; " + htmlEsc(pr.u30) + "</span>" +
      "</button>";
  }

  var detectedHtml = "";
  for (var dIdx = 0; dIdx < pageSkus.length; dIdx++) {
    var dSku = pageSkus[dIdx];
    detectedHtml +=
      "<div style=\"display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1e293b;font-size:11px;font-family:monospace;\">" +
      "<span style=\"color:#38bdf8;word-break:break-all;\">" + htmlEsc(dSku) + "</span>" +
      "<span style=\"white-space:nowrap;margin-left:6px;\">" +
      "<button type=\"button\" class=\"qp-preset-btn\" data-u20=\"" + htmlEsc(dSku) + "\" data-u30=\"" + htmlEsc(activeU30) + "\" style=\"color:#93c5fd;padding:3px 6px;background:#0f172a;border:1px solid #334155;border-radius:4px;margin-right:4px;\">Gán 20TB</button>" +
      "<button type=\"button\" class=\"qp-preset-btn\" data-u20=\"" + htmlEsc(activeU20) + "\" data-u30=\"" + htmlEsc(dSku) + "\" style=\"color:#fde047;padding:3px 6px;background:#0f172a;border:1px solid #334155;border-radius:4px;\">Gán 30TB</button>" +
      "</span></div>";
  }

  var panelHtml =
    "<div id=\"qp-ultra-root\" style=\"position:fixed;top:54px;left:8px;right:8px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;\">" +
    "<div id=\"qp-toggle\" style=\"background:#0f172a;color:#60a5fa;border:1px solid #3b82f6;border-radius:10px;padding:8px 10px;font-weight:bold;box-shadow:0 6px 20px rgba(0,0,0,0.6);cursor:pointer;\">" +
    "⚡ ULTRA SKU [20TB: " + htmlEsc(activeU20) + "] (Chạm mở bảng đổi)" +
    "</div>" +
    "<div id=\"qp-body\" style=\"display:none;margin-top:4px;background:#0f172a;color:#f8fafc;border:1px solid #3b82f6;border-radius:10px;padding:10px;max-height:72vh;overflow-y:auto;box-shadow:0 10px 28px rgba(0,0,0,0.8);\">" +
    "<div id=\"qp-status\" style=\"display:" + (flashMsg ? "block" : "none") + ";padding:8px;margin-bottom:8px;background:#14532d;color:#86efac;border-radius:6px;font-weight:bold;\">" + htmlEsc(flashMsg) + "</div>" +
    "<div style=\"margin-bottom:8px;background:#1e293b;padding:8px;border-radius:6px;font-size:11px;line-height:1.5;\">" +
    "<div><b>Nút 20TB:</b> <code id=\"qp-cur20\" style=\"color:#93c5fd;\">" + htmlEsc(activeU20) + "</code></div>" +
    "<div><b>Nút 30TB:</b> <code id=\"qp-cur30\" style=\"color:#fde047;\">" + htmlEsc(activeU30) + "</code></div>" +
    "<div><b>Đã thay thế:</b> " + total + " vị trí | Safari: <code>one.google.com/g1-sku-report</code></div>" +
    "</div>" +
    "<div style=\"margin-bottom:10px;background:#1e293b;padding:8px;border-radius:6px;\">" +
    "<div style=\"font-weight:bold;margin-bottom:4px;\">Nhập tay mã SKU Ultra:</div>" +
    "<input id=\"qp-in20\" type=\"text\" value=\"" + htmlEsc(activeU20) + "\" style=\"width:100%;box-sizing:border-box;padding:6px;margin-bottom:4px;border-radius:4px;border:1px solid #475569;background:#0f172a;color:#93c5fd;font-family:monospace;font-size:12px;\">" +
    "<input id=\"qp-in30\" type=\"text\" value=\"" + htmlEsc(activeU30) + "\" style=\"width:100%;box-sizing:border-box;padding:6px;margin-bottom:6px;border-radius:4px;border:1px solid #475569;background:#0f172a;color:#fde047;font-family:monospace;font-size:12px;\">" +
    "<button type=\"button\" id=\"qp-apply-custom\" style=\"width:100%;padding:8px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-weight:bold;font-size:12px;\">Lưu &amp; Tải lại trang</button>" +
    "</div>" +
    "<div style=\"font-weight:bold;margin:6px 0 4px;\">Chạm chọn bộ mã Ultra:</div>" +
    presetBtns +
    "<div style=\"font-weight:bold;margin:10px 0 4px;color:#38bdf8;\">Mã SKU Google trả về trong trang /ai này (" + pageSkus.length + "):</div>" +
    (detectedHtml || "<div style=\"color:#94a3b8;font-size:11px;\">Không tìm thấy mã g1.*</div>") +
    "</div></div>" +
    "<script" + nonceAttr + ">(function(){" +
    "var root=document.getElementById('qp-ultra-root');" +
    "var tog=document.getElementById('qp-toggle');" +
    "var bd=document.getElementById('qp-body');" +
    "var st=document.getElementById('qp-status');" +
    "if(!root||!tog||!bd)return;" +
    "['click','touchstart','touchend','mousedown','mouseup'].forEach(function(evName){" +
    "  root.addEventListener(evName,function(e){e.stopPropagation();},false);" +
    "});" +
    "tog.addEventListener('click',function(e){" +
    "  e.preventDefault();e.stopPropagation();" +
    "  bd.style.display=(bd.style.display==='none')?'block':'none';" +
    "});" +
    "function savePair(u20,u30){" +
    "  st.style.display='block';" +
    "  st.style.background='#1e3a8a';st.style.color='#93c5fd';" +
    "  st.textContent='⏳ Đang lưu mã SKU mới...';" +
    "  var q='u20='+encodeURIComponent(u20)+'&u30='+encodeURIComponent(u30)+'&_t='+Date.now();" +
    "  fetch('/g1-sku-report?ajax=1&'+q,{credentials:'same-origin',cache:'no-store'})" +
    "    .then(function(r){if(!r||!r.ok)throw new Error('fallback');return r.json();})" +
    "    .catch(function(){return fetch('/ai?__quang_save=1&'+q,{credentials:'same-origin',cache:'no-store'});})" +
    "    .then(function(){" +
    "      st.style.background='#14532d';st.style.color='#86efac';" +
    "      st.textContent='✅ ĐÃ LƯU ['+u20+' | '+u30+']! Đang tải lại (nếu trang đứng yên, bấm dấu X góc phải rồi bấm Xem chi tiết lại)...';" +
    "      setTimeout(function(){window.location.reload();},350);" +
    "    });" +
    "}" +
    "var btns=root.querySelectorAll('.qp-preset-btn');" +
    "for(var i=0;i<btns.length;i++){" +
    "  (function(b){" +
    "    b.addEventListener('click',function(e){" +
    "      e.preventDefault();e.stopPropagation();" +
    "      savePair(b.getAttribute('data-u20'),b.getAttribute('data-u30'));" +
    "    });" +
    "  })(btns[i]);" +
    "}" +
    "var ap=document.getElementById('qp-apply-custom');" +
    "if(ap){ap.addEventListener('click',function(e){" +
    "  e.preventDefault();e.stopPropagation();" +
    "  savePair(document.getElementById('qp-in20').value.trim(),document.getElementById('qp-in30').value.trim());" +
    "});}" +
    "})();</script>";

  if (out.indexOf("</body>") !== -1) {
    out = out.replace("</body>", panelHtml + "</body>");
  } else {
    out = out + panelHtml;
  }

  $done({ body: out });
}

run();
