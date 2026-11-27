/* Generated from g1-acq.js by tools/build-variants.cjs. */
/* Google One combined 2TB / 20TB / 30TB mappings for Shadowrocket. */
"use strict";

// BEGIN GENERATED MAPPING CONFIG
/* Shared local mapping configuration for the runtime and report controller. */
function createG1MappingConfig(store) {
  "use strict";

  var KEY = "g1.sku.mappings.v1";
  var LIMIT = 30;
  var DEFAULT_REVISION = "defaults-v96-99p";
  var SOURCE_PREFIX = "g1.ios.2tb.";
  var PRO_TARGET = "com.google.gemini.2tb.ai.m.3month_ip_99p";
  var READ_ERROR = "Bộ nhớ cấu hình cục bộ chưa sẵn sàng, phản hồi lần này giữ nguyên.";
  var CONFIG_ERROR = "Định dạng cấu hình ánh xạ lỗi, tạm dừng ghi đè; vui lòng khôi phục mặc định rồi sửa lại.";
  var WRITE_ERROR = "Kết quả lưu chưa qua kiểm tra đọc lại, vui lòng tải lại trang để xem cấu hình hiện tại.";
  var REVISION_ERROR = "Cấu hình đã thay đổi nên chưa lưu; trang đã tải quy tắc mới nhất, vui lòng thao tác lại.";
  var RULE_FIELDS = ["id", "match", "from", "to", "enabled"];
  var RECORD_FIELDS = ["schemaVersion", "revision", "updatedAt", "customized", "rules"];

  function defaults() {
    return [
      { id: "default-20tb", match: "exact", from: "g1.ios.20tb.m.v2", to: "com.google.gemini.2tb.ai.m.3month_ip_99p", enabled: true }
    ];
  }

  function presets() {
    return [
      {
        id: "pro-1yuan-20tb",
        title: "✅ 1. [100% SỐNG TRÊN iOS · MẶC ĐỊNH] Mở Google AI Pro (5 TB) Giảm 99% (Bấm nút Ultra 20TB)",
        description: "【26/11/2026 Đã test lên bảng Apple Pay】Chỉ đổi duy nhất nút Ultra 20TB (g1.ios.20tb.m.v2) -> com.google.gemini.2tb.ai.m.3month_ip_99p. Bấm nút Ultra 20TB sẽ hiện bảng Apple Pay gói Google AI Pro (5 TB) giảm 99% 3 tháng đầu (Mỹ $0.29/tháng, Ấn ₹10/tháng, Indo Rp 3,000/tháng).",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "com.google.gemini.2tb.ai.m.3month_ip_99p", enabled: true }
        ]
      },
      {
        id: "pro-1yuan-2tb",
        title: "✅ 2. [100% SỐNG TRÊN iOS · CHUẨN v7.13.0] Mở Google AI Pro (5 TB) Giảm 99% (2 Nguồn Pro Tháng)",
        description: "【Cập nhật v7.13.0】Khớp chính xác 2 mã Pro Tháng (g1.ios.2tb.ai.m và mã ứng viên mới g1.ios.ai.2tb.m.ip_3mo_75p.acq) -> com.google.gemini.2tb.ai.m.3month_ip_99p. Tránh đè trùng 4 nút 2TB và bắt được cả tài khoản trả mã AI 75p.acq mới.",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.2tb.ai.m", to: PRO_TARGET, enabled: true },
          { match: "exact", from: "g1.ios.ai.2tb.m.ip_3mo_75p.acq", to: PRO_TARGET, enabled: true }
        ]
      },
      {
        id: "tr-ultra-legacy",
        title: "✅ 3. [100% SỐNG TRÊN iOS · ULTRA DUY NHẤT] Ultra 20TB & 30TB Giá Cũ (g1.ios.20tb.m / 30tb.m)",
        description: "【26/11/2026 Đường duy nhất mở Ultra 20TB/30TB giá rẻ trên iOS】Bỏ đuôi .v2 và .ai.pro, gọi mã gốc 20TB (g1.ios.20tb.m - 1989.99 TRY) và 30TB (g1.ios.30tb.m - 2949.99 TRY trên Apple ID Thổ Nhĩ Kỳ).",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.ios.20tb.m", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.ios.30tb.m", enabled: true }
        ]
      },
      {
        id: "pro-12months-90p",
        title: "⚠️ 4. [LÊN BẢNG GIÁ NHƯNG HẾT KM 90%] Google AI Pro (5 TB) · 12months_ip_90p (Về giá gốc $19.99)",
        description: "【26/11/2026】Mã g1.2tb.ai.12months_ip_90p vẫn hiện bảng Apple Pay nhưng Apple Store đã tắt thuộc tính giảm 90% ($1.99), bảng giá hiện nguyên giá gốc $19.99/tháng.",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.2tb.ai.m", to: "g1.2tb.ai.12months_ip_90p", enabled: true }
        ]
      },
      {
        id: "ultra-75p",
        title: "❌ 5. [ĐÃ BỊ GỠ TRÊN iOS] Ultra 20TB & 30TB · 3 Tháng 75p.acq (Báo Giao dịch chưa hoàn tất)",
        description: "【26/11/2026 Đã khóa trên iOS】g1.20tb.3months_ip_75p.acq và g1.ai.ultra.3months_ip_75p.acq đã bị gỡ khỏi iOS App Store.",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.20tb.3months_ip_75p.acq", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.ai.ultra.3months_ip_75p.acq", enabled: true }
        ]
      },
      {
        id: "ultra-1m-free",
        title: "❌ 6. [ĐÃ BỊ GỠ TRÊN iOS] Ultra 20TB & 30TB · Free 1 Tháng 1month_eft.acq (Báo Giao dịch chưa hoàn tất)",
        description: "【26/11/2026 Đã khóa trên iOS】g1.20tb.1month_eft.acq và g1.ai.ultra.1month_eft.acq đã bị gỡ khỏi iOS App Store.",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.20tb.1month_eft.acq", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.ai.ultra.1month_eft.acq", enabled: true }
        ]
      },
      {
        id: "pro-5tb-free-4slots",
        title: "🤖 7. [CHỈ DÀNH CHO ANDROID PLAY] Gói 5TB Free 18M/15M/12M/6M (g1.2tb.ai.*_eft)",
        description: "Lưu ý v9.6.0: Các mã g1.2tb.ai.18months_eft / 12months_eft / 6months_eft là mã độc quyền của Android Google Play BillingClient (trên iOS StoreKit không tồn tại nên bấm trên iPhone sẽ báo Giao dịch chưa hoàn tất; phải mở trên Android/MuMu).",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.2tb.ai.m", to: "g1.2tb.ai.18months_eft", enabled: true },
          { match: "exact", from: "g1.ios.2tb.ai.a", to: "g1.2tb.ai.12months_eft", enabled: true },
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.2tb.ai.15months_eft", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.2tb.ai.6months_eft", enabled: true }
        ]
      },
      {
        id: "probe-batch-1-gemini",
        title: "8. [DÒ 10 NÚT - GÓI A] 10 Mã com.google.gemini.* (99p / 90p / Free Trial 1M-12M)",
        description: "Gắn 10 mã com.google.gemini.* vào 10 nút trên trang (20TB, 30TB, Pro Tháng/Năm, 2TB Tháng/Năm, 400GB, 100GB). Áp dụng xong mở trang nâng cấp bấm thử từng nút: nút nào bật bảng thanh toán Apple là mã đó mua được trên iOS!",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "com.google.gemini.2tb.ai.m.3month_ip_99p", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "com.google.gemini.2tb.ai.m.1month_ip_99p", enabled: true },
          { match: "exact", from: "g1.ios.2tb.ai.m", to: "com.google.gemini.2tb.ai.m.12month_ip_90p", enabled: true },
          { match: "exact", from: "g1.ios.2tb.ai.a", to: "com.google.gemini.2tb.ai.m.1month_eft", enabled: true },
          { match: "exact", from: "g1.ios.2tb.m", to: "com.google.gemini.2tb.ai.m.3month_eft", enabled: true },
          { match: "exact", from: "g1.ios.2tb.a", to: "com.google.gemini.2tb.ai.m.12month_eft", enabled: true },
          { match: "exact", from: "g1.ios.helium.m", to: "com.google.gemini.2tb.ai.m.3month_ip_90p", enabled: true },
          { match: "exact", from: "g1.ios.helium.a", to: "com.google.gemini.2tb.ai.m.3month_ip_75p", enabled: true },
          { match: "exact", from: "g1.ios.100gb.m", to: "com.google.gemini.2tb.ai.m", enabled: true },
          { match: "exact", from: "g1.ios.100gb.a", to: "com.google.gemini.2tb.ai.a", enabled: true }
        ]
      },
      {
        id: "probe-batch-2-g1ios",
        title: "9. [DÒ 10 NÚT - GÓI B] 10 Mã g1.ios.* & com.google.one.* (99p / 90p / Free Trial / Giá cũ)",
        description: "Gắn 10 mã g1.ios.* và com.google.one.* vào 10 nút trên trang. Áp dụng xong mở trang nâng cấp bấm lần lượt từng nút xem nút nào hiện bảng thanh toán Apple!",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.ios.20tb.m", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.ios.30tb.m", enabled: true },
          { match: "exact", from: "g1.ios.2tb.ai.m", to: "g1.ios.2tb.ai.m.3month_ip_99p", enabled: true },
          { match: "exact", from: "g1.ios.2tb.ai.a", to: "g1.ios.2tb.ai.m.12month_ip_90p", enabled: true },
          { match: "exact", from: "g1.ios.2tb.m", to: "com.google.one.2tb.ai.m.3month_ip_99p", enabled: true },
          { match: "exact", from: "g1.ios.2tb.a", to: "g1.ios.2tb.y", enabled: true },
          { match: "exact", from: "g1.ios.helium.m", to: "g1.ios.2tb.ai.m.1month_eft", enabled: true },
          { match: "exact", from: "g1.ios.helium.a", to: "g1.ios.2tb.ai.m.3month_eft", enabled: true },
          { match: "exact", from: "g1.ios.100gb.m", to: "g1.2tb.ai.3months_ip_90p.acq", enabled: true },
          { match: "exact", from: "g1.ios.100gb.a", to: "g1.2tb.ai.12months_ip_75p", enabled: true }
        ]
      },
      {
        id: "probe-batch-3-ultra-gemini",
        title: "10. [DÒ 10 NÚT - GÓI C] Chuyên dò Ultra 20TB/30TB họ com.google.gemini.* (99p / 90p / Free)",
        description: "Gắn 10 mã ứng viên Ultra 20TB/30TB thuộc họ com.google.gemini.* vào 10 nút trên trang để dò mã Ultra ẩn trên iOS.",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "com.google.gemini.20tb.m.3month_ip_99p", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "com.google.gemini.30tb.ai.pro.m.3month_ip_99p", enabled: true },
          { match: "exact", from: "g1.ios.2tb.ai.m", to: "com.google.gemini.20tb.ai.m.3month_ip_99p", enabled: true },
          { match: "exact", from: "g1.ios.2tb.ai.a", to: "com.google.gemini.30tb.ai.m.3month_ip_99p", enabled: true },
          { match: "exact", from: "g1.ios.2tb.m", to: "com.google.gemini.ai.ultra.m.3month_ip_99p", enabled: true },
          { match: "exact", from: "g1.ios.2tb.a", to: "com.google.gemini.20tb.m.1month_eft", enabled: true },
          { match: "exact", from: "g1.ios.helium.m", to: "com.google.gemini.30tb.ai.pro.m.1month_eft", enabled: true },
          { match: "exact", from: "g1.ios.helium.a", to: "com.google.gemini.20tb.m.3month_ip_90p", enabled: true },
          { match: "exact", from: "g1.ios.100gb.m", to: "com.google.gemini.30tb.ai.pro.m.3month_ip_90p", enabled: true },
          { match: "exact", from: "g1.ios.100gb.a", to: "com.google.gemini.ai.ultra.m.1month_eft", enabled: true }
        ]
      },
      {
        id: "probe-batch-4-ultra-g1",
        title: "11. [DÒ 10 NÚT - GÓI D] Chuyên dò Ultra 20TB/30TB họ g1.* & g1.ios.* (Free / 75p / 80p / 90p)",
        description: "Gắn 10 mã ứng viên Ultra 20TB/30TB thuộc họ g1.* và g1.ios.* vào 10 nút trên trang để dò nút nào bật bảng thanh toán Apple.",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.20tb.1month_eft.acq", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.ai.ultra.1month_eft.acq", enabled: true },
          { match: "exact", from: "g1.ios.2tb.ai.m", to: "g1.20tb.3months_ip_75p.acq", enabled: true },
          { match: "exact", from: "g1.ios.2tb.ai.a", to: "g1.ai.ultra.3months_ip_75p.acq", enabled: true },
          { match: "exact", from: "g1.ios.2tb.m", to: "g1.20tb.3months_ip_80p", enabled: true },
          { match: "exact", from: "g1.ios.2tb.a", to: "g1.20tb.3months_ip_90p.acq", enabled: true },
          { match: "exact", from: "g1.ios.helium.m", to: "g1.ai.ultra.3months_ip_90p.acq", enabled: true },
          { match: "exact", from: "g1.ios.helium.a", to: "g1.ios.20tb.m.3month_ip_99p", enabled: true },
          { match: "exact", from: "g1.ios.100gb.m", to: "g1.ios.20tb.m", enabled: true },
          { match: "exact", from: "g1.ios.100gb.a", to: "g1.ios.30tb.m", enabled: true }
        ]
      },
      {
        id: "grok-ios-legacy-storekit",
        title: "🤖 12. [GROK iOS · ÉP STOREKIT GỐC] Đổi XPASS sang SuperGrok iOS Gốc (grok.pro.monthly.30 / 300)",
        description: "【Dành cho app Grok iOS】Đổi các gói XPASS trên WebView Paywall (grok.com/com/paywall/webview) sang 2 mã Apple StoreKit gốc thuộc Group 21630009 (grok.pro.monthly.30 & supergrok.pro.monthly.300) kèm chế độ ép nhánh APPLE_IAP bỏ chữ ký JWS.",
        replaceAll: true,
        rules: [
          { match: "exact", from: "x.subscription.premium", to: "grok.pro.monthly.30", enabled: true },
          { match: "exact", from: "x.subscription.plus", to: "grok.pro.monthly.30", enabled: true },
          { match: "exact", from: "x.subscription.super", to: "grok.pro.monthly.30", enabled: true },
          { match: "exact", from: "x.subscription.ultra", to: "supergrok.pro.monthly.300", enabled: true }
        ]
      },
      {
        id: "grok-ios-probe-4tabs-a",
        title: "🤖 13. [GROK iOS · DÒ 4 TAB GÓI A] Dò 4 Mã Ẩn grok.lite / grok.plus / grok.pro / grok.ultra",
        description: "【Dành cho app Grok iOS】Gắn 4 mã định danh gói nội bộ (grok.lite, grok.plus, grok.pro, grok.ultra) vào 4 tab Plus / Premium / Super / Ultra trên Paywall Grok iOS để kiểm tra mã nào bật bảng Apple Pay.",
        replaceAll: true,
        rules: [
          { match: "exact", from: "x.subscription.premium", to: "grok.lite", enabled: true },
          { match: "exact", from: "x.subscription.plus", to: "grok.plus", enabled: true },
          { match: "exact", from: "x.subscription.super", to: "grok.pro", enabled: true },
          { match: "exact", from: "x.subscription.ultra", to: "grok.ultra", enabled: true }
        ]
      },
      {
        id: "grok-ios-probe-4tabs-b",
        title: "🤖 14. [GROK iOS · DÒ 4 TAB GÓI B] Dò Các Biến Thể Trial / Promo / Annual Của Grok iOS",
        description: "【Dành cho app Grok iOS】Gắn 4 mã ứng viên Trial & Annual của SuperGrok vào 4 tab Plus / Premium / Super / Ultra để dò gói dùng thử trên App Store.",
        replaceAll: true,
        rules: [
          { match: "exact", from: "x.subscription.premium", to: "grok.lite.monthly.trial", enabled: true },
          { match: "exact", from: "x.subscription.plus", to: "grok.pro.monthly.trial", enabled: true },
          { match: "exact", from: "x.subscription.super", to: "grok.pro.yearly.300", enabled: true },
          { match: "exact", from: "x.subscription.ultra", to: "supergrok.pro.yearly", enabled: true }
        ]
      }
    ];
  }

  function isLegacyProRule(rule) {
    return !!rule && rule.to === PRO_TARGET &&
      ((rule.match === "exact" && rule.from === "g1.ios.20tb.m.v2") ||
       (rule.match === "prefix" && rule.from === SOURCE_PREFIX));
  }

  var SKU_NAMESPACE = "(?:g1\\.|com\\.google\\.(?:one|gemini)\\.|x\\.subscription\\.|x-subscription-|grok\\.|supergrok\\.|xpass\\.|sku_|com\\.x\\.|ai\\.x\\.|com\\.atebits\\.|com\\.openai\\.|chatgpt[._]|gpt[._]|com\\.anthropic\\.|claude[._])";
  var VALID_SKU_RE = new RegExp("^" + SKU_NAMESPACE + "[A-Za-z0-9._-]{0,159}[A-Za-z0-9_-]$(?![\\s\\S])");
  var VALID_PREFIX_RE = new RegExp("^" + SKU_NAMESPACE + "[A-Za-z0-9._-]{1,159}\\.$(?![\\s\\S])");

  function validSku(value) {
    return typeof value === "string" && VALID_SKU_RE.test(value);
  }

  function validPrefix(value) {
    return typeof value === "string" && VALID_PREFIX_RE.test(value);
  }

  function hasFields(value, fields, allowExtra) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    return (allowExtra || Object.keys(value).length === fields.length) && fields.every(function (field) {
      return Object.prototype.hasOwnProperty.call(value, field);
    });
  }

  function invalidRules(error) {
    return { ok: false, rules: [], error: error };
  }

  function validateRules(value) {
    if (!Array.isArray(value) || value.length > LIMIT) {
      return invalidRules("Cần danh sách quy tắc ánh xạ, tối đa lưu 30 quy tắc.");
    }
    var rules = [];
    var ids = Object.create(null);
    var sources = Object.create(null);
    for (var index = 0; index < value.length; index += 1) {
      var rule = value[index];
      if (!hasFields(rule, RULE_FIELDS) || typeof rule.id !== "string" ||
          !/^[a-z][a-z0-9-]{0,39}$(?![\s\S])/.test(rule.id) ||
          (rule.match !== "exact" && rule.match !== "prefix") ||
          !(rule.match === "exact" ? validSku(rule.from) : validPrefix(rule.from)) ||
          !validSku(rule.to) || typeof rule.enabled !== "boolean") {
        return invalidRules("Vui lòng nhập SKU đầy đủ; tiền tố phải kết thúc bằng dấu chấm (.), SKU đích phải bắt đầu bằng g1., com.google.one. hoặc com.google.gemini.");
      }
      if (rule.from === rule.to) return invalidRules("SKU gốc và SKU đích trùng nhau, vui lòng nhập SKU đích khác.");
      if (ids[rule.id]) return invalidRules("Mã định danh quy tắc bị trùng, vui lòng tải lại trang quản lý rồi thử lại.");
      var source = rule.match + ":" + rule.from;
      if (sources[source]) return invalidRules("SKU gốc với cùng kiểu khớp đã tồn tại, vui lòng sửa quy tắc hiện có.");
      ids[rule.id] = true;
      sources[source] = true;
      rules.push({ id: rule.id, match: rule.match, from: rule.from, to: rule.to, enabled: rule.enabled });
    }
    return { ok: true, rules: rules, error: "" };
  }

  function randomHex(length) {
    var value = "";
    for (var index = 0; index < length; index += 1) value += Math.floor(Math.random() * 16).toString(16);
    return value;
  }

  function newId() {
    return "rule-" + randomHex(16);
  }

  function configState(status, revision, updatedAt, customized, rules, error) {
    var target = "";
    rules.some(function (rule) {
      if (rule.enabled && rule.match === "prefix" && rule.from === SOURCE_PREFIX) {
        target = rule.to;
        return true;
      }
      return false;
    });
    return {
      status: status,
      revision: revision,
      updatedAt: updatedAt,
      mode: status === "default" ? "discount75" : status === "custom" ? "custom" : "",
      customized: customized,
      rules: rules,
      target: target,
      targetOrigin: target ? customized ? "user-configured" : "user-specified" : "",
      error: error
    };
  }

  function failedState(status) {
    return configState(status, status, "", false, [], status === "invalid" ? CONFIG_ERROR : READ_ERROR);
  }

  function validTime(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$(?![\s\S])/.test(value) &&
      isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
  }

  function read() {
    var raw;
    try {
      if (!store || typeof store.read !== "function") return failedState("unavailable");
      raw = store.read(KEY);
    } catch (error) {
      return failedState("unavailable");
    }
    if (raw === null || typeof raw === "undefined" || raw === "") {
      return configState("default", DEFAULT_REVISION, "", false, defaults(), "");
    }
    try {
      if (typeof raw !== "string") return failedState("invalid");
      var saved = JSON.parse(raw);
      if (!hasFields(saved, RECORD_FIELDS, true) || saved.schemaVersion !== 1 ||
          typeof saved.revision !== "string" || !/^[a-f0-9]{48}$(?![\s\S])/.test(saved.revision) ||
          !validTime(saved.updatedAt) || typeof saved.customized !== "boolean") {
        return failedState("invalid");
      }
      var checked = validateRules(saved.rules);
      if (!checked.ok || (!saved.customized && checked.rules.length !== 0)) return failedState("invalid");
      return configState(saved.customized ? "custom" : "default", saved.revision, saved.updatedAt,
        saved.customized, saved.customized ? checked.rules : defaults(), "");
    } catch (error) {
      return failedState("invalid");
    }
  }

  function saveResult(status, error, config) {
    return { ok: status === 200, status: status, error: error, config: config };
  }

  function save(expectedRevision, rules, restore) {
    var current = read();
    if (current.status === "unavailable") return saveResult(503, READ_ERROR, current);
    if (typeof expectedRevision !== "string" || expectedRevision !== current.revision) {
      return saveResult(409, REVISION_ERROR, current);
    }
    if (current.status === "invalid" && restore !== true) return saveResult(400, CONFIG_ERROR, current);
    var checked = restore === true ? { ok: true, rules: [] } : validateRules(rules);
    if (!checked.ok) return saveResult(400, checked.error, current);
    try {
      if (!store || typeof store.write !== "function") return saveResult(503, WRITE_ERROR, current);
    } catch (error) {
      return saveResult(503, WRITE_ERROR, current);
    }

    var revision = randomHex(48);
    // Keep the change identifier fresh even if the random source repeats a value.
    if (revision === current.revision) {
      revision = revision.slice(0, 47) + ((parseInt(revision.charAt(47), 16) + 1) % 16).toString(16);
    }
    var saved = {
      schemaVersion: 1,
      revision: revision,
      updatedAt: new Date().toISOString(),
      customized: restore !== true,
      rules: checked.rules
    };
    var written = false;
    try {
      written = store.write(JSON.stringify(saved), KEY);
    } catch (error) {
      written = false;
    }
    var verified = read();
    var expectedRules = saved.customized ? saved.rules : defaults();
    if (!written || verified.status !== (saved.customized ? "custom" : "default") ||
        verified.revision !== saved.revision || verified.updatedAt !== saved.updatedAt ||
        verified.customized !== saved.customized || JSON.stringify(verified.rules) !== JSON.stringify(expectedRules)) {
      return saveResult(503, WRITE_ERROR, verified);
    }
    return saveResult(200, "", verified);
  }

  function applyPreset(expectedRevision, presetId) {
    var current = read();
    if (current.status === "unavailable") return saveResult(503, READ_ERROR, current);
    if (typeof expectedRevision !== "string" || expectedRevision !== current.revision) {
      return saveResult(409, REVISION_ERROR, current);
    }
    if (current.status === "invalid") return saveResult(400, CONFIG_ERROR, current);

    var selected = null;
    presets().some(function (preset) {
      if (preset.id !== presetId) return false;
      selected = preset;
      return true;
    });
    if (!selected) return saveResult(400, "Mẫu ánh xạ không tồn tại, vui lòng tải lại trang quản lý rồi thử lại.", current);

    var rules = selected.replaceAll ? [] : current.rules.slice();
    var ids = Object.create(null);
    var positions = Object.create(null);
    rules.forEach(function (rule, index) {
      ids[rule.id] = true;
      positions[rule.match + ":" + rule.from] = index;
    });
    selected.rules.forEach(function (rule) {
      var source = rule.match + ":" + rule.from;
      var position = positions[source];
      var id;
      if (typeof position === "number") {
        id = rules[position].id;
      } else {
        var base = newId();
        id = base;
        // There are at most rules.length occupied candidates, even if randomness repeats.
        for (var suffix = 1; suffix <= rules.length && ids[id]; suffix += 1) id = base + "-" + suffix;
        ids[id] = true;
        position = rules.length;
        positions[source] = position;
      }
      rules[position] = { id: id, match: rule.match, from: rule.from, to: rule.to, enabled: true };
    });

    var checked = validateRules(rules);
    if (!checked.ok) return saveResult(400, checked.error, current);
    return save(expectedRevision, checked.rules, false);
  }

  function resolve(id, state) {
    if (!validSku(id) || !state || (state.status !== "default" && state.status !== "custom") ||
        !Array.isArray(state.rules)) return null;
    var selected = null;
    for (var index = 0; index < state.rules.length; index += 1) {
      var rule = state.rules[index];
      if (!rule.enabled) continue;
      if (rule.match === "exact" && rule.from === id) return rule;
      if (rule.match === "prefix" && id.length > rule.from.length && id.indexOf(rule.from) === 0 &&
          (!selected || rule.from.length > selected.from.length)) selected = rule;
    }
    return selected;
  }

  return {
    key: KEY,
    limit: LIMIT,
    defaults: defaults,
    presets: presets,
    isLegacyProRule: isLegacyProRule,
    validSku: validSku,
    validateRules: validateRules,
    newId: newId,
    read: read,
    save: save,
    applyPreset: applyPreset,
    resolve: resolve
  };
}
// END GENERATED MAPPING CONFIG

(function () {
  var VERSION = "g1-acq-v7.13-mappings";
  var SOURCE_PREFIX = "g1.ios.2tb.";
  var TEST_KEY = "g1.pro.annual.test.v1";
  var SCAN_KEY = "g1.sku.scan.v1";
  var SCAN_LIMIT = 300;
  var RECENT_LIMIT = 10;
  var MAX_EVENT_COUNT = 9007199254740991;
  var PC_LAN_API = "http://192.168.1.71:8787";
  var GITHUB_REMOTE_CFG = "https://raw.githubusercontent.com/tmq9999/quangtesst/main/remote-config.json";
  var MULTI_SKU_TOKEN_RE = /(^|[^A-Za-z0-9._@%-])((?:g1\.|com\.google\.(?:one|gemini)\.|x\.subscription\.|x-subscription-|grok\.|supergrok\.|xpass\.|sku_|com\.x\.|ai\.x\.|com\.atebits\.|com\.openai\.|chatgpt[._]|gpt[._]|com\.anthropic\.|claude[._])[A-Za-z0-9._-]+)(?=$|[^A-Za-z0-9._-])/g;
  var MULTI_VALID_ID_RE = /^(?:g1\.|com\.google\.(?:one|gemini)\.|x\.subscription\.|x-subscription-|grok\.|supergrok\.|xpass\.|sku_|com\.x\.|ai\.x\.|com\.atebits\.|com\.openai\.|chatgpt[._]|gpt[._]|com\.anthropic\.|claude[._])[A-Za-z0-9._-]{1,160}$/;

  var url = typeof $request === "object" && $request ? $request.url : "";
  if (typeof url !== "string" || /^https:\/\/one\.google\.com\/g1-sku-report\/?(?:\?|$)/.test(url)) {
    $done({});
    return;
  }

  function detectTargetApp(reqUrl) {
    if (/^https:\/\/one\.google\.com\//i.test(reqUrl)) return "Google One iOS";
    if (/^https:\/\/(?:[a-z0-9.-]+\.)?(?:grok\.com|x\.ai|subscriptions\.x\.com)\//i.test(reqUrl)) return "Grok iOS";
    if (/^https:\/\/(?:[a-z0-9.-]+\.)?(?:chatgpt\.com|openai\.com)\//i.test(reqUrl)) return "ChatGPT iOS";
    if (/^https:\/\/(?:[a-z0-9.-]+\.)?(?:claude\.ai|anthropic\.com)\//i.test(reqUrl)) return "Claude iOS";
    return "";
  }

  var appName = detectTargetApp(url);
  if (!appName) {
    $done({});
    return;
  }

  // 1. Same-Origin WebView Bridge Relay (http-request when $response is undefined)
  if (typeof $response === "undefined") {
    if (/\/__pc_bridge\/telemetry(?:\?|$)/.test(url)) {
      var reqBody = (typeof $request === "object" && $request && typeof $request.body === "string") ? $request.body : "{}";
      if (typeof $httpClient === "object" && $httpClient && typeof $httpClient.post === "function") {
        $httpClient.post({
          url: PC_LAN_API + "/api/telemetry",
          timeout: 2,
          headers: { "Content-Type": "application/json" },
          body: reqBody
        }, function () {
          $httpClient.get({ url: PC_LAN_API + "/api/config?t=" + Date.now(), timeout: 2 }, function (err, resp, cfgData) {
            $done({
              response: {
                status: 200,
                headers: {
                  "Content-Type": "application/json; charset=utf-8",
                  "Cache-Control": "no-store",
                  "Access-Control-Allow-Origin": "*"
                },
                body: (!err && cfgData) ? cfgData : JSON.stringify({ ok: true })
              }
            });
          });
        });
        return;
      }
      $done({
        response: {
          status: 200,
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ ok: true })
        }
      });
      return;
    }
    $done({});
    return;
  }

  var mappingEngine = createG1MappingConfig(typeof $persistentStore === "undefined" ? null : $persistentStore);
  var mappingConfig = mappingEngine.read();
  var MODE = mappingConfig.mode;
  console.log("[g1-acq] " + VERSION + " app=" + appName + " mappingStatus=" + mappingConfig.status +
    " mappingRevision=" + mappingConfig.revision + " mode=" + MODE);

  var body = typeof $response === "object" && $response ? $response.body : undefined;
  var lastScanReport = null;
  try {
    lastScanReport = collectOriginalSkus(body);
  } catch (error) {
    console.log("[g1-acq] SKU collection unavailable");
  }

  var isGoogleOneTargetRoute = appName === "Google One iOS" &&
    /^https:\/\/one\.google\.com\/(?:u\/\d+\/)?(?:ai|plans|subscribe|upsell|about\/plans)(?:[/?#]|$)/.test(url);
  var isMultiAppTargetRoute = appName !== "Google One iOS" &&
    !(/\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|mp4|mp3|css)(?:\?|$)/i.test(url));

  if (!isGoogleOneTargetRoute && !isMultiAppTargetRoute) {
    if (lastScanReport && lastScanReport.candidateCount > 0 &&
        typeof $httpClient === "object" && $httpClient && typeof $httpClient.post === "function") {
      try {
        $httpClient.post({
          url: PC_LAN_API + "/api/telemetry",
          timeout: 1,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            app: appName,
            url: url,
            version: VERSION,
            mode: MODE,
            mappingStatus: mappingConfig.status,
            mappingRevision: mappingConfig.revision,
            runtimeStatus: "scan-only",
            configSource: "scan-pass",
            hitCount: 0,
            annualHitCount: 0,
            matchedFrom: [],
            foundSkus: lastScanReport.foundList,
            allStoredSkus: lastScanReport.allStoredSkus,
            scanStatus: lastScanReport.status,
            scannedResponses: lastScanReport.scannedResponses,
            logs: lastScanReport.logs
          })
        }, function () {});
      } catch (e) {}
    }
    $done({});
    return;
  }

  var doneCalled = false;
  function finishOnce(payload) {
    if (doneCalled) return;
    doneCalled = true;
    $done(payload);
  }

  function applyRemoteRulesIfValid(rawJson) {
    try {
      var parsed = JSON.parse(rawJson);
      if (!parsed || !Array.isArray(parsed.rules)) return null;
      var checked = mappingEngine.validateRules(parsed.rules);
      if (!checked.ok) return null;
      var toSave = {
        schemaVersion: 1,
        revision: typeof parsed.revision === "string" && /^[a-f0-9]{48}$/.test(parsed.revision) ? parsed.revision : "0123456789abcdef0123456789abcdef0123456789abcdef",
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
        customized: true,
        rules: checked.rules
      };
      if (typeof $persistentStore !== "undefined" && typeof $persistentStore.write === "function") {
        $persistentStore.write(JSON.stringify(toSave), mappingEngine.key);
      }
      var st = mappingEngine.read();
      st.forceAppleIap = parsed.forceAppleIap !== false;
      return st;
    } catch (e) {
      return null;
    }
  }

  function buildWebViewHookScript(activeConfig) {
    var activeRulesJson = JSON.stringify((activeConfig && Array.isArray(activeConfig.rules)) ? activeConfig.rules.filter(function (r) { return r.enabled; }) : []);
    var forceAppleIap = (!activeConfig || activeConfig.forceAppleIap !== false) ? "true" : "false";
    var appLabel = JSON.stringify(appName);
    return '<script id="g1-ios-webview-hook">(function(){' +
      'if(window.__g1IosHooked)return;window.__g1IosHooked=true;' +
      'var RULES=' + activeRulesJson + ';' +
      'var FORCE_APPLE_IAP=' + forceAppleIap + ';' +
      'var APP_NAME=' + appLabel + ';' +
      'var SKU_RE=/(?:x\\.subscription\\.|x-subscription-|grok\\.|supergrok\\.|xpass\\.|sku_|com\\.x\\.|ai\\.x\\.|com\\.openai\\.|chatgpt[._]|gpt[._]|com\\.anthropic\\.|claude[._])[A-Za-z0-9._-]+/g;' +
      'function resolveRule(id){' +
        'for(var i=0;i<RULES.length;i++){' +
          'var r=RULES[i];if(!r.enabled)continue;' +
          'if(r.match==="exact"&&r.from===id)return r;' +
          'if(r.match==="prefix"&&id.indexOf(r.from)===0)return r;' +
        '}return null;' +
      '}' +
      'function sendTelemetry(tag,found,rewrites,extraLogs){' +
        'try{' +
          'fetch("/__pc_bridge/telemetry?t="+Date.now(),{' +
            'method:"POST",headers:{"Content-Type":"application/json"},' +
            'body:JSON.stringify({' +
              'app:APP_NAME,url:location.href+" ["+tag+"]",version:"g1-acq-v7.13-webview-hook",mode:"custom",' +
              'configSource:"ios-wkwebview",runtimeStatus:rewrites.length?"rewritten":"scan-only",' +
              'hitCount:rewrites.reduce(function(a,x){return a+(x.count||1);},0),' +
              'matchedFrom:rewrites,foundSkus:found,logs:extraLogs||[]' +
            '})' +
          '}).then(function(r){return r.json();}).then(function(cfg){' +
            'if(cfg&&Array.isArray(cfg.rules)){RULES=cfg.rules.filter(function(x){return x.enabled;});}' +
            'if(cfg&&typeof cfg.forceAppleIap==="boolean"){FORCE_APPLE_IAP=cfg.forceAppleIap;}' +
          '}).catch(function(){});' +
        '}catch(e){}' +
      '}' +
      'function scanAndRewriteText(raw,tag){' +
        'if(typeof raw!=="string"||!raw)return {text:raw,changed:false};' +
        'var foundMap={},rwMap={},changed=false,logs=[];' +
        'var m;SKU_RE.lastIndex=0;' +
        'while((m=SKU_RE.exec(raw))!==null){foundMap[m[0]]=(foundMap[m[0]]||0)+1;}' +
        'var kvRe=/"(?:productId|genericProductId|externalProductId|externalOfferId|offerId|skuId)"\\s*:\\s*"([^"]+)"/g;' +
        'while((m=kvRe.exec(raw))!==null){foundMap[m[1]]=(foundMap[m[1]]||0)+1;}' +
        'var out=raw.replace(SKU_RE,function(tok){' +
          'var rule=resolveRule(tok);if(!rule)return tok;' +
          'changed=true;if(!rwMap[tok])rwMap[tok]={id:tok,to:rule.to,count:0};rwMap[tok].count++;' +
          'return rule.to;' +
        '});' +
        'if(FORCE_APPLE_IAP&&out.indexOf("advancedCommerceJws")!==-1){' +
          'out=out.replace(/"platform"\\s*:\\s*"APPLE"/g,"\\"platform\\":\\"APPLE_IAP\\"")' +
                 '.replace(/"case"\\s*:\\s*"apple"/g,"\\"case\\":\\"appleIap\\"")' +
                 '.replace(/"genericProductId"\\s*:/g,"\\"productId\\":");' +
          'changed=true;logs.push("[g1-acq] WEBVIEW_FORCE_APPLE_IAP enabled");' +
        '}' +
        'var foundList=Object.keys(foundMap).map(function(k){return {id:k,count:foundMap[k]};});' +
        'var rwList=Object.keys(rwMap).map(function(k){return rwMap[k];});' +
        'if(foundList.length||rwList.length||logs.length){' +
          'logs.unshift("[g1-acq] WKWebView "+tag+" skus="+foundList.length+" rewrites="+rwList.length);' +
          'sendTelemetry(tag,foundList,rwList,logs);' +
        '}' +
        'return {text:out,changed:changed};' +
      '}' +
      'function hookWebkitHandlers(){' +
        'try{' +
          'var mh=window.webkit&&window.webkit.messageHandlers;' +
          'if(!mh)return;' +
          'var names=Object.keys(mh);' +
          'if(names.length){sendTelemetry("WEBKIT_BRIDGE_DISCOVERED",names.map(function(n){return {id:"webkit."+n,count:1};}),[],["[g1-acq] Discovered iOS webkit.messageHandlers: "+names.join(", ")]);}' +
          'names.forEach(function(name){' +
            'var handler=mh[name];' +
            'if(!handler||handler.__g1Wrapped||typeof handler.postMessage!=="function")return;' +
            'var orig=handler.postMessage.bind(handler);' +
            'handler.postMessage=function(msg){' +
              'try{' +
                'var str=typeof msg==="string"?msg:JSON.stringify(msg);' +
                'var res=scanAndRewriteText(str,"webkit."+name);' +
                'sendTelemetry("STOREKIT_POSTMESSAGE_"+name,res.changed?[{id:"webkit."+name,count:1}]:[],[],["[g1-acq] iOS Bridge webkit.messageHandlers."+name+".postMessage("+str.slice(0,300)+")"]);' +
                'if(res.changed){msg=typeof msg==="string"?res.text:JSON.parse(res.text);}' +
              '}catch(e){}' +
              'return orig(msg);' +
            '};' +
            'handler.__g1Wrapped=true;' +
          '});' +
        '}catch(e){}' +
      '}' +
      'hookWebkitHandlers();setTimeout(hookWebkitHandlers,800);setTimeout(hookWebkitHandlers,2500);' +
      'var origFetch=window.fetch;' +
      'if(typeof origFetch==="function"){' +
        'window.fetch=async function(){' +
          'var reqUrl=typeof arguments[0]==="string"?arguments[0]:(arguments[0]&&arguments[0].url)||"";' +
          'var resp=await origFetch.apply(this,arguments);' +
          'if(reqUrl.indexOf("__pc_bridge")!==-1)return resp;' +
          'try{' +
            'var clone=resp.clone();' +
            'clone.text().then(function(txt){scanAndRewriteText(txt,"fetch:"+reqUrl.slice(0,80));}).catch(function(){});' +
          '}catch(e){}' +
          'return resp;' +
        '};' +
      '}' +
      'setTimeout(function(){scanAndRewriteText(document.documentElement.innerHTML,"DOM_INITIAL");},600);' +
    '})();</script>';
  }

  function executeRewriteAndFinish(activeConfig, configSource) {
    var activeError = activeConfig.status === "invalid" || activeConfig.status === "unavailable";
    var activeMode = activeConfig.mode;
    var mappings = Object.create(null);
    var hits = 0;
    var annualHits = 0;
    var out = body;
    var bodyModified = false;

    if (typeof body === "string" && !activeError) {
      out = body.replace(
        MULTI_SKU_TOKEN_RE,
        function (match, before, id) {
          var rule = mappingEngine.resolve(id, activeConfig);
          if (!rule) return match;
          var isAnnual = id.indexOf(SOURCE_PREFIX) === 0 && id.length > SOURCE_PREFIX.length;
          if (!mappings[id]) mappings[id] = { id: id, to: rule.to, count: 0, fallback: false };
          mappings[id].count += 1;
          hits += 1;
          bodyModified = true;
          if (isAnnual) annualHits += 1;
          return before + rule.to;
        }
      );

      // Grok iOS APPLE_IAP downgrade option (bypasses server-signed advancedCommerceJws when testing APPLE_IAP SKUs)
      if (appName === "Grok iOS" && activeConfig.forceAppleIap !== false &&
          (out.indexOf('"platform":"APPLE"') !== -1 || out.indexOf('"case":"apple"') !== -1)) {
        out = out
          .replace(/"platform"\s*:\s*"APPLE"/g, '"platform":"APPLE_IAP"')
          .replace(/"case"\s*:\s*"apple"/g, '"case":"appleIap"')
          .replace(/"genericProductId"\s*:/g, '"productId":');
        bodyModified = true;
      }

      // Inject In-WebView Hook on Grok / ChatGPT / Claude HTML documents
      if (appName !== "Google One iOS" && /<(?:!doctype\s+html|html|head)\b/i.test(out) && out.indexOf("g1-ios-webview-hook") === -1) {
        var hookTag = buildWebViewHookScript(activeConfig);
        if (/<head[^>]*>/i.test(out)) {
          out = out.replace(/<head[^>]*>/i, function (m) { return m + hookTag; });
        } else {
          out = hookTag + out;
        }
        bodyModified = true;
      }
    }

    var sources = Object.keys(mappings).sort().map(function (id) {
      return mappings[id];
    });
    var record = {
      schemaVersion: 1,
      version: VERSION,
      mode: activeMode,
      updatedAt: new Date().toISOString(),
      mappingRevision: activeConfig.revision,
      mappingUpdatedAt: activeConfig.updatedAt,
      mappingStatus: activeConfig.status,
      sourcePrefix: SOURCE_PREFIX,
      target: activeConfig.target,
      targetOrigin: activeConfig.targetOrigin,
      hitCount: hits,
      annualHitCount: annualHits,
      matchedFrom: sources,
      status: activeError ? "config-error" : typeof body !== "string" ? "non-text" : hits ? "rewritten" : "no-match"
    };

    try {
      if (appName === "Google One iOS" && typeof $persistentStore !== "undefined" &&
          typeof $persistentStore.write === "function") {
        $persistentStore.write(JSON.stringify(record), TEST_KEY);
      }
    } catch (error) {}

    var runtimeLines = [
      "[g1-acq] [" + appName + "] " + VERSION + " source=" + configSource + " status=" + record.status + " hits=" + hits + " mode=" + activeMode + " rev=" + String(activeConfig.revision || "").slice(0, 10)
    ];
    console.log(runtimeLines[0]);
    sources.forEach(function (source) {
      var line = "[g1-acq] REWRITE " + source.id + " -> " + source.to + " x" + source.count;
      runtimeLines.push(line);
      console.log(line);
    });

    var shouldReportTelemetry = appName === "Google One iOS" || hits > 0 || bodyModified ||
      (lastScanReport && lastScanReport.candidateCount > 0) ||
      /(?:paywall|plans|prepurchase|acquire|subscription|cart|check)/i.test(url);

    if (shouldReportTelemetry && typeof $httpClient === "object" && $httpClient && typeof $httpClient.post === "function") {
      try {
        var allLogs = (lastScanReport && Array.isArray(lastScanReport.logs) ? lastScanReport.logs : []).concat(runtimeLines);
        $httpClient.post({
          url: PC_LAN_API + "/api/telemetry",
          timeout: 1,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            app: appName,
            url: url,
            version: VERSION,
            mode: activeMode,
            mappingStatus: activeConfig.status,
            mappingRevision: activeConfig.revision,
            runtimeStatus: hits > 0 ? "rewritten" : (lastScanReport && lastScanReport.candidateCount > 0 ? "scan-only" : record.status),
            configSource: configSource,
            hitCount: hits,
            annualHitCount: annualHits,
            matchedFrom: sources,
            foundSkus: lastScanReport ? lastScanReport.foundList : [],
            allStoredSkus: lastScanReport ? lastScanReport.allStoredSkus : [],
            recentResponses: lastScanReport ? lastScanReport.recentResponses : [],
            scanStatus: lastScanReport ? lastScanReport.status : "",
            scannedResponses: lastScanReport ? lastScanReport.scannedResponses : 0,
            matchedResponses: lastScanReport ? lastScanReport.matchedResponses : 0,
            logs: allLogs
          })
        }, function () {});
      } catch (e) {}
    }

    if (bodyModified) {
      var respHeaders = (typeof $response === "object" && $response && $response.headers) ? Object.assign({}, $response.headers) : undefined;
      if (respHeaders && appName !== "Google One iOS") {
        Object.keys(respHeaders).forEach(function (k) {
          if (/^content-security-policy/i.test(k)) delete respHeaders[k];
        });
      }
      finishOnce(respHeaders ? { body: out, headers: respHeaders } : { body: out });
    } else {
      finishOnce({});
    }
  }

  if (typeof $httpClient === "object" && $httpClient && typeof $httpClient.get === "function") {
    if (typeof setTimeout === "function") {
      setTimeout(function () {
        if (!doneCalled) executeRewriteAndFinish(mappingConfig, "timeout-local");
      }, 2800);
    }
    $httpClient.get({ url: PC_LAN_API + "/api/config?t=" + Date.now(), timeout: 1 }, function (err, resp, data) {
      if (!err && data) {
        var lanCfg = applyRemoteRulesIfValid(data);
        if (lanCfg) {
          executeRewriteAndFinish(lanCfg, "pc-lan");
          return;
        }
      }
      $httpClient.get({ url: GITHUB_REMOTE_CFG + "?t=" + Date.now(), timeout: 1.5 }, function (err2, resp2, data2) {
        if (!err2 && data2) {
          var ghCfg = applyRemoteRulesIfValid(data2);
          if (ghCfg) {
            executeRewriteAndFinish(ghCfg, "pc-github");
            return;
          }
        }
        executeRewriteAndFinish(mappingConfig, "local-store");
      });
    });
  } else {
    executeRewriteAndFinish(mappingConfig, "local-store");
  }

  function collectOriginalSkus(originalBody) {
    var now = new Date().toISOString();
    var saved = {};
    try {
      if (typeof $persistentStore !== "undefined" && typeof $persistentStore.read === "function") {
        saved = JSON.parse($persistentStore.read(SCAN_KEY) || "{}");
      }
    } catch (error) {
      saved = {};
    }
    if (!saved || saved.schemaVersion !== 1) saved = {};

    var byId = Object.create(null);
    var ids = [];
    var oldRows = Array.isArray(saved.skus) ? saved.skus : [];
    oldRows.slice(0, SCAN_LIMIT).forEach(function (row) {
      if (!row || typeof row.id !== "string" || !MULTI_VALID_ID_RE.test(row.id) || byId[row.id]) return;
      var count = Number(row.count);
      byId[row.id] = {
        id: row.id,
        count: isFinite(count) && count > 0 ? Math.floor(count) : 0,
        lastSeen: typeof row.lastSeen === "string" ? row.lastSeen.slice(0, 32) : ""
      };
      ids.push(row.id);
    });

    var isText = typeof originalBody === "string";
    var found = Object.create(null);
    var hitCount = 0;
    var addedCount = 0;
    var omittedCount = 0;
    var truncated = saved.truncated === true;

    function recordFoundId(id) {
      if (!id || typeof id !== "string" || id.length < 3 || id.length > 160) return;
      found[id] = (found[id] || 0) + 1;
      hitCount += 1;
      if (!MULTI_VALID_ID_RE.test(id)) return;
      if (!byId[id]) {
        if (ids.length >= SCAN_LIMIT) {
          truncated = true;
          if (found[id] === 1) omittedCount += 1;
          return;
        }
        byId[id] = { id: id, count: 0, lastSeen: now };
        ids.push(id);
        addedCount += 1;
      }
      byId[id].count += 1;
      byId[id].lastSeen = now;
    }

    if (isText) {
      var text = originalBody.replace(/\\u002e|\\x2e|&#0*46;|&#x0*2e;|&period;/gi, ".");
      var match;
      MULTI_SKU_TOKEN_RE.lastIndex = 0;
      while ((match = MULTI_SKU_TOKEN_RE.exec(text)) !== null) {
        recordFoundId(match[2]);
      }
      // Also extract explicit productId / genericProductId / externalProductId / offerId fields in JSON responses
      var jsonFieldRe = /"(?:productId|genericProductId|externalProductId|externalOfferId|apple_product_id|store_product_id)"\s*:\s*"([A-Za-z0-9._-]{3,120})"/g;
      while ((match = jsonFieldRe.exec(text)) !== null) {
        recordFoundId(match[1]);
      }
    }

    var candidateCount = Object.keys(found).length;
    var bodyType = isText ? "text" : "non-text";
    var status = responseStatus(bodyType, candidateCount, addedCount, omittedCount);
    var recentResponses = [];
    var oldResponses = Array.isArray(saved.recentResponses) ? saved.recentResponses : [];
    oldResponses.slice(-RECENT_LIMIT).forEach(function (row) {
      var event = priorResponse(row);
      if (event) recentResponses.push(event);
    });
    // Preserve arrival order even if the device clock moves backward.
    recentResponses.push({
      at: now,
      path: safeRoute(url),
      bodyType: bodyType,
      status: status,
      candidateCount: candidateCount,
      addedCount: addedCount,
      omittedCount: omittedCount
    });

    function priorCount(value) {
      var number = Number(value);
      return isFinite(number) && number > 0 ? Math.floor(number) : 0;
    }
    var state = {
      schemaVersion: 1,
      version: VERSION,
      mode: MODE,
      updatedAt: now,
      scannedResponses: priorCount(saved.scannedResponses) + (isText ? 1 : 0),
      matchedResponses: priorCount(saved.matchedResponses) + (hitCount > 0 ? 1 : 0),
      nonTextResponses: priorCount(saved.nonTextResponses) + (isText ? 0 : 1),
      recentResponses: recentResponses.slice(-RECENT_LIMIT),
      limit: SCAN_LIMIT,
      truncated: truncated,
      skus: ids.sort().map(function (id) { return byId[id]; })
    };
    var stored = false;
    try {
      if (typeof $persistentStore !== "undefined" && typeof $persistentStore.write === "function") {
        stored = $persistentStore.write(JSON.stringify(state), SCAN_KEY);
      }
    } catch (error) {
      stored = false;
    }

    var scanLine = "[g1-acq] " + VERSION + " status=" + status + " addedCount=" + addedCount +
      " candidates=" + candidateCount + " omittedCount=" + omittedCount +
      " occurrences=" + hitCount + " saved=" + (stored ? "yes" : "no") + " mode=" + MODE;
    var scanLogs = [scanLine];
    console.log(scanLine);
    var foundList = Object.keys(found).sort().slice(0, SCAN_LIMIT).map(function (id) {
      var l = "[g1-acq] SCAN " + id + " x" + found[id];
      scanLogs.push(l);
      console.log(l);
      return { id: id, count: found[id] };
    });
    return {
      status: status,
      candidateCount: candidateCount,
      hitCount: hitCount,
      scannedResponses: state.scannedResponses,
      matchedResponses: state.matchedResponses,
      allStoredSkus: state.skus,
      recentResponses: state.recentResponses,
      foundList: foundList,
      logs: scanLogs
    };
  }

  function safeRoute(requestUrl) {
    var path = requestUrl.replace(/^https:\/\/one\.google\.com/, "").split(/[?#]/)[0];
    path = path.replace(/\/+$/, "") || "/";
    if (path === "/" || path === "/ai" || path === "/plans") return path;
    if (/^\/_\/[^?#]+\/data\/batchexecute$/.test(path)) return "/_/…/data/batchexecute";
    return "[其他 one.google.com 路径]";
  }

  function responseStatus(bodyType, candidateCount, addedCount, omittedCount) {
    if (bodyType === "non-text") return "non-text";
    if (addedCount > 0) return "new-skus";
    if (omittedCount > 0) return "limit-reached";
    return candidateCount > 0 ? "known-skus" : "no-skus";
  }

  function priorResponse(row) {
    if (!row || typeof row !== "object" || Array.isArray(row)) return null;
    if (typeof row.at !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(row.at) ||
        !isFinite(Date.parse(row.at)) || new Date(row.at).toISOString() !== row.at) return null;
    if (row.path !== "/" && row.path !== "/ai" && row.path !== "/plans" &&
        row.path !== "/_/…/data/batchexecute" && row.path !== "[其他 one.google.com 路径]") return null;
    if (row.bodyType !== "text" && row.bodyType !== "non-text") return null;

    function counter(value, maximum) {
      if (typeof value !== "number" || !isFinite(value)) return null;
      return Math.max(0, Math.min(maximum, Math.floor(value)));
    }
    var candidateCount = counter(row.candidateCount, MAX_EVENT_COUNT);
    if (candidateCount === null) return null;
    var addedCount = counter(row.addedCount, Math.min(SCAN_LIMIT, candidateCount));
    if (addedCount === null) return null;
    var omittedCount = counter(row.omittedCount, candidateCount - addedCount);
    if (omittedCount === null) return null;
    if (row.bodyType === "non-text" && (candidateCount || addedCount || omittedCount)) return null;
    if (row.status !== responseStatus(row.bodyType, candidateCount, addedCount, omittedCount)) return null;
    return {
      at: row.at,
      path: row.path,
      bodyType: row.bodyType,
      status: row.status,
      candidateCount: candidateCount,
      addedCount: addedCount,
      omittedCount: omittedCount
    };
  }
})();
