import * as XLSX from "./xlsx.js";
import I18n from "/i18n.js";

// ─── Global translation handle ────────────────────────────────────────────────
let t = (key, params) => key;

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const tableBody = document.getElementById("tableScroll");
const searchInput = document.getElementById("searchInput");
const searchClear = document.getElementById("searchClear");
const importBtn = document.getElementById("importBtn");
const exportBtn = document.getElementById("exportBtn");
const excelInput = document.getElementById("excelInput");
const fieldDesc = document.getElementById("fieldDescription");
const fieldVi = document.getElementById("fieldVi");
const fieldEn = document.getElementById("fieldEn");
const fieldKr = document.getElementById("fieldKr");
const errVi = document.getElementById("errVi");
const errEn = document.getElementById("errEn");
const errKr = document.getElementById("errKr");
const errorBanner = document.getElementById("errorBanner");
const errorText = document.getElementById("errorText");
const btnSave = document.getElementById("btnSave");
const toastEl = document.getElementById("toast");

// ─── State ────────────────────────────────────────────────────────────────────
let translations = [];
let selectedId = null;
let touchedFields = { vi: false, en: false, kr: false };
let saving = false;
let importing = false;

// ─── Apply i18n to static DOM ─────────────────────────────────────────────────
function applyLang() {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  document.title = t("translations.title");

  // Toolbar
  set("tl-toolbar-title", t("translations.toolbarTitle"));
  set("tl-import-text", t("translations.importBtn"));
  set("tl-export-text", t("translations.exportBtn"));

  // Search placeholder
  if (searchInput)
    searchInput.placeholder = t("translations.searchPlaceholder");

  // Table header
  set("th-tl-no", t("translations.table.no"));
  set("th-tl-key", t("translations.table.key"));

  // Editor
  set("tl-editor-title", t("translations.editorTitle"));
  set("tl-lbl-description", t("translations.fieldDescription"));

  // Field placeholders
  if (fieldVi) fieldVi.placeholder = t("translations.placeholderVi");
  if (fieldEn) fieldEn.placeholder = t("translations.placeholderEn");
  if (fieldKr) fieldKr.placeholder = t("translations.placeholderKr");

  // Field error texts
  set("tl-err-vi-text", t("translations.fieldErrorEmpty"));
  set("tl-err-en-text", t("translations.fieldErrorEmpty"));
  set("tl-err-kr-text", t("translations.fieldErrorEmpty"));

  // Save button
  set("tl-save-text", t("translations.saveBtn"));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getSelectedItem() {
  return translations.find((item) => item.description === selectedId) ?? null;
}

function getKey(item) {
  return item.description || item.key || "";
}

function applyFilter() {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) return [...translations];
  return translations.filter(
    (item) =>
      (item.vi || "").toLowerCase().includes(q) ||
      (item.en || "").toLowerCase().includes(q) ||
      (item.kr || "").toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q),
  );
}


// ─── API ──────────────────────────────────────────────────────────────────────
async function fetchAll() {
  try {
    const res = await fetch("/exportmanagement/translations", {
      credentials: "include",
    });
    const data = await res.json();
    translations = Array.isArray(data) ? data : (data.data ?? []);
  } catch (err) {
    console.error("fetchAll error:", err);
    alert(t("translations.alerts.fetchError"));
  }
}

async function updateTranslation(payload) {
  const res = await fetch("/exportmanagement/translations/update", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function importTranslations(rows) {
  const res = await fetch("/exportmanagement/translations/import", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderTable() {
  const list = applyFilter();

  if (list.length === 0) {
    const msg = searchInput.value.trim()
      ? t("translations.noResults", { q: searchInput.value.trim() })
      : t("translations.noData");
    tableBody.innerHTML = `<div class="empty-state">${msg}</div>`;
    return;
  }

  tableBody.innerHTML = list
    .map((item, idx) => {
      const isActive = item.description === selectedId ? "active" : "";
      const id = item.id;
      const key = getKey(item);
      const vi = item.vi || "—";
      const en = item.en || "—";
      const kr = item.kr || "—";
      return `
        <div class="tl-row ${isActive}" data-id="${item.description}">
          <div class="col-no">${id}</div>
          <div class="col-key"><span class="cell-text" title="${key}">${key}</span></div>
          <div class="col-lang"><span class="cell-text" title="${vi}">${vi}</span></div>
          <div class="col-lang"><span class="cell-text" title="${en}">${en}</span></div>
          <div class="col-lang"><span class="cell-text" title="${kr}">${kr}</span></div>
        </div>`;
    })
    .join("");
}

// ─── Editor ───────────────────────────────────────────────────────────────────
function selectRow(item) {
  selectedId = item.description;
  touchedFields = { vi: false, en: false, kr: false };
  clearErrors();

  fieldDesc.textContent = getKey(item);
  fieldVi.value = item.vi || "";
  fieldEn.value = item.en || "";
  fieldKr.value = item.kr || "";

  tableBody.querySelectorAll(".tl-row[data-id]").forEach((r) => {
    r.classList.toggle("active", r.dataset.id === selectedId);
  });
}

function resetEditor() {
  selectedId = null;
  touchedFields = { vi: false, en: false, kr: false };
  clearErrors();
  fieldDesc.textContent = "";
  fieldVi.value = "";
  fieldEn.value = "";
  fieldKr.value = "";
}

// ─── Validation ───────────────────────────────────────────────────────────────
function clearErrors() {
  [errVi, errEn, errKr].forEach((e) => e.classList.remove("visible"));
  [fieldVi, fieldEn, fieldKr].forEach((f) => f.classList.remove("has-error"));
  errorBanner.classList.remove("visible");
  errorText.textContent = "";
}

function validateField(key) {
  const elMap = { vi: fieldVi, en: fieldEn, kr: fieldKr };
  const errMap = { vi: errVi, en: errEn, kr: errKr };
  const isEmpty = touchedFields[key] && !elMap[key].value.trim();
  errMap[key].classList.toggle("visible", isEmpty);
  elMap[key].classList.toggle("has-error", isEmpty);
}

function touchAll() {
  touchedFields = { vi: true, en: true, kr: true };
  ["vi", "en", "kr"].forEach(validateField);
}

// ─── Save ─────────────────────────────────────────────────────────────────────
async function handleSave() {
  if (!selectedId || saving) return;
  touchAll();

  if (!fieldVi.value.trim() || !fieldEn.value.trim() || !fieldKr.value.trim()) {
    errorText.textContent = t("translations.alerts.fillRequired");
    errorBanner.classList.add("visible");
    return;
  }

  const item = getSelectedItem();
  if (!item) return;

  saving = true;
  setSaveLoading(true);

  try {
    let eventUser = "Unknown";
    try {
      const raw = localStorage.getItem("user");
      if (raw) eventUser = JSON.parse(raw).username ?? "Unknown";
    } catch (_) {}

    await updateTranslation({
      key: getKey(item),
      vi: fieldVi.value.trim(),
      en: fieldEn.value.trim(),
      kr: fieldKr.value.trim(),
      event_user: eventUser,
    });

    await fetchAll();
    renderTable();
    alert(t("translations.alerts.updateSuccess"));
  } catch (err) {
    console.error("handleSave error:", err);
    alert(t("translations.alerts.updateFailed"));
  } finally {
    saving = false;
    setSaveLoading(false);
  }
}

function setSaveLoading(on) {
  btnSave.disabled = on;
  const saveIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
     <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
     <polyline points="17 21 17 13 7 13 7 21"/>
     <polyline points="7 3 7 8 15 8"/>
   </svg>`;
  btnSave.innerHTML = on
    ? `<div class="spinner"></div> ${t("translations.alerts.savingLoading")}`
    : `${saveIcon} <span id="tl-save-text">${t("translations.saveBtn")}</span>`;
}

// ─── Export Excel ─────────────────────────────────────────────────────────────
function handleExport() {
  if (translations.length === 0) return;

  const wsData = [
    ["ID", "Description", "VI", "EN", "KR"],
    ...translations.map((item) => [
      item.id,
      getKey(item),
      item.vi || "",
      item.en || "",
      item.kr || "",
    ]),
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = [
    { wch: 8 },
    { wch: 45 },
    { wch: 40 },
    { wch: 40 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Translations");

  const date = new Date().toLocaleDateString("en-CA");
  XLSX.writeFile(wb, `translations_${date}.xlsx`);
  alert(t("translations.alerts.exportSuccess"));
}

// ─── Import Excel ─────────────────────────────────────────────────────────────
function handleImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  e.target.value = "";
  if (importing) return;

  importing = true;
  importBtn.disabled = true;
  importBtn.innerHTML = `<div class="spinner"></div> ${t("translations.alerts.importLoading")}`;

  const reader = new FileReader();

  reader.onload = async function (ev) {
    try {
      const data = new Uint8Array(ev.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      if (rawRows.length < 2) {
        alert(t("translations.alerts.noData"));
        return;
      }

      const header = rawRows[0].map((h) => String(h).trim().toLowerCase());
      const required = ["description", "vi", "en", "kr"];
      const missing = required.filter((h) => !header.includes(h));
      if (missing.length > 0) {
        alert(
          t("translations.alerts.missingColumns", { cols: missing.join(", ") }),
        );
        return;
      }

      const idxDesc = header.indexOf("description");
      const idxVi = header.indexOf("vi");
      const idxEn = header.indexOf("en");
      const idxKr = header.indexOf("kr");

      const validRows = [];
      const emptyRows = [];
      const descSeen = new Set();
      const duplicates = [];

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        const desc = String(row[idxDesc] ?? "").trim();
        if (!desc) continue;

        const vi = String(row[idxVi] ?? "").trim();
        const en = String(row[idxEn] ?? "").trim();
        const kr = String(row[idxKr] ?? "").trim();

        const empties = [];
        if (!vi) empties.push("VI");
        if (!en) empties.push("EN");
        if (!kr) empties.push("KR");
        if (empties.length > 0) {
          emptyRows.push(`"${desc}": [${empties.join(", ")}]`);
          continue;
        }

        if (descSeen.has(desc)) {
          duplicates.push(desc);
          continue;
        }
        descSeen.add(desc);
        validRows.push({ description: desc, vi, en, kr });
      }

      if (emptyRows.length > 0) {
        const more =
          emptyRows.length > 8
            ? `\n...${t("translations.alerts.andMore", { count: emptyRows.length - 8 })}`
            : "";
        alert(
          t("translations.alerts.emptyRows", {
            count: emptyRows.length,
            list: emptyRows.slice(0, 8).join("\n") + more,
          }),
        );
        return;
      }
      if (duplicates.length > 0) {
        const more =
          duplicates.length > 8
            ? `\n...${t("translations.alerts.andMore", { count: duplicates.length - 8 })}`
            : "";
        alert(
          t("translations.alerts.duplicateKeys", {
            count: duplicates.length,
            list: duplicates.slice(0, 8).join("\n") + more,
          }),
        );
        return;
      }
      if (validRows.length === 0) {
        alert(t("translations.alerts.noValidData"));
        return;
      }

      const result = await importTranslations(validRows);
      const updated =
        result?.updated ?? result?.data?.updated ?? validRows.length;

      alert(t("translations.alerts.importSuccess", { updated }));
      await fetchAll();
      resetEditor();
      renderTable();
    } catch (err) {
      console.error("Import error:", err);
      alert(t("translations.alerts.importError") + (err.message || err));
    } finally {
      importing = false;
      importBtn.disabled = false;
      importBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" x2="12" y1="3" y2="15"/>
        </svg>
        <span id="tl-import-text">${t("translations.importBtn")}</span>`;
    }
  };

  reader.readAsArrayBuffer(file);
}

// ─── Event listeners ──────────────────────────────────────────────────────────
tableBody.addEventListener("click", (e) => {
  const row = e.target.closest(".tl-row[data-id]");
  if (!row) return;
  const item = translations.find((i) => i.description === row.dataset.id);
  if (item) selectRow(item);
});

searchInput.addEventListener("input", () => {
  searchClear.classList.toggle("visible", searchInput.value.length > 0);
  renderTable();
});

searchClear.addEventListener("click", () => {
  searchInput.value = "";
  searchClear.classList.remove("visible");
  renderTable();
});

importBtn.addEventListener("click", () => excelInput.click());
excelInput.addEventListener("change", handleImport);
exportBtn.addEventListener("click", handleExport);
btnSave.addEventListener("click", handleSave);

["vi", "en", "kr"].forEach((key) => {
  const el = { vi: fieldVi, en: fieldEn, kr: fieldKr }[key];
  el.addEventListener("blur", () => {
    touchedFields[key] = true;
    validateField(key);
  });
  el.addEventListener("input", () => {
    if (touchedFields[key]) validateField(key);
    errorBanner.classList.remove("visible");
  });
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap() {
  // 1. Init i18n
  await I18n.init("en");
  t = (key, params) => I18n.t(key, params);

  // 2. Apply static labels
  applyLang();

  // 3. User profile
  try {
    const res = await fetch("/exportmanagement/profile", {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json();
    document.querySelector("app-header")?.setUser(data.user);
  } catch (err) {
    console.warn("Không lấy được profile:", err);
  }

  // 4. Load & render data
  await fetchAll();
  renderTable();
}

await bootstrap();
