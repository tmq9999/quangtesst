/* Google One combined 2TB / 20TB / 30TB mappings for Shadowrocket. */
"use strict";

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
      { id: "default-2tb", match: "exact", from: "g1.ios.2tb.ai.m", to: "g1.2tb.ai.12months_ip_90p", enabled: true },
      { id: "default-20tb", match: "exact", from: "g1.ios.20tb.m.v2", to: "com.google.gemini.2tb.ai.m.3month_ip_99p", enabled: true },
      { id: "default-30tb", match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.ai.ultra.3months_ip_75p.acq", enabled: true }
    ];
  }

  function presets() {
    return [
      {
        id: "pro-1yuan-20tb",
        title: "1. [ĐÃ TEST THÀNH CÔNG] Mở Pro Giảm 99% 3 Tháng Đầu (Chỉ đổi 1 nút Ultra 20TB)",
        description: "Xóa sạch các quy tắc khác, chỉ đổi duy nhất nút Ultra 20TB (g1.ios.20tb.m.v2) -> com.google.gemini.2tb.ai.m.3month_ip_99p (giảm 99% 3 tháng đầu). Cách bấm: vào trang nâng cấp bấm nút Ultra 20TB.",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "com.google.gemini.2tb.ai.m.3month_ip_99p", enabled: true }
        ]
      },
      {
        id: "pro-1yuan-2tb",
        title: "2. [ĐÃ TEST THÀNH CÔNG] Mở Pro Giảm 99% 3 Tháng Đầu (Chỉ đổi 1 nút Pro 5TB/2TB Tháng)",
        description: "Dùng khi bấm nút Ultra 20TB báo lỗi: chỉ đổi duy nhất nút Pro Tháng (g1.ios.2tb.ai.m) -> com.google.gemini.2tb.ai.m.3month_ip_99p (không dùng prefix để tránh 4 nút 2TB trùng ID gây lỗi!). Cách bấm: chọn Theo tháng -> bấm nút Pro 5TB/2TB.",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.2tb.ai.m", to: "com.google.gemini.2tb.ai.m.3month_ip_99p", enabled: true }
        ]
      },
      {
        id: "pro-12months-90p",
        title: "3. [GÓI 5TB GIẢM 90%] Google AI Pro (5 TB) · 12 Tháng 90p (Chỉ đổi 1 nút Pro Tháng, không xung đột)",
        description: "Chỉ đổi duy nhất nút Pro Tháng (g1.ios.2tb.ai.m) -> g1.2tb.ai.12months_ip_90p ($1.99/tháng × 12 tháng), tránh lỗi 4 nút 2TB dùng chung 1 mã đích. Cách bấm: chọn Theo tháng -> bấm nút Pro 5TB/2TB.",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.2tb.ai.m", to: "g1.2tb.ai.12months_ip_90p", enabled: true }
        ]
      },
      {
        id: "tr-ultra-legacy",
        title: "4. [ULTRA 20TB & 30TB MÃ GỐC] g1.ios.20tb.m & g1.ios.30tb.m (Không cần ĐK .acq)",
        description: "Bỏ đuôi .v2 và .ai.pro, gọi mã gốc 20TB (g1.ios.20tb.m - 1989.99 TRY) và 30TB (g1.ios.30tb.m - 2949.99 TRY). Mỗi nút 1 mã riêng biệt, không xung đột.",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.ios.20tb.m", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.ios.30tb.m", enabled: true }
        ]
      },
      {
        id: "ultra-75p",
        title: "5. [ULTRA 20TB & 30TB GIẢM 75%] 3 Tháng 75p.acq (1-đối-1 không xung đột)",
        description: "Xóa sạch rule 2TB gây nhiễu, chỉ đổi 20TB -> g1.20tb.3months_ip_75p.acq và 30TB -> g1.ai.ultra.3months_ip_75p.acq (giảm 75% 3 tháng đầu).",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.20tb.3months_ip_75p.acq", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.ai.ultra.3months_ip_75p.acq", enabled: true }
        ]
      },
      {
        id: "ultra-1m-free",
        title: "6. [ULTRA 20TB & 30TB FREE 1 THÁNG] 1month_eft.acq (1-đối-1 không xung đột)",
        description: "Xóa sạch rule 2TB gây nhiễu, chỉ đổi 20TB -> g1.20tb.1month_eft.acq và 30TB -> g1.ai.ultra.1month_eft.acq (1 tháng 0đ).",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.20tb.1month_eft.acq", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.ai.ultra.1month_eft.acq", enabled: true }
        ]
      },
      {
        id: "pro-5tb-free-4slots",
        title: "7. [GÓI 5TB FREE 18M/15M/12M/6M] Mỗi nút gắn 1 mã Free Trial riêng (Không trùng ID)",
        description: "Gắn 4 mã Free Trial 5TB vào 4 nút khác nhau để không bị trùng ID: Nút Pro Tháng (g1.ios.2tb.ai.m) -> 18 tháng 0đ; Nút Pro Năm (g1.ios.2tb.ai.a) -> 12 tháng 0đ; Nút Ultra 20TB -> 15 tháng 0đ; Nút Ultra 30TB -> 6 tháng 0đ.",
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
  var VERSION = "g1-acq-v7.11-mappings";
  var SOURCE_PREFIX = "g1.ios.2tb.";
  var TEST_KEY = "g1.pro.annual.test.v1";
  var SCAN_KEY = "g1.sku.scan.v1";
  var SCAN_LIMIT = 300;
  var RECENT_LIMIT = 10;
  var MAX_EVENT_COUNT = 9007199254740991;
  var url = typeof $request === "object" && $request ? $request.url : "";

  if (typeof url !== "string" || !/^https:\/\/one\.google\.com\//.test(url) ||
      /^https:\/\/one\.google\.com\/g1-sku-report\/?(?:\?|$)/.test(url)) {
    $done({});
    return;
  }

  var mappingEngine = createG1MappingConfig(typeof $persistentStore === "undefined" ? null : $persistentStore);
  var mappingConfig = mappingEngine.read();
  var MODE = mappingConfig.mode;
  var configError = mappingConfig.status === "invalid" || mappingConfig.status === "unavailable";
  console.log("[g1-acq] " + VERSION + " mappingStatus=" + mappingConfig.status +
    " mappingRevision=" + mappingConfig.revision + " mode=" + MODE);

  var body = typeof $response === "object" && $response ? $response.body : undefined;
  try {
    collectOriginalSkus(body);
  } catch (error) {
    console.log("[g1-acq] SKU collection unavailable");
  }

  if (!/^https:\/\/one\.google\.com\/(?:u\/\d+\/)?(?:ai|plans|subscribe|upsell|about\/plans)(?:[/?#]|$)/.test(url)) {
    $done({});
    return;
  }

  var mappings = Object.create(null);
  var hits = 0;
  var annualHits = 0;
  var out = body;

  if (typeof body === "string" && !configError) {
    // Resolve complete tokens once; replacement targets are never matched again.
    out = body.replace(
      /(^|[^A-Za-z0-9._@%-])((?:g1\.|com\.google\.(?:one|gemini)\.)[A-Za-z0-9._-]+)(?=$|[^A-Za-z0-9._-])/g,
      function (match, before, id) {
        var rule = mappingEngine.resolve(id, mappingConfig);
        if (!rule) return match;
        var isAnnual = id.indexOf(SOURCE_PREFIX) === 0 && id.length > SOURCE_PREFIX.length;
        if (!mappings[id]) mappings[id] = { id: id, to: rule.to, count: 0, fallback: false };
        mappings[id].count += 1;
        hits += 1;
        if (isAnnual) annualHits += 1;
        return before + rule.to;
      }
    );
  }

  var sources = Object.keys(mappings).sort().map(function (id) {
    return mappings[id];
  });
  var record = {
    schemaVersion: 1,
    version: VERSION,
    mode: MODE,
    updatedAt: new Date().toISOString(),
    mappingRevision: mappingConfig.revision,
    mappingUpdatedAt: mappingConfig.updatedAt,
    mappingStatus: mappingConfig.status,
    sourcePrefix: SOURCE_PREFIX,
    target: mappingConfig.target,
    targetOrigin: mappingConfig.targetOrigin,
    hitCount: hits,
    // Legacy field name: counts 2TB/Pro rewrites, not the billing interval.
    annualHitCount: annualHits,
    matchedFrom: sources,
    status: configError ? "config-error" : typeof body !== "string" ? "non-text" : hits ? "rewritten" : "no-match"
  };

  try {
    if (typeof $persistentStore !== "undefined" &&
        typeof $persistentStore.write === "function") {
      if (!$persistentStore.write(JSON.stringify(record), TEST_KEY)) {
        console.log("[g1-acq] local record write failed");
      }
    }
  } catch (error) {
    console.log("[g1-acq] local record unavailable");
  }

  console.log("[g1-acq] " + VERSION + " hits=" + hits + " annualHits=" + annualHits + " mode=" + MODE);
  sources.forEach(function (source) {
    console.log("[g1-acq] " + source.id + " -> " + source.to + " x" + source.count);
  });
  $done(hits ? { body: out } : {});

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
    var validId = /^(?:g1\.|com\.google\.(?:one|gemini)\.)[A-Za-z0-9._-]{1,160}$/;
    var oldRows = Array.isArray(saved.skus) ? saved.skus : [];
    oldRows.slice(0, SCAN_LIMIT).forEach(function (row) {
      if (!row || typeof row.id !== "string" || !validId.test(row.id) || byId[row.id]) return;
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
    if (isText) {
      // Decode escaped dots on a discovery copy before rewriting the original body.
      var text = originalBody.replace(/\\u002e|\\x2e|&#0*46;|&#x0*2e;|&period;/gi, ".");
      var token = /(^|[^A-Za-z0-9._@%-])((?:g1\.|com\.google\.(?:one|gemini)\.)[A-Za-z0-9._-]+)(?=$|[^A-Za-z0-9._-])/g;
      var match;
      while ((match = token.exec(text)) !== null) {
        var id = match[2];
        if (!validId.test(id)) continue;
        found[id] = (found[id] || 0) + 1;
        hitCount += 1;
        if (!byId[id]) {
          if (ids.length >= SCAN_LIMIT) {
            truncated = true;
            if (found[id] === 1) omittedCount += 1;
            continue;
          }
          byId[id] = { id: id, count: 0, lastSeen: now };
          ids.push(id);
          addedCount += 1;
        }
        byId[id].count += 1;
        byId[id].lastSeen = now;
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

    console.log("[g1-acq] " + VERSION + " status=" + status + " addedCount=" + addedCount +
      " candidates=" + candidateCount + " omittedCount=" + omittedCount +
      " occurrences=" + hitCount + " saved=" + (stored ? "yes" : "no") + " mode=" + MODE);
    Object.keys(found).sort().slice(0, SCAN_LIMIT).forEach(function (id) {
      console.log("[g1-acq] " + id + " x" + found[id]);
    });
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
