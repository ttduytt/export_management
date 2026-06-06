// ── Helpers ──────────────────────────────────────────────

const setNestedValue = (obj, path, value) => {
  if (!path) return;
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
};

const transformRows = (rows) => {
  const result = { vi: {}, en: {}, kr: {} };
  for (const row of rows) {
    const key = row.description || row.key;
    if (row.vi) setNestedValue(result.vi, key, row.vi);
    if (row.en) setNestedValue(result.en, key, row.en);
    if (row.kr) setNestedValue(result.kr, key, row.kr);
  }
  return result;
};

const deepMerge = (base, override) => {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (
      typeof override[key] === "object" &&
      override[key] !== null &&
      !Array.isArray(override[key])
    ) {
      result[key] = deepMerge(base[key] || {}, override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
};

// ── Core ─────────────────────────────────────────────────

const I18n = {
  _bundles: { en: {}, vi: {}, kr: {} },

  _lang: "en",

  async _loadFile(lang) {
    try {
      const res = await fetch(`/locales/${lang}.json`);
      return await res.json();
    } catch {
      return {};
    }
  },

  async _fetchDB() {
    try {
      const res = await fetch("/exportmanagement/translations");
      const data = await res.json();
      const rows = Array.isArray(data) ? data : data.data || [];
      return transformRows(rows);
    } catch {
      return { vi: {}, en: {}, kr: {} }; 
    }
  },

  async init(defaultLang = "en") {
    this._lang = localStorage.getItem("lang") || defaultLang;

    const [enJson, viJson, krJson] = await Promise.all([
      this._loadFile("en"),
      this._loadFile("vi"),
      this._loadFile("kr"),
    ]);

    const db = await this._fetchDB();

    this._bundles = {
      en: deepMerge(enJson, db.en),
      vi: deepMerge(viJson, db.vi),
      kr: deepMerge(krJson, db.kr),
    };
  },

  setLang(lang) {
    this._lang = lang;
    localStorage.setItem("lang", lang);
  },

  t(path, params = {}) {
    const keys = path.split(".");
    let value = this._bundles[this._lang];

    for (const key of keys) {
      if (value == null) return path;
      value = value[key];
    }

    if (typeof value !== "string") return path;

    return value.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
  },
};

export default I18n;