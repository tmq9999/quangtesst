/* Generated from g1-sku-report.js by tools/build-variants.cjs. */
/* Local-only report served by a Shadowrocket http-request script. */
"use strict";

(function () {
  var ROOT = "https://one.google.com/g1-sku-report";
  var VERSION = "v7.13.0";
  var COLLECTOR_VERSION = "g1-acq-v7.13-mappings";
  var MODE_NAMES = {
    discount75: "Ultra 3 tháng 75p (Giảm 75%)",
    custom: "Ánh xạ tùy chỉnh (Đã chọn mẫu / sửa tay)",
    trial: "Ưu tiên dùng thử miễn phí Ultra 1 tháng (Chế độ cũ)",
    discount: "Ưu tiên giảm 90% Ultra 3 tháng (Chế độ cũ)"
  };
  var DEFAULT_TARGET = "g1.2tb.ai.12months_ip_90p";
  var LEGACY_TARGET = "g1.2tb.ai.annual";
  var SCAN_KEY = "g1.sku.scan.v1";
  var TEST_KEY = "g1.pro.annual.test.v1";

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

  var url = typeof $request === "object" && $request ? $request.url : "";
  if (typeof url !== "string" || !/^https:\/\/one\.google\.com\/g1-sku-report\/?(?:\?|$)/.test(url)) {
    $done({});
    return;
  }
  var headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-G1-Report-Version": VERSION,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action " + ROOT
  };
  var method = typeof $request.method === "undefined" ? "GET" : String($request.method).toUpperCase();
  if ((method !== "GET" && method !== "POST") || (method === "GET" && query("action") !== null)) {
    headers.Allow = "GET, POST";
    problem(405, "Để sửa ánh xạ, vui lòng dùng nút Lưu, Xóa hoặc Khôi phục mặc định trên trang này.");
    return;
  }
  var exportJSON = method === "GET" && /(?:\?|&)format=json(?:&|$)/.test(url);
  var storage = typeof $persistentStore !== "undefined" ? $persistentStore : null;
  var storageAvailable = !!(storage && typeof storage.read === "function");
  var engine = createG1MappingConfig(storage);
  var config = engine.read();
  var presetCatalog = engine.presets();
  var responseStatus = 200;
  var actionError = "";
  var formDraft = null;
  var clearMessage = "";

  if (method === "POST") {
    // Only these request metadata fields are read; cookies and authorization are unused.
    var origin = requestHeader("origin");
    var fetchSite = requestHeader("sec-fetch-site");
    if (typeof origin !== "string" || origin.toLowerCase() !== "https://one.google.com" ||
        (typeof fetchSite !== "undefined" && (typeof fetchSite !== "string" || fetchSite.toLowerCase() !== "same-origin"))) {
      problem(403, "Vui lòng gửi thay đổi từ trang quản lý SKU trên thiết bị này và giữ module Shadowrocket bật.");
      return;
    }
    var contentType = requestHeader("content-type");
    if (typeof contentType !== "string" ||
        !/^application\/x-www-form-urlencoded(?:\s*;\s*charset\s*=\s*(?:utf-8|\"utf-8\"))?\s*$/i.test(contentType)) {
      problem(415, "Yêu cầu lưu phải dùng định dạng biểu mẫu của trang.");
      return;
    }
    var body = $request.body;
    if (typeof body !== "string") {
      problem(400, "Không nhận được nội dung biểu mẫu; vui lòng cập nhật module và mở lại trang quản lý.");
      return;
    }
    try {
      if (body.length > 20000 || encodeURIComponent(body).replace(/%[0-9A-F]{2}/g, "x").length > 20000) {
        problem(413, "Biểu mẫu vượt quá 20KB, vui lòng lưu từng quy tắc ánh xạ.");
        return;
      }
    } catch (error) {
      problem(400, "Lỗi mã hóa biểu mẫu, vui lòng nhập lại rồi gửi.");
      return;
    }
    var parsed = parseForm(body);
    if (!parsed.ok) {
      problem(400, parsed.error);
      return;
    }
    var fields = parsed.fields;
    if (fields.action !== "upsert" && fields.action !== "delete" && fields.action !== "reset" && fields.action !== "preset") {
      problem(400, "Thao tác biểu mẫu không hợp lệ, vui lòng mở lại trang quản lý.");
      return;
    }
    if (fields.action === "preset" ? Object.keys(fields).length !== 3 ||
        !Object.prototype.hasOwnProperty.call(fields, "revision") ||
        !Object.prototype.hasOwnProperty.call(fields, "preset") :
        Object.prototype.hasOwnProperty.call(fields, "preset")) {
      problem(400, "Trường biểu mẫu preset không hợp lệ, vui lòng mở lại trang quản lý.");
      return;
    }
    var result = changeMapping(fields);
    if (result.ok) {
      headers.Location = ROOT + "?notice=" + (fields.action === "preset" ? "preset" :
        fields.action === "reset" ? "reset" : fields.action === "delete" ? "deleted" : "saved");
      $done({ response: { status: 303, headers: headers, body: "" } });
      return;
    }
    responseStatus = result.status;
    actionError = result.error;
    config = engine.read();
    if (responseStatus === 409) formDraft = null;
  } else if (!exportJSON && /(?:\?|&)clear=1(?:&|$)/.test(url)) {
    try {
      var scanCleared = storage.write("{}", SCAN_KEY);
      var testCleared = storage.write("{}", TEST_KEY);
      clearMessage = scanCleared && testCleared ? "Đã xóa 2 bản ghi lịch sử quét và thực thi trên máy, cấu hình ánh xạ giữ nguyên." : "Xóa bản ghi cục bộ chưa hoàn tất.";
    } catch (error) {
      clearMessage = "Bộ nhớ cục bộ chưa sẵn sàng.";
    }
  }

  function query(name) {
    var pieces = url.indexOf("?") < 0 ? [] : url.slice(url.indexOf("?") + 1).split("#")[0].split("&");
    for (var i = 0; i < pieces.length; i++) {
      var at = pieces[i].indexOf("=");
      try {
        if (decodeURIComponent((at < 0 ? pieces[i] : pieces[i].slice(0, at)).replace(/\+/g, " ")) === name) {
          return decodeURIComponent((at < 0 ? "" : pieces[i].slice(at + 1)).replace(/\+/g, " "));
        }
      } catch (error) { return null; }
    }
    return null;
  }
  function requestHeader(name) {
    var source = $request.headers;
    if (!source || typeof source !== "object") return undefined;
    var names = Object.keys(source).filter(function (key) { return key.toLowerCase() === name; });
    if (!names.length) return undefined;
    return names.length === 1 && typeof source[names[0]] === "string" ? source[names[0]] : null;
  }
  function problem(code, message) {
    headers["Content-Type"] = "application/json; charset=utf-8";
    $done({ response: { status: code, headers: headers, body: JSON.stringify({ error: message }) } });
  }
  function parseForm(value) {
    var out = Object.create(null);
    var allowed = ["action", "revision", "id", "match", "from", "to", "enabled", "preset"];
    var parts = value.split("&");
    for (var i = 0; i < parts.length; i++) {
      var at = parts[i].indexOf("=");
      var key;
      var val;
      try {
        key = decodeURIComponent((at < 0 ? parts[i] : parts[i].slice(0, at)).replace(/\+/g, " "));
        val = decodeURIComponent((at < 0 ? "" : parts[i].slice(at + 1)).replace(/\+/g, " "));
      } catch (error) { return { ok: false, error: "Lỗi mã hóa biểu mẫu, vui lòng nhập lại rồi gửi." }; }
      if (allowed.indexOf(key) === -1 || Object.prototype.hasOwnProperty.call(out, key)) {
        return { ok: false, error: "Trường biểu mẫu bị lặp hoặc không hợp lệ, vui lòng mở lại trang quản lý." };
      }
      out[key] = val;
    }
    return { ok: true, fields: out };
  }
  function changeMapping(fields) {
    if (fields.action === "preset") return engine.applyPreset(fields.revision, fields.preset);
    if (fields.revision !== config.revision) {
      return { ok: false, status: 409, error: "Cấu hình đã thay đổi nên chưa lưu; trang đã tải quy tắc mới nhất, vui lòng thao tác lại." };
    }
    if (fields.action === "reset") return engine.save(fields.revision, [], true);
    if (config.status !== "default" && config.status !== "custom") {
      return { ok: false, status: config.status === "unavailable" ? 503 : 409,
        error: "Cấu hình ánh xạ hiện chưa sẵn sàng, vui lòng khôi phục mặc định rồi sửa lại." };
    }
    var id = fields.id || "";
    var index = -1;
    var rules = config.rules.slice();
    rules.forEach(function (rule, position) { if (rule.id === id) index = position; });
    if (id && index === -1) return { ok: false, status: 400, error: "Quy tắc này không còn tồn tại, vui lòng tải lại trang rồi sửa lại." };
    if (fields.action === "delete") {
      if (index === -1) return { ok: false, status: 400, error: "Vui lòng bấm nút xóa từ một quy tắc đang tồn tại." };
      rules.splice(index, 1);
    } else {
      formDraft = {
        id: id, match: fields.match || "", from: typeof fields.from === "string" ? fields.from.trim() : "",
        to: typeof fields.to === "string" ? fields.to.trim() : "", enabled: fields.enabled === "1"
      };
      if (typeof fields.enabled !== "undefined" && fields.enabled !== "1") {
        return { ok: false, status: 400, error: "Trạng thái kích hoạt không hợp lệ, vui lòng tích chọn lại rồi lưu." };
      }
      var rule = { id: id || engine.newId(), match: formDraft.match, from: formDraft.from,
        to: formDraft.to, enabled: formDraft.enabled };
      if (index < 0) rules.push(rule); else rules[index] = rule;
    }
    return engine.save(fields.revision, rules, false);
  }

  function load(key) {
    if (!storageAvailable) return {};
    try {
      var value = JSON.parse($persistentStore.read(key) || "{}");
      return value && value.schemaVersion === 1 ? value : {};
    } catch (error) {
      return {};
    }
  }
  function text(value, length) {
    return typeof value === "string" ? value.slice(0, length || 180) : "";
  }
  function mode(value) {
    return value === "discount75" || value === "custom" || value === "trial" || value === "discount" ? value : "";
  }
  function modeName(value) {
    return mode(value) ? MODE_NAMES[value] : "Chưa ghi nhận";
  }
  function count(value) {
    var number = Number(value);
    return isFinite(number) && number > 0 ? Math.floor(number) : 0;
  }
  function sku(value) {
    return typeof value === "string" && /^(?:g1\.|com\.google\.(?:one|gemini)\.)[A-Za-z0-9._-]{1,160}$/.test(value) ? value : "";
  }
  function rows(value, withTime, defaultTarget) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, 300).filter(function (row) {
      return row && typeof row.id === "string" &&
        /^(?:g1\.|com\.google\.(?:one|gemini)\.)[A-Za-z0-9._-]{1,160}$/.test(row.id);
    }).map(function (row) {
      var out = { id: row.id, count: count(row.count) };
      if (withTime) {
        out.lastSeen = text(row.lastSeen, 32);
      } else {
        out.to = sku(row.to) || (row.id.indexOf("g1.ios.2tb.") === 0 ? defaultTarget || "" : "");
        out.fallback = row.fallback === true;
      }
      return out;
    }).sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
  }

  var scanStatuses = {
    "new-skus": "Phát hiện và lưu mã SKU mới",
    "known-skus": "Nhận phản hồi, mã SKU đã có trong danh sách",
    "no-skus": "Nhận phản hồi văn bản, không có mã SKU",
    "limit-reached": "Có mã mới nhưng đã đạt giới hạn 300 mã",
    "non-text": "Nhận phản hồi không phải văn bản"
  };
  var scanPaths = ["/", "/ai", "/plans", "/_/…/data/batchexecute", "[其他 one.google.com 路径]"];
  function recent(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(-10).filter(function (event) {
      return event && typeof event.at === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(event.at) &&
        (event.bodyType === "text" || event.bodyType === "non-text") &&
        Object.prototype.hasOwnProperty.call(scanStatuses, event.status);
    }).map(function (event) {
      return {
        at: event.at,
        path: scanPaths.indexOf(event.path) !== -1 ? event.path : "[其他 one.google.com 路径]",
        bodyType: event.bodyType,
        status: event.status,
        candidateCount: count(event.candidateCount),
        addedCount: count(event.addedCount),
        omittedCount: count(event.omittedCount)
      };
    });
  }

  var scanRaw = load(SCAN_KEY);
  var testRaw = load(TEST_KEY);
  var recordedTarget = sku(testRaw.target);
  if (!recordedTarget && /^(?:pro-annual-test-v[12]|g1-acq-v7(?:\.0|\.1)?)$/.test(testRaw.version || "")) {
    recordedTarget = LEGACY_TARGET;
  }
  var matchedFrom = rows(testRaw.matchedFrom, false, recordedTarget);
  // Template counts require an explicitly recorded target, not a legacy inference.
  var executedRows = rows(testRaw.matchedFrom, false, "").filter(function (row) {
    return engine.validSku(row.id) && engine.validSku(row.to);
  });
  if (!recordedTarget && !Object.prototype.hasOwnProperty.call(testRaw, "mappingRevision")) {
    matchedFrom.some(function (row) {
      if (row.id.indexOf("g1.ios.2tb.") === 0 && row.to) {
        recordedTarget = row.to;
        return true;
      }
      return false;
    });
  }
  var annualHitCount = typeof testRaw.annualHitCount === "number" ? count(testRaw.annualHitCount) :
    matchedFrom.reduce(function (total, row) {
      return total + (row.id.indexOf("g1.ios.2tb.") === 0 ? row.count : 0);
    }, 0);
  var storedOrigin = text(testRaw.targetOrigin, 32);
  var targetOrigin = recordedTarget && /^(?:user-specified|user-configured|pattern-derived|legacy)$/.test(storedOrigin) ?
    storedOrigin : recordedTarget === DEFAULT_TARGET ? "user-specified" :
      recordedTarget === LEGACY_TARGET ? "legacy" : "";
  var report = {
    schemaVersion: 1,
    reportVersion: VERSION,
    configuredMode: config.mode,
    configuredTarget: config.target,
    storageAvailable: storageAvailable,
    mappingConfig: {
      status: config.status, revision: config.revision, updatedAt: config.updatedAt,
      mode: config.mode, customized: config.customized, rules: config.rules,
      target: config.target, targetOrigin: config.targetOrigin, error: config.error, limit: engine.limit
    },
    scan: {
      version: text(scanRaw.version, 32),
      mode: mode(scanRaw.mode),
      updatedAt: text(scanRaw.updatedAt, 32),
      scannedResponses: count(scanRaw.scannedResponses),
      matchedResponses: count(scanRaw.matchedResponses),
      nonTextResponses: count(scanRaw.nonTextResponses),
      recentResponses: recent(scanRaw.recentResponses),
      truncated: scanRaw.truncated === true,
      limit: 300,
      skus: rows(scanRaw.skus, true)
    },
    test: {
      version: text(testRaw.version, 32),
      mode: mode(testRaw.mode),
      updatedAt: text(testRaw.updatedAt, 32),
      mappingRevision: text(testRaw.mappingRevision, 64),
      mappingUpdatedAt: text(testRaw.mappingUpdatedAt, 32),
      mappingStatus: ["default", "custom", "invalid", "unavailable"].indexOf(testRaw.mappingStatus) !== -1 ? testRaw.mappingStatus : "",
      sourcePrefix: "g1.ios.2tb.",
      target: recordedTarget,
      targetOrigin: targetOrigin,
      status: text(testRaw.status, 32),
      hitCount: count(testRaw.hitCount),
      annualHitCount: annualHitCount,
      matchedFrom: matchedFrom
    }
  };

  console.log("[g1-sku-report] " + VERSION + " " + (exportJSON ? "json" : "html") +
    " storage=" + (storageAvailable ? "ready" : "unavailable") + " candidates=" + report.scan.skus.length);
  if (exportJSON) {
    headers["Content-Type"] = "application/json; charset=utf-8";
    headers["Content-Disposition"] = 'attachment; filename="g1-sku-report.json"';
    $done({ response: { status: 200, headers: headers, body: JSON.stringify(report, null, 2) } });
    return;
  }

  function escape(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }
  function fallbackName(row) {
    if (!row.fallback) return "Không";
    var discount = /_ip_(\d+p)\.acq$/.exec(row.to || "");
    return discount ? discount[1] : "Có";
  }
  function table(items, withTime) {
    if (!items.length) return "<p>Chưa có bản ghi nào.</p>";
    return "<div class=scroll><table><thead><tr><th>Mã SKU đầy đủ</th><th>Số lần</th>" +
      (withTime ? "<th>Lần thấy gần nhất (UTC)</th><th>Tạo ánh xạ mới</th>" : "<th>SKU đích thực tế</th><th>Mức dự phòng</th>") + "</tr></thead><tbody>" +
      items.map(function (row) {
        return "<tr><td><code>" + escape(row.id) + "</code></td><td>" + row.count + "</td>" +
          (withTime ? "<td>" + escape(row.lastSeen) + "</td><td><a href=\"" + ROOT + "?from=" + escape(encodeURIComponent(row.id)) + "#new-mapping\">Dùng làm SKU gốc</a></td>" :
            "<td><code>" + escape(row.to || "Chưa ghi nhận") + "</code></td><td>" + fallbackName(row) + "</td>") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }
  function recentTable(events) {
    if (!events.length) return "<p>Chưa có lịch sử từng phản hồi.</p>";
    return "<div class=scroll><table><thead><tr><th>Thời gian (UTC)</th><th>Phân loại đường dẫn</th><th>Kết quả</th><th>Số SKU nhận diện</th><th>Mới thêm</th><th>Vượt giới hạn</th></tr></thead><tbody>" +
      events.slice().reverse().map(function (event) {
        var displayPath = event.path === "[其他 one.google.com 路径]" ? "[Đường dẫn one.google.com khác]" : event.path;
        return "<tr><td>" + escape(event.at) + "</td><td>" + escape(displayPath) +
          "</td><td>" + scanStatuses[event.status] + "</td><td>" + event.candidateCount +
          "</td><td>" + event.addedCount + "</td><td>" + event.omittedCount + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }
  var validConfig = config.status === "default" || config.status === "custom";
  var writable = !!(storageAvailable && typeof storage.write === "function" && config.status !== "unavailable");
  var enabledCount = config.rules.filter(function (rule) { return rule.enabled; }).length;
  var applied = validConfig && report.test.version === COLLECTOR_VERSION &&
    report.test.mappingRevision === config.revision && report.test.mappingUpdatedAt === config.updatedAt &&
    report.test.mappingStatus === config.status;
  var notices = {
    preset: "Đã lưu mẫu preset vào máy và bật các quy tắc tương ứng; lần mở trang gói /ai tiếp theo sẽ áp dụng cấu hình mới.",
    saved: "Đã lưu ánh xạ vào máy; lần mở trang gói /ai tiếp theo sẽ áp dụng các quy tắc này.",
    deleted: "Đã xóa quy tắc ánh xạ; lịch sử quét và thực thi được giữ nguyên.",
    reset: "Đã khôi phục 3 quy tắc mặc định; lịch sử quét và thực thi được giữ nguyên."
  };
  var notice = query("notice");
  var noticeText = method === "GET" && config.updatedAt && Object.prototype.hasOwnProperty.call(notices, notice) ? notices[notice] : "";
  var prefill = query("from");
  var newRule = { id: "", match: "exact", from: engine.validSku(prefill) ? prefill : "", to: "", enabled: true };
  var orphanDraft = formDraft && formDraft.id && !config.rules.some(function (rule) { return rule.id === formDraft.id; });
  if (orphanDraft) {
    newRule = { id: "", match: formDraft.match, from: formDraft.from, to: formDraft.to, enabled: formDraft.enabled };
  }
  var candidates = Object.create(null);
  report.scan.skus.forEach(function (row) { if (engine.validSku(row.id)) candidates[row.id] = true; });
  var candidateRules = config.rules.concat(engine.defaults());
  presetCatalog.forEach(function (preset) { candidateRules = candidateRules.concat(preset.rules); });
  candidateRules.forEach(function (rule) {
    if (engine.validSku(rule.from)) candidates[rule.from] = true;
    if (engine.validSku(rule.to)) candidates[rule.to] = true;
  });
  function revisionInput() {
    return "<input type=hidden name=revision value=\"" + escape(config.revision) + "\">";
  }
  function presetExecution(preset, matches) {
    if (!validConfig) return "<p class=note>Cấu hình hiện tại chưa sẵn sàng, tạm chưa thống kê lượt khớp mẫu.</p>";
    if (!matches) return "<p class=note>Quy tắc hiện tại chưa áp dụng mẫu này.</p>";
    if (!applied) return "<p class=note>Đang chờ phản hồi /ai mới với cấu hình hiện tại.</p>";
    var counts = preset.rules.map(function () { return 0; });
    var total = 0;
    executedRows.forEach(function (row) {
      var matched = false;
      preset.rules.forEach(function (rule, index) {
        var sourceMatches = rule.match === "exact" ? row.id === rule.from :
          row.id.length > rule.from.length && row.id.indexOf(rule.from) === 0;
        if (sourceMatches && row.to === rule.to) {
          counts[index] += row.count;
          matched = true;
        }
      });
      if (matched) total += row.count;
    });
    return "<div class=preset-execution><p class=note>Phản hồi gần nhất: Mẫu này khớp " + total + " lần.</p>" +
      preset.rules.map(function (rule, index) {
        return "<p class=note><code>" + escape(rule.from) + "</code>: " + counts[index] + " lần</p>";
      }).join("") + "</div>";
  }
  function presetTemplates() {
    return "<section id=mapping-presets><h2>Mẫu Ánh Xạ Có Sẵn (Chọn Bộ Test Ultra 1 Chạm · v7.13.0)</h2>" +
      "<p>Bấm <strong>“Áp dụng mẫu”</strong> để lưu ngay: tự động cập nhật và bật quy tắc cho SKU gốc tương ứng, đồng thời thống kê số lần khớp của từng nguồn ngay trên thẻ mẫu.</p>" +
      "<p class=note>Sau khi bấm Áp dụng mẫu, hãy mở lại trang gói trong Google App / Gemini để nạp SKU mới.</p>" +
      "<div class=preset-grid>" + presetCatalog.map(function (preset) {
        var matches = validConfig && preset.rules.every(function (target) {
          return config.rules.some(function (rule) {
            return rule.match === target.match && rule.from === target.from && rule.to === target.to && rule.enabled;
          });
        });
        var pairs = preset.rules.map(function (rule) {
          return "<div class=preset-pair><span class=note>" + (rule.match === "exact" ? "Khớp chính xác SKU" : "Tiền tố SKU") +
            "</span><code>" + escape(rule.from) + "</code><span aria-label=Thay_bằng>↓</span><code>" + escape(rule.to) + "</code></div>";
        }).join("");
        return "<form class=preset method=post action=\"" + ROOT + "\"><fieldset" +
          (!writable || !validConfig ? " disabled" : "") + "><legend>" + escape(preset.title) + "</legend>" +
          revisionInput() + "<input type=hidden name=preset value=\"" + escape(preset.id) + "\">" +
          "<p class=note>" + escape(preset.description) + "</p>" + pairs +
          (matches ? "<p class=preset-state>Đang áp dụng bộ này</p>" : "") + presetExecution(preset, matches) +
          "<button class=primary type=submit name=action value=preset>Áp dụng mẫu</button></fieldset></form>";
      }).join("") + "</div></section>";
  }
  function ruleForm(rule, isNew) {
    var draft = formDraft && formDraft.id === rule.id ? formDraft : rule;
    var disabled = !writable || !validConfig || (isNew && config.rules.length >= engine.limit);
    var select = "<option value=exact" + (draft.match === "exact" ? " selected" : "") + ">SKU đầy đủ (Khớp chính xác)</option>" +
      "<option value=prefix" + (draft.match === "prefix" ? " selected" : "") + ">Tiền tố SKU (Kết thúc bằng dấu chấm .)</option>";
    if (draft.match !== "exact" && draft.match !== "prefix") select = "<option value=\"\" selected>Chọn kiểu khớp</option>" + select;
    return "<form class=rule method=post action=\"" + ROOT + "\"" + (isNew ? " id=new-mapping" : "") + ">" +
      "<fieldset" + (disabled ? " disabled" : "") + "><legend>" + (isNew ? "Thêm ánh xạ mới" : "Sửa quy tắc ánh xạ") + "</legend>" +
      revisionInput() + "<input type=hidden name=id value=\"" + escape(rule.id) + "\">" +
      "<div class=fields><label>Kiểu khớp<select name=match required>" + select + "</select></label>" +
      "<label class=check><input type=checkbox name=enabled value=1" + (draft.enabled ? " checked" : "") + ">Bật quy tắc này</label>" +
      "<label>SKU gốc (From)<input name=from type=text list=sku-candidates required maxlength=175 pattern=\"(?:g1\\.|com\\.google\\.(?:one|gemini)\\.)[A-Za-z0-9._\\-]{1,160}\" autocomplete=off autocapitalize=none spellcheck=false value=\"" +
      escape(draft.from.slice(0, 300)) + "\" placeholder=\"g1.ios.20tb.m.v2\"></label>" +
      "<label>SKU đích (To)<input name=to type=text list=sku-candidates required maxlength=175 pattern=\"(?:g1\\.|com\\.google\\.(?:one|gemini)\\.)[A-Za-z0-9._\\-]{0,159}[A-Za-z0-9_\\-]\" autocomplete=off autocapitalize=none spellcheck=false value=\"" +
      escape(draft.to.slice(0, 300)) + "\" placeholder=\"g1.20tb.3months_ip_75p.acq\"></label></div>" +
      "<div class=actions><button class=primary type=submit name=action value=upsert>" + (isNew ? "Thêm và lưu" : "Lưu quy tắc này") + "</button>" +
      (isNew ? "" : "<button class=delete type=submit name=action value=delete formnovalidate>Xóa quy tắc này</button>") + "</div></fieldset></form>";
  }
  function mappingEditor() {
    var parts = ["<section id=mapping-editor><h2>Quản Lý Quy Tắc Ánh Xạ</h2>",
      "<p>Sau khi sửa SKU gốc, SKU đích hoặc trạng thái bật/tắt, hãy bấm nút <strong>Lưu quy tắc này</strong> ở khung đó.</p>",
      "<p><strong>Đang bật " + enabledCount + " / tổng " + config.rules.length + " quy tắc</strong> (tối đa " + engine.limit + " quy tắc).</p>",
      "<p>Thời gian lưu cấu hình (UTC): " + escape(config.updatedAt || "Đang dùng mặc định tích hợp sẵn, chưa lưu thủ công") + "</p>"];
    if (!validConfig) parts.push("<p class=error role=alert>" + escape(config.error) + "</p>");
    else if (applied) parts.push("<p class=success>Lần thực thi gần nhất đã đọc cấu hình hiện tại; đã thay thế " + report.test.hitCount + " vị trí SKU.</p>");
    else parts.push("<p class=note>Đang chờ phản hồi trang gói /ai tiếp theo đọc cấu hình này; sau khi lưu hãy mở lại trang gói trong Google App rồi tải lại trang này để kiểm tra.</p>");
    if (validConfig && enabledCount === 0) parts.push("<p class=note>Hiện không có quy tắc nào được bật: chỉ thu thập SKU, giữ nguyên nội dung phản hồi.</p>");
    if (!writable) parts.push("<p class=error>Bộ nhớ cấu hình cục bộ chưa sẵn sàng, các nút chỉnh sửa tạm khóa.</p>");
    parts.push("<p class=note>Ưu tiên khớp SKU đầy đủ trước; quy tắc tiền tố ưu tiên tiền tố dài hơn và phải kết thúc bằng dấu chấm (.). Mỗi SKU gốc chỉ thay 1 lần, không thay nối tiếp.</p>");
    parts.push("<datalist id=sku-candidates>" + Object.keys(candidates).sort().map(function (id) {
      return "<option value=\"" + escape(id) + "\"></option>";
    }).join("") + "</datalist>");
    config.rules.forEach(function (rule) { parts.push(ruleForm(rule, false)); });
    if (orphanDraft) parts.push("<p class=note>Nội dung vừa nhập chưa được xác nhận lưu đã được giữ lại ở khung Thêm mới bên dưới; vui lòng kiểm tra rồi lưu lại.</p>");
    parts.push(ruleForm(newRule, true));
    if (config.rules.length >= engine.limit) parts.push("<p class=note>Đã đạt giới hạn 30 quy tắc, hãy xóa bớt 1 quy tắc trước khi thêm mới.</p>");
    parts.push("<form class=reset method=post action=\"" + ROOT + "\">" + revisionInput() +
      "<button type=submit name=action value=reset" + (!writable ? " disabled" : "") + ">Khôi phục ánh xạ mặc định</button></form>",
      "<p class=note>Khôi phục mặc định sẽ đưa về 3 quy tắc gốc (2TB 12 tháng 90p, 20TB / 30TB 3 tháng 75p); lịch sử quét và thực thi vẫn giữ nguyên.</p></section>");
    return parts.join("");
  }
  var latestScan = report.scan.recentResponses.length ?
    report.scan.recentResponses[report.scan.recentResponses.length - 1] : null;
  var scanVersionStatus = report.scan.version === COLLECTOR_VERSION ?
    "Bản ghi từ script thu thập phiên bản hiện tại." :
    report.scan.version ? "Bản ghi từ phiên bản cũ; chưa có phản hồi mới từ bản hiện tại." : "Chưa có bản ghi phản hồi nào được lưu.";
  var configuredOffers = config.mode === "discount75" ?
    "Mặc định hiện tại cho 20TB / 30TB dùng gói Ultra 3 tháng 75p (giảm 75%)." :
    config.mode === "custom" ? "Đang dùng ánh xạ tùy chỉnh (theo các quy tắc đang bật ở mục Quản lý bên trên)." : "Cấu hình ánh xạ chưa sẵn sàng, tạm dừng ghi đè.";
  var statuses = {
    "rewritten": "Đã thay thế mã SKU thành công",
    "no-match": "Phản hồi này không khớp quy tắc nào đang bật",
    "non-text": "Phản hồi không phải văn bản có thể xử lý",
    "config-error": "Lỗi đọc cấu hình ánh xạ, giữ nguyên phản hồi"
  };
  var status = Object.prototype.hasOwnProperty.call(statuses, report.test.status) ?
    statuses[report.test.status] : "Chưa có bản ghi thực thi";
  if (report.test.version === "pro-annual-test-v1" && report.test.status === "no-match") {
    status = "Bản ghi v1 cũ: phản hồi không khớp tiền tố iOS 2TB";
  }
  var defaultTab = (prefill || formDraft || notice === "saved" || notice === "deleted" || notice === "reset") ? "rules" :
    (query("tab") === "presets" || notice === "preset") ? "presets" : "runtime";
  var runtimeTerminalLines = [
    "[runtime] collector=" + (report.test.version || "chưa-chạy") + " report=" + VERSION + " mode=" + (report.test.mode || report.configuredMode || "custom") + " status=" + (report.test.status || "waiting"),
    "[runtime] configRevision=" + (report.test.mappingRevision || config.revision || "default").slice(0, 16) + " hitCount=" + report.test.hitCount + " annual2tbHits=" + report.test.annualHitCount + " executedAt=" + (report.test.updatedAt || "--")
  ];
  report.test.matchedFrom.forEach(function (row) {
    runtimeTerminalLines.push("[rewrite] " + row.id + " ━━► " + (row.to || "N/A") + " (x" + row.count + " lần)");
  });
  report.scan.recentResponses.slice().reverse().forEach(function (ev) {
    var p = ev.path === "[其他 one.google.com 路径]" ? "[Đường dẫn one.google.com khác]" : ev.path;
    runtimeTerminalLines.push("[packet " + ev.at.slice(11, 19) + " UTC] path=" + p + " status=" + ev.status + " skus=" + ev.candidateCount + " new=" + ev.addedCount);
  });

  var html = [
    "<!doctype html><html lang=vi><meta charset=utf-8>",
    "<meta name=viewport content=\"width=device-width,initial-scale=1\"><title>G1 ACQ Control & Nhật Ký Bắt Gói Realtime (" + VERSION + ")</title>",
    "<style>*{box-sizing:border-box}body{font:15px/1.6 -apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;max-width:1360px;margin:0 auto;padding:18px 20px 44px;color:#e2e8f0;background:#070b14}section{background:#131c31;border:1px solid #263554;border-radius:14px;padding:20px 22px;margin:18px 0;box-shadow:0 8px 24px rgba(0,0,0,.28)}h1{font-size:23px;margin:0 0 8px;color:#f8fafc}h2{font-size:19px;margin:0 0 12px;color:#f8fafc}h3{font-size:16px;margin:18px 0 10px;color:#cbd5e1}code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#38bdf8;overflow-wrap:anywhere}a{color:#60a5fa}table{border-collapse:collapse;width:100%;font-size:14px;background:#0b1222;border-radius:10px;overflow:hidden}th{background:#16223b;color:#93c5fd;font-weight:700;padding:11px 12px;border-bottom:1px solid #263554;text-align:left}td{padding:10px 12px;border-bottom:1px solid #1e293b;text-align:left;vertical-align:top;color:#e2e8f0}.scroll{overflow:auto;border:1px solid #263554;border-radius:10px}.note{color:#94a3b8}.badge,.success{background:rgba(16,185,129,.16);color:#34d399;border:1px solid rgba(16,185,129,.35);padding:8px 14px;border-radius:8px;font-weight:600}.badge{display:inline-block}.error{background:rgba(239,68,68,.16);color:#fca5a5;border:1px solid rgba(239,68,68,.4);padding:12px 14px;border-radius:8px;overflow-wrap:anywhere}.top-bar{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:14px;background:#131c31;border:1px solid #263554;border-radius:16px;padding:18px 22px;margin-bottom:16px}.actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:0}.actions form{margin:0}button,.actions a{font:inherit;font-weight:700;padding:10px 16px;border:1px solid #334155;border-radius:9px;cursor:pointer;text-decoration:none;background:#1e293b;color:#f8fafc}.primary{background:#2563eb;border-color:#3b82f6;color:white}.delete{background:rgba(239,68,68,.18);border-color:rgba(239,68,68,.4);color:#fca5a5}fieldset{min-width:0;margin:0;border:1px solid #263554;border-radius:12px;padding:16px;background:#0b1222}legend{font-weight:700;padding:0 8px;color:#f8fafc}.rule{margin:16px 0}.fields{display:grid;grid-template-columns:1fr 1fr;gap:14px}.fields label{font-weight:600;min-width:0;color:#cbd5e1}input[type=text],select{font:15px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;width:100%;padding:11px 12px;margin-top:6px;border:1px solid #334155;border-radius:8px;background:#131c31;color:#f8fafc}input[type=text]{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.check{display:flex;align-items:center;gap:10px;align-self:end;min-height:46px}.check input{width:20px;height:20px}.rule .actions{margin-top:14px}button:disabled,fieldset:disabled{opacity:.5}button:disabled{cursor:default}.reset{margin-top:20px}.preset-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}.preset{min-width:0;margin:0}.preset fieldset{height:100%;display:flex;flex-direction:column}.preset legend{max-width:100%;font-size:15.5px}.preset .note{font-size:13.5px}.preset-pair{padding:10px 12px;margin:10px 0;background:#131c31;border:1px solid #223252;border-radius:8px}.preset-pair code{display:block;font-size:13px;line-height:1.6}.preset-state{align-self:flex-start;font-size:13px;font-weight:700;padding:5px 10px;margin:0 0 10px;background:rgba(16,185,129,.16);color:#34d399;border:1px solid rgba(16,185,129,.35);border-radius:6px}.preset button{width:100%;margin-top:auto}.tab-radio{display:none}.tab-nav{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;background:#0f172a;border:1px solid #263554;border-radius:14px;padding:8px;margin-bottom:18px}.tab-label{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 16px;border-radius:10px;font-size:15.5px;font-weight:800;color:#94a3b8;cursor:pointer;text-align:center;border:1px solid transparent}.tab-badge{padding:2px 9px;border-radius:999px;font-size:12px;background:#1e293b;color:#38bdf8}#tab-runtime:checked~.tab-nav label[for=tab-runtime],#tab-presets:checked~.tab-nav label[for=tab-presets],#tab-rules:checked~.tab-nav label[for=tab-rules]{background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;border-color:#60a5fa;box-shadow:0 6px 18px rgba(37,99,235,.35)}#tab-runtime:checked~.tab-nav label[for=tab-runtime] .tab-badge,#tab-presets:checked~.tab-nav label[for=tab-presets] .tab-badge,#tab-rules:checked~.tab-nav label[for=tab-rules] .tab-badge{background:white;color:#1e3a8a}.tab-pane{display:none}#tab-runtime:checked~.pane-runtime,#tab-presets:checked~.pane-presets,#tab-rules:checked~.pane-rules{display:block}.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}.kpi-card{background:linear-gradient(145deg,#15223c,#0f172a);border:1px solid #263554;border-radius:14px;padding:16px 18px}.kpi-title{font-size:12px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.04em}.kpi-val{font-size:24px;font-weight:800;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#f8fafc;margin:4px 0}.kpi-sub{font-size:13px;color:#94a3b8}.term-box{background:#050811;border:1px solid #1e2d4a;border-radius:14px;overflow:hidden;margin-bottom:18px}.term-head{background:#0d1424;padding:11px 16px;border-bottom:1px solid #1e2d4a;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:13px;font-weight:700;color:#38bdf8;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}.term-body{padding:14px 18px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:13.5px;line-height:1.7;max-height:320px;overflow-y:auto}.term-line{padding:3px 0;border-bottom:1px dashed rgba(51,65,85,.3);word-break:break-all}.term-rw{color:#34d399;font-weight:700}.term-pkt{color:#38bdf8}.term-rt{color:#fbbf24;font-weight:700}@media(max-width:860px){.tab-nav,.kpi-grid,.fields,.preset-grid{grid-template-columns:1fr}body{padding:12px 10px 32px}section{padding:14px}}</style>",
    "<div class=top-bar><div><h1>⚡ Trung Tâm Điều Khiển & Bắt Gói SKU Google One</h1>",
    "<span class=badge>Runtime đang hoạt động · " + VERSION + " · Chế độ: " + modeName(report.configuredMode) + "</span></div>",
    "<nav class=actions aria-label=Thao_tác_báo_cáo><a class=primary href=\"" + ROOT + "\">🔄 Làm mới Log Realtime</a><form method=get action=\"" + ROOT + "\"><button type=submit name=format value=json>📥 Xuất JSON</button></form><form method=get action=\"" + ROOT + "\"><button class=delete name=clear value=1>🗑 Xóa Log</button></form></nav></div>",
    actionError ? "<p class=error role=alert>" + escape(actionError) + "</p>" : "",
    noticeText ? "<p class=success role=status>" + escape(noticeText) + "</p>" : "",
    clearMessage ? "<p class=success>" + escape(clearMessage) + "</p>" : "",
    storageAvailable ? "" : "<p class=error>Bộ nhớ cục bộ chưa sẵn sàng; trang này chưa đọc được bản ghi thu thập.</p>",
    "<input class=tab-radio type=radio name=g1tab id=tab-runtime" + (defaultTab === "runtime" ? " checked" : "") + ">",
    "<input class=tab-radio type=radio name=g1tab id=tab-presets" + (defaultTab === "presets" ? " checked" : "") + ">",
    "<input class=tab-radio type=radio name=g1tab id=tab-rules" + (defaultTab === "rules" ? " checked" : "") + ">",
    "<div class=tab-nav>",
    "<label class=tab-label for=tab-runtime>📡 Nhật Ký Bắt Gói · Log Realtime · Runtime <span class=tab-badge>" + report.scan.scannedResponses + " gói · " + report.test.hitCount + " đè</span></label>",
    "<label class=tab-label for=tab-presets>⚡ Chọn Bộ Mẫu 1 Chạm (Presets) <span class=tab-badge>" + presetCatalog.length + " mẫu</span></label>",
    "<label class=tab-label for=tab-rules>🛠️ Quản Lý & Sửa Tay Quy Tắc <span class=tab-badge>" + enabledCount + "/" + config.rules.length + " rule</span></label>",
    "</div>",
    "<div class=\"tab-pane pane-runtime\">",
    "<div class=kpi-grid>",
    "<div class=kpi-card><div class=kpi-title>Trạng Thái Runtime</div><div class=kpi-val style=\"color:#34d399\">" + escape(report.test.status ? report.test.status.toUpperCase() : "WAITING") + "</div><div class=kpi-sub>Script: <code>" + escape(report.test.version || COLLECTOR_VERSION) + "</code></div></div>",
    "<div class=kpi-card><div class=kpi-title>Lượt Ghi Đè (/ai gần nhất)</div><div class=kpi-val style=\"color:#38bdf8\">" + report.test.hitCount + " vị trí</div><div class=kpi-sub>Trong đó 2TB/Pro: <code>" + report.test.annualHitCount + "</code> lần</div></div>",
    "<div class=kpi-card><div class=kpi-title>Tổng Gói Tin Đã Quét</div><div class=kpi-val>" + report.scan.scannedResponses + " gói</div><div class=kpi-sub>Gói có chứa SKU: <code>" + report.scan.matchedResponses + "</code> gói</div></div>",
    "<div class=kpi-card><div class=kpi-title>Kho SKU Gốc Thu Thập</div><div class=kpi-val style=\"color:#fbbf24\">" + report.scan.skus.length + " mã</div><div class=kpi-sub>Cập nhật: <code>" + escape((report.scan.updatedAt || "Chưa có").slice(11, 19)) + "</code></div></div>",
    "</div>",
    "<div class=term-box><div class=term-head><span>● RUNTIME & PACKET CAPTURE CONSOLE STREAM</span><span>Revision: " + escape((report.test.mappingRevision || config.revision || "").slice(0, 12)) + "</span></div><div class=term-body>" +
      runtimeTerminalLines.map(function (line) {
        var cls = line.indexOf("[rewrite]") === 0 ? "term-rw" : line.indexOf("[packet") === 0 ? "term-pkt" : "term-rt";
        return "<div class=\"term-line " + cls + "\">" + escape(line) + "</div>";
      }).join("") +
    "</div></div>",
    "<section><h2>⚡ Chi Tiết Lần Thực Thi Ghi Đè SKU Gần Nhất (/ai?)</h2>",
    "<p>Trạng thái thực thi: <strong>" + escape(status) + "</strong> · Tổng số vị trí đã thay thế: <strong>" + report.test.hitCount + "</strong> (trong đó nhóm 2TB: <strong>" + report.test.annualHitCount + "</strong>)</p>",
    "<p class=note>Phiên bản Runtime: <code>" + escape(report.test.version || "Chưa có") + "</code> · Thời gian thực thi (UTC): <code>" + escape(report.test.updatedAt || "Chưa có") + "</code> · Cấu hình lưu lúc: <code>" + escape(report.test.mappingUpdatedAt || "Mặc định") + "</code></p>",
    table(report.test.matchedFrom, false), "</section>",
    "<section><h2>📡 Nhật Ký 10 Gói Tin Phản Hồi Bắt Được Gần Nhất</h2>",
    latestScan ? "<p><strong>Gói tin mới nhất: " + scanStatuses[latestScan.status] + "</strong> — Nhận diện <strong>" +
      latestScan.candidateCount + "</strong> mã SKU khác nhau, mới thêm <strong>" + latestScan.addedCount + "</strong> mã.</p>" : "",
    recentTable(report.scan.recentResponses), "</section>",
    "<section><h2>📦 Kho Toàn Bộ Mã SKU Gốc Thu Thập Được Từ Google (" + report.scan.skus.length + " Mã)</h2>",
    "<p class=note>Trích xuất từ phản hồi gốc trước khi ghi đè. Bấm <strong>“Dùng làm SKU gốc”</strong> để chuyển sang Tab Sửa Tay Quy Tắc và điền sẵn mã đó.</p>",
    report.scan.truncated ? "<p class=error>Đã đạt giới hạn 300 mã; hãy xóa bản ghi để quét lại từ đầu.</p>" : "",
    table(report.scan.skus, true), "</section>",
    "</div>",
    "<div class=\"tab-pane pane-presets\">",
    presetTemplates(),
    "</div>",
    "<div class=\"tab-pane pane-rules\">",
    mappingEditor(),
    "</div></html>"
  ].join("");
  $done({ response: { status: responseStatus, headers: headers, body: html } });
})();
