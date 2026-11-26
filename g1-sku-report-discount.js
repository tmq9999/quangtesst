/* Generated from g1-sku-report.js by tools/build-variants.cjs. */
/* Local-only report served by a Shadowrocket http-request script. */
"use strict";

(function () {
  var ROOT = "https://one.google.com/g1-sku-report";
  var VERSION = "v7.11.0";
  var COLLECTOR_VERSION = "g1-acq-v7.11-mappings";
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
  var DEFAULT_REVISION = "defaults-75p-v1";
  var SOURCE_PREFIX = "g1.ios.2tb.";
  var READ_ERROR = "Bộ nhớ cấu hình cục bộ chưa sẵn sàng, phản hồi lần này giữ nguyên.";
  var CONFIG_ERROR = "Định dạng cấu hình ánh xạ lỗi, tạm dừng ghi đè; vui lòng khôi phục mặc định rồi sửa lại.";
  var WRITE_ERROR = "Kết quả lưu chưa qua kiểm tra đọc lại, vui lòng tải lại trang để xem cấu hình hiện tại.";
  var REVISION_ERROR = "Cấu hình đã thay đổi nên chưa lưu; trang đã tải quy tắc mới nhất, vui lòng thao tác lại.";
  var RULE_FIELDS = ["id", "match", "from", "to", "enabled"];
  var RECORD_FIELDS = ["schemaVersion", "revision", "updatedAt", "customized", "rules"];

  function defaults() {
    return [
      { id: "default-2tb", match: "prefix", from: SOURCE_PREFIX, to: "g1.2tb.ai.12months_ip_90p", enabled: true },
      { id: "default-20tb", match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.20tb.3months_ip_75p.acq", enabled: true },
      { id: "default-30tb", match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.ai.ultra.3months_ip_75p.acq", enabled: true }
    ];
  }

  function presets() {
    return [
      {
        id: "ultra-30tb-75p-both",
        title: "Ultra 30TB 75p cho Google App (Cả 2 nút 20TB & 30TB)",
        description: "Khuyên dùng trong Google App (icon G): ép cả nút 20TB lẫn 30TB sang mã g1.ai.ultra.3months_ip_75p.acq (3 tháng giảm 75%) để tránh lỗi StoreKit không nhận g1.20tb.*.",
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.ai.ultra.3months_ip_75p.acq", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.ai.ultra.3months_ip_75p.acq", enabled: true }
        ]
      },
      {
        id: "ultra-75p",
        title: "Ultra 20TB / 30TB · 3 Tháng 75p (Mặc định crhywun)",
        description: "Nút 20TB dùng g1.20tb.3months_ip_75p.acq, nút 30TB dùng g1.ai.ultra.3months_ip_75p.acq (giảm 75%, trả 25%). Trong Google App hãy bấm nút 30TB ở dưới.",
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.20tb.3months_ip_75p.acq", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.ai.ultra.3months_ip_75p.acq", enabled: true }
        ]
      },
      {
        id: "ultra-1m-eft",
        title: "Ultra 30TB & 20TB · 1 Tháng Free Trial (Mã video gốc)",
        description: "Nút 20TB gắn g1.ai.ultra.1month_eft.acq (mã đã hiện bảng thanh toán Apple trong video), nút 30TB gắn g1.20tb.1month_eft.acq.",
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.ai.ultra.1month_eft.acq", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.20tb.1month_eft.acq", enabled: true }
        ]
      },
      {
        id: "ultra-90p",
        title: "Ultra 30TB & 20TB · 3 Tháng 90p (Giảm 90%)",
        description: "Nút 20TB gắn g1.ai.ultra.3months_ip_90p.acq, nút 30TB gắn g1.20tb.3months_ip_90p.acq.",
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.ai.ultra.3months_ip_90p.acq", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.20tb.3months_ip_90p.acq", enabled: true }
        ]
      },
      {
        id: "tr-ultra-30tb",
        title: "Ultra 30TB Gốc · g1.ios.30tb.m (Thổ Nhĩ Kỳ / Quốc tế)",
        description: "Mã iOS 30TB cũ (2949.99 TRY); ép cả nút 20TB và 30TB về g1.ios.30tb.m để kiểm tra bảng giá App Store.",
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.ios.30tb.m", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.ios.30tb.m", enabled: true }
        ]
      },
      {
        id: "ultra-6m-12m-acq",
        title: "Test Ultra 30TB · 6 Tháng & 12 Tháng Free Trial (.acq)",
        description: "Nút 20TB thử g1.ai.ultra.6months_eft.acq (6 tháng), nút 30TB thử g1.ai.ultra.12months_eft.acq (12 tháng).",
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.ai.ultra.6months_eft.acq", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.ai.ultra.12months_eft.acq", enabled: true }
        ]
      },
      {
        id: "ultra-6m-1y-eft",
        title: "Test Ultra 30TB · 6 Tháng (không .acq) & 1 Năm (.acq)",
        description: "Nút 20TB thử g1.ai.ultra.6months_eft, nút 30TB thử g1.ai.ultra.1year_eft.acq.",
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.ai.ultra.6months_eft", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.ai.ultra.1year_eft.acq", enabled: true }
        ]
      },
      {
        id: "ultra-20tb-6m-12m",
        title: "Test Ultra 20TB · 6 Tháng & 12 Tháng (g1.20tb / g1.play)",
        description: "Nút 20TB thử g1.20tb.6months_eft.acq, nút 30TB thử g1.play.20tb.12months_eft.",
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.20tb.6months_eft.acq", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.play.20tb.12months_eft", enabled: true }
        ]
      },
      {
        id: "ultra-gemini-99p",
        title: "Test Gemini Ultra 99p (Mở trong App Gemini)",
        description: "Thử mã com.google.gemini.ai.ultra.m.3month_ip_99p và com.google.gemini.20tb.ai.m.3month_ip_99p.",
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "com.google.gemini.ai.ultra.m.3month_ip_99p", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "com.google.gemini.20tb.ai.m.3month_ip_99p", enabled: true }
        ]
      },
      {
        id: "pro-1yuan",
        title: "Mở Pro giá rẻ từ nút 20TB (3 tháng đầu giảm 99%)",
        description: "Đổi nút 20TB sang gói Gemini Pro 2TB giảm 99% 3 tháng đầu. Chu kỳ và số tiền thực tế xem trên bảng thanh toán App Store.",
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "com.google.gemini.2tb.ai.m.3month_ip_99p", enabled: true }
        ]
      },
      {
        id: "pro-12months-90p",
        title: "2TB / Pro · 12 Tháng 90p (Giảm 90%)",
        description: "Áp dụng tiền tố 2TB sang mục tiêu ưu đãi 12 tháng giảm 90%; chu kỳ tính phí xem trên bảng thanh toán App Store.",
        rules: [
          { match: "prefix", from: SOURCE_PREFIX, to: "g1.2tb.ai.12months_ip_90p", enabled: true }
        ]
      }
    ];
  }

  function validSku(value) {
    return typeof value === "string" &&
      /^(?:g1\.|com\.google\.(?:one|gemini)\.)[A-Za-z0-9._-]{0,159}[A-Za-z0-9_-]$(?![\s\S])/.test(value);
  }

  function validPrefix(value) {
    return typeof value === "string" &&
      /^(?:g1\.|com\.google\.(?:one|gemini)\.)[A-Za-z0-9._-]{1,159}\.$(?![\s\S])/.test(value);
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

    var rules = current.rules.slice();
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
  function presetTemplates() {
    return "<section id=mapping-presets><h2>Mẫu Ánh Xạ Có Sẵn (Chọn Bộ Test Ultra 1 Chạm)</h2>" +
      "<p>Bấm <strong>“Áp dụng mẫu”</strong> để lưu ngay: tự động cập nhật và bật quy tắc cho SKU gốc tương ứng, giữ nguyên các quy tắc khác.</p>" +
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
          (matches ? "<p class=preset-state>Đang áp dụng bộ này</p>" : "") +
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
  var html = [
    "<!doctype html><html lang=vi><meta charset=utf-8>",
    "<meta name=viewport content=\"width=device-width,initial-scale=1\"><title>Quản Lý SKU Google One (Ultra / Pro)</title>",
    "<style>*{box-sizing:border-box}body{font:16px/1.6 -apple-system,BlinkMacSystemFont,sans-serif;max-width:960px;margin:24px auto;padding:0 18px;color:#1c2737;background:#f5f7fa}section{background:white;border:1px solid #dde3ec;border-radius:12px;padding:18px;margin:18px 0}h1{font-size:24px;margin-bottom:10px}h2{font-size:20px}code{overflow-wrap:anywhere}a{color:#1259be}table{border-collapse:collapse;width:100%;font-size:14px}td,th{padding:9px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}.scroll{overflow:auto}.note{color:#46556b}.badge,.success{background:#e0f4e8;color:#176238;padding:8px 12px;border-radius:8px}.badge{display:inline-block}.error{background:#fff0ef;color:#9b2420;padding:12px;border-radius:8px;overflow-wrap:anywhere}.actions{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:18px 0}.actions form{margin:0}button,.actions a{font:inherit;padding:10px 16px;border:0;border-radius:8px;cursor:pointer;text-decoration:none}.actions a,button{background:#e4eaf3;color:#1c2737}.primary{background:#1259be;color:white}.delete{background:#fff0ef;color:#9b2420}fieldset{min-width:0;margin:0;border:1px solid #d7e0ec;border-radius:10px;padding:16px}legend{font-weight:600;padding:0 6px}.rule{margin:20px 0}.fields{display:grid;grid-template-columns:1fr 1fr;gap:16px}.fields label{font-weight:600;min-width:0}input[type=text],select{font:16px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;width:100%;padding:12px;margin-top:6px;border:1px solid #a7b5c8;border-radius:7px;background:white;color:#1c2737}input[type=text]{font-family:ui-monospace,SFMono-Regular,monospace}.check{display:flex;align-items:center;gap:10px;align-self:end;min-height:48px}.check input{width:20px;height:20px}.rule .actions{margin-bottom:0}button:disabled,fieldset:disabled{opacity:.55}button:disabled{cursor:default}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #568ae3;outline-offset:3px}.reset{margin-top:24px}.preset-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}.preset{min-width:0;margin:0}.preset fieldset{height:100%;display:flex;flex-direction:column}.preset legend{max-width:100%;font-size:16px}.preset .note{font-size:14px}.preset-pair{padding:10px;margin:12px 0;background:#f5f7fa;border-radius:6px}.preset-pair code{display:block;font-size:13px;line-height:1.6}.preset-state{align-self:flex-start;font-size:13px;padding:5px 8px;margin:0 0 12px;background:#e0f4e8;color:#176238;border-radius:6px}.preset button{width:100%;margin-top:auto}@media(max-width:600px){body{padding:0 10px;margin:16px auto}section{padding:14px}fieldset{padding:12px}.fields,.preset-grid{grid-template-columns:1fr}.actions{gap:8px}button{padding:10px 12px}}</style>",
    "<h1>Quản Lý SKU Google One (Ultra 20TB / 30TB)</h1>",
    "<p class=badge>Script cục bộ đang hoạt động · " + VERSION + "</p>",
    "<p><strong>Chế độ đang chạy: " + modeName(report.configuredMode) + "</strong></p>",
    "<nav class=actions aria-label=Thao_tác_báo_cáo><form method=get action=\"" + ROOT + "\"><button type=submit name=format value=json>Xuất JSON</button></form><a href=\"" + ROOT + "\">Làm mới trang</a></nav>",
    "<p class=note>Trang này được tạo trực tiếp bởi Shadowrocket trên thiết bị của bạn tại địa chỉ one.google.com/g1-sku-report; mọi cấu hình ánh xạ và lịch sử quét được lưu cục bộ trên máy.</p>",
    "<p class=note>Chỉ cần bật duy nhất 1 module G1 ACQ: chọn mẫu preset bên dưới rồi mở lại trang gói trong Google App (icon G) hoặc Gemini để kiểm tra bảng giá App Store.</p>",
    actionError ? "<p class=error role=alert>" + escape(actionError) + "</p>" : "",
    noticeText ? "<p class=success role=status>" + escape(noticeText) + "</p>" : "",
    clearMessage ? "<p>" + escape(clearMessage) + "</p>" : "",
    storageAvailable ? "" : "<p>Bộ nhớ cục bộ chưa sẵn sàng; trang này chưa đọc được bản ghi thu thập.</p>",
    presetTemplates(), mappingEditor(),
    "<section><h2>Nhật Ký Quét Phản Hồi</h2>",
    "<p>Phiên bản script thu thập: <code>" + escape(report.scan.version || "Chưa có bản ghi") + "</code><br>Chế độ thu thập: " + modeName(report.scan.mode) + "<br>" + scanVersionStatus + "</p>",
    "<p>Số phản hồi văn bản đã quét: " + report.scan.scannedResponses + " · Phản hồi không phải văn bản: " + report.scan.nonTextResponses +
      " · Phản hồi có chứa mã SKU: " + report.scan.matchedResponses + " · Tổng số mã SKU thu thập: " + report.scan.skus.length + "</p>",
    "<p>Lần lưu gần nhất (UTC): " + escape(report.scan.updatedAt || "Chưa có") + "</p>",
    latestScan ? "<p><strong>Phản hồi gần nhất: " + scanStatuses[latestScan.status] + "</strong><br>Nhận diện " +
      latestScan.candidateCount + " mã khác nhau, mới thêm " + latestScan.addedCount + " mã, vượt giới hạn " + latestScan.omittedCount + " mã.</p>" : "",
    "<p class=note>Danh sách cộng dồn theo từng mã SKU duy nhất; khi gặp lại mã đã có sẽ tăng số lần xuất hiện.</p>",
    "<h3>10 Phản Hồi Gần Nhất</h3>", recentTable(report.scan.recentResponses),
    "<p class=note>Nếu số lượng tăng lên sau khi mở trang gói trong Google App nghĩa là Shadowrocket đã bắt và giải mã HTTPS thành công.</p></section>",
    "<section><h2>Lần Thực Thi Ghi Đè SKU Gần Nhất (/ai?)</h2>",
    "<p>SKU đích cho tiền tố 2TB hiện tại: <code>" + escape(report.configuredTarget || "Chưa bật quy tắc tiền tố 2TB chung") + "</code></p>",
    "<p class=note>Bảng dưới đây hiển thị chính xác mã SKU gốc nào đã được thay bằng mã SKU đích nào trong lần mở trang /ai gần nhất.</p>",
    "<p>Phiên bản: " + escape(report.test.version || "Chưa có") + "<br>Chế độ ánh xạ: " + modeName(report.test.mode) + "<br>Trạng thái: " + escape(status) + " · Tổng số lần thay thế: " + report.test.hitCount + " · Trong đó 2TB: " + report.test.annualHitCount + "</p>",
    "<p>Tiền tố nguồn 2TB: <code>g1.ios.2tb.</code><br>SKU đích 2TB của lần đó: <code>" + escape(report.test.target || "Chưa có bản ghi") + "</code><br>" + configuredOffers + "<br>Thời gian lưu cấu hình được dùng (UTC): " + escape(report.test.mappingUpdatedAt || "Mặc định tích hợp sẵn") + "<br>Thời gian thực thi (UTC): " + escape(report.test.updatedAt || "Chưa có") + "</p>",
    "<p class=note>Đây là kết quả thay mã của script; còn mã SKU đó có được App Store nhận diện hay không, giá và chu kỳ thế nào sẽ hiển thị trên bảng thanh toán Apple StoreKit.</p>",
    table(report.test.matchedFrom, false), "</section>",
    "<section><h2>Danh Sách Mã SKU Gốc Thu Thập Được Khi Duyệt Trang</h2>",
    "<p>Tổng số mã SKU: " + report.scan.skus.length + " (đã gộp trùng lặp và đếm số lần xuất hiện).</p>",
    "<p class=note>Các mã này được trích xuất từ phản hồi gốc của Google trước khi ghi đè. Bấm “Dùng làm SKU gốc” để đưa nhanh vào khung thêm quy tắc.</p>",
    report.scan.truncated ? "<p>Đã đạt giới hạn 300 mã; hãy xóa bản ghi để quét lại từ đầu.</p>" : "",
    table(report.scan.skus, true),
    "<p>Thời gian cập nhật (UTC): " + escape(report.scan.updatedAt || "Chưa có") + "</p></section>",
    "<form method=get action=\"" + ROOT + "\"><button name=clear value=1>Xóa lịch sử quét và thực thi</button></form>",
    "<p class=note>Xóa lịch sử sẽ giữ nguyên cấu hình ánh xạ đang lưu.</p></html>"
  ].join("");
  $done({ response: { status: responseStatus, headers: headers, body: html } });
})();
