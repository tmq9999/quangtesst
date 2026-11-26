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
        id: "tr-ultra-legacy",
        title: "1. [CHẮC CHẮN LÊN BẢNG GIÁ] Ultra 20TB & 30TB Mã Gốc (g1.ios.20tb.m / 30tb.m)",
        description: "Bản v7.12.0 mới nhất: bỏ đuôi .v2 và .ai.pro, gọi trực tiếp mã gốc g1.ios.20tb.m (1989.99 TRY) và g1.ios.30tb.m (2949.99 TRY). Không phải mã .acq nên không bị Google chặn điều kiện tài khoản mới.",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.ios.20tb.m", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.ios.30tb.m", enabled: true }
        ]
      },
      {
        id: "pro-1yuan-20tb",
        title: "2. [CHẮC CHẮN LÊN BẢNG GIÁ] Giảm 99% 3 Tháng Đầu (Bấm từ nút Ultra 20TB)",
        description: "Xóa toàn bộ quy tắc gây nhiễu, chỉ đổi riêng nút Ultra 20TB (g1.ios.20tb.m.v2) sang com.google.gemini.2tb.ai.m.3month_ip_99p (giảm 99% 3 tháng đầu, nhận gói AI Pro 2TB).",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "com.google.gemini.2tb.ai.m.3month_ip_99p", enabled: true }
        ]
      },
      {
        id: "pro-1yuan-2tb",
        title: "3. [CHẮC CHẮN LÊN BẢNG GIÁ] Giảm 99% 3 Tháng Đầu (Bấm từ nút Pro 2TB/5TB - v7.12.0)",
        description: "Dùng khi bấm nút Ultra 20TB báo giao dịch chưa hoàn tất: đổi trực tiếp gói Pro (g1.ios.2tb.) sang com.google.gemini.2tb.ai.m.3month_ip_99p. Áp dụng xong mở tab gói Pro bấm đăng ký.",
        replaceAll: true,
        rules: [
          { match: "prefix", from: SOURCE_PREFIX, to: "com.google.gemini.2tb.ai.m.3month_ip_99p", enabled: true }
        ]
      },
      {
        id: "pro-5tb-18m-12m-free",
        title: "4. [GÓI 5TB FREE] Google AI Pro (5 TB) · 18 Tháng & 12 Tháng 0đ (eft)",
        description: "Trong hệ thống Google One, mã g1.2tb.ai.* chính là gói Google AI Pro (5 TB). Nút 20TB & 5TB đổi sang 18 tháng 0đ (g1.2tb.ai.18months_eft), nút Pro 2TB đổi sang 12 tháng 0đ (g1.2tb.ai.12months_eft).",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.2tb.ai.18months_eft", enabled: true },
          { match: "prefix", from: "g1.ios.5tb.", to: "g1.2tb.ai.18months_eft", enabled: true },
          { match: "prefix", from: SOURCE_PREFIX, to: "g1.2tb.ai.12months_eft", enabled: true }
        ]
      },
      {
        id: "pro-5tb-6m-3m-free",
        title: "5. [GÓI 5TB FREE] Google AI Pro (5 TB) · 6 Tháng & 3 Tháng 0đ (eft)",
        description: "Nút 20TB & 5TB đổi sang 6 tháng 0đ (g1.2tb.ai.6months_eft), nút Pro 2TB đổi sang 3 tháng 0đ (g1.2tb.ai.3months_eft), nút 30TB đổi sang g1.2tb.ai.subs_variant.",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.2tb.ai.6months_eft", enabled: true },
          { match: "prefix", from: "g1.ios.5tb.", to: "g1.2tb.ai.6months_eft", enabled: true },
          { match: "prefix", from: SOURCE_PREFIX, to: "g1.2tb.ai.3months_eft", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.2tb.ai.subs_variant", enabled: true }
        ]
      },
      {
        id: "pro-5tb-ios-gemini-free",
        title: "6. [GÓI 5TB/2TB FREE iOS] Thử loạt mã Free Trial đuôi iOS & Gemini (1M / 3M / 12M)",
        description: "Gắn các mã Free Trial định dạng riêng của iOS: 20TB -> com.google.gemini.2tb.ai.m.1month_eft, 30TB -> com.google.gemini.2tb.ai.m.3month_eft, 5TB -> com.google.gemini.2tb.ai.m.12month_eft, 2TB -> g1.ios.2tb.ai.m.1month_eft.",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "com.google.gemini.2tb.ai.m.1month_eft", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "com.google.gemini.2tb.ai.m.3month_eft", enabled: true },
          { match: "prefix", from: "g1.ios.5tb.", to: "com.google.gemini.2tb.ai.m.12month_eft", enabled: true },
          { match: "prefix", from: SOURCE_PREFIX, to: "g1.ios.2tb.ai.m.1month_eft", enabled: true }
        ]
      },
      {
        id: "pro-12months-90p",
        title: "7. [GÓI 5TB GIẢM 90%] Google AI Pro (5 TB) · 12 Tháng 90p ($1.99/tháng × 12)",
        description: "Mã mặc định đã kiểm chứng của crhywun/g1-acq: đổi cả nút 2TB, 5TB và 20TB sang g1.2tb.ai.12months_ip_90p (giảm 90% suốt 12 tháng, tiêu đề gói trên hệ thống là Google AI Pro 5 TB).",
        replaceAll: true,
        rules: [
          { match: "prefix", from: SOURCE_PREFIX, to: "g1.2tb.ai.12months_ip_90p", enabled: true },
          { match: "prefix", from: "g1.ios.5tb.", to: "g1.2tb.ai.12months_ip_90p", enabled: true },
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.2tb.ai.12months_ip_90p", enabled: true }
        ]
      },
      {
        id: "ultra-75p",
        title: "8. Ultra 20TB / 30TB · Giảm 75% 3 Tháng (75p.acq - Chỉ tài khoản đủ ĐK)",
        description: "Mã khuyến mãi Ultra (.acq): 20TB -> g1.20tb.3months_ip_75p.acq, 30TB -> g1.ai.ultra.3months_ip_75p.acq (giảm 75%, trả 25%).",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.20tb.3months_ip_75p.acq", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.ai.ultra.3months_ip_75p.acq", enabled: true }
        ]
      },
      {
        id: "ultra-30tb-75p-both",
        title: "9. Ultra 30TB 75p cho Google App (Gắn cả 2 nút 20TB & 30TB)",
        description: "Ép cả nút 20TB lẫn 30TB sang mã g1.ai.ultra.3months_ip_75p.acq (3 tháng giảm 75%) trong Google App.",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.ai.ultra.3months_ip_75p.acq", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.ai.ultra.3months_ip_75p.acq", enabled: true }
        ]
      },
      {
        id: "ultra-1m-eft",
        title: "10. Ultra 30TB & 20TB · 1 Tháng Free Trial (1month_eft.acq)",
        description: "Thử mã dùng thử 1 tháng 0đ cho Ultra: 20TB -> g1.ai.ultra.1month_eft.acq, 30TB -> g1.20tb.1month_eft.acq.",
        replaceAll: true,
        rules: [
          { match: "exact", from: "g1.ios.20tb.m.v2", to: "g1.ai.ultra.1month_eft.acq", enabled: true },
          { match: "exact", from: "g1.ios.30tb.ai.pro.m", to: "g1.20tb.1month_eft.acq", enabled: true }
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
