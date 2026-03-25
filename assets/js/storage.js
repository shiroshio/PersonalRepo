const KEY_CATEGORIES = "report_app_categories_v1";
const KEY_REPORTS = "report_app_reports_v1";
const KEY_SETTINGS = "report_app_settings_v1";

export function loadData() {
  return {
    categories: parse(KEY_CATEGORIES, []),
    reports: parse(KEY_REPORTS, []),
    settings: parse(KEY_SETTINGS, { schemaVersion: 1 })
  };
}

export function saveData(data) {
  localStorage.setItem(KEY_CATEGORIES, JSON.stringify(data.categories));
  localStorage.setItem(KEY_REPORTS, JSON.stringify(data.reports));
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(data.settings));
}

export function exportJson(data) {
  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    categories: data.categories,
    reports: data.reports
  };
  return JSON.stringify(payload, null, 2);
}

export function importJson(rawText) {
  const parsed = JSON.parse(rawText);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("잘못된 JSON 형식입니다.");
  }

  if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.reports)) {
    throw new Error("categories/reports 배열이 필요합니다.");
  }

  return {
    categories: parsed.categories,
    reports: parsed.reports,
    settings: { schemaVersion: Number(parsed.schemaVersion || 1) }
  };
}

function parse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
