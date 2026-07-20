import I18n from "/i18n.js";

// ─── i18n ─────────────────────────────────────────────────────────────────────
let t = (key) => key;

// ─── State ────────────────────────────────────────────────────────────────────
let users = [];
let selectedIdx = null;
let mode = "create";
let saving = false;
let deleting = false;
let selectedFactory = "";
let selectedDepartment = "";
let deptMap = {};

// ─── Apply i18n labels ────────────────────────────────────────────────────────
async function applyLang() {
  // Panel / table headers
  setText("th-user-mgmt", t("admin.userManagement.title"));
  setText("th-editor-title", t("admin.userManagement.editor.title"));
  setText("th-user-stt", t("admin.userManagement.table.stt"));
  setText("th-user-username", t("admin.userManagement.table.username"));
  setText("th-user-role", t("admin.userManagement.table.role"));
  setText("th-user-factory", t("admin.userManagement.table.factory"));
  setText("th-user-department", t("admin.userManagement.table.department"));
  setText("th-user-status", t("admin.userManagement.table.status"));

  // Editor field labels
  setText("lbl-username", t("admin.userManagement.table.username"));
  setText("lbl-password", t("admin.userManagement.table.password"));
  setText("lbl-role", t("admin.userManagement.table.role"));
  setText("lbl-status", t("admin.userManagement.table.status"));
  setText("lbl-factory", t("admin.userManagement.table.factory"));
  setText("lbl-department", t("admin.userManagement.table.department"));

  // Buttons
  setText("lbl-btn-create", t("admin.userManagement.buttons.add"));
  setText("lbl-btn-save", t("admin.modelSpec.buttons.save"));
  setText("lbl-btn-delete", t("admin.userManagement.buttons.delete"));

  // Inline field error messages
  setText("err-username", t("admin.userManagement.alerts.usernameRequired"));
  setText("err-password", t("admin.userManagement.alerts.passwordRequired"));
  setText("err-factory", t("admin.userManagement.alerts.factoryRequired"));
  setText(
    "err-department",
    t("admin.userManagement.alerts.departmentRequired"),
  );



}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el && text) el.textContent = text;
}

// ─── User profile ─────────────────────────────────────────────────────────────
async function getUserProfile() {
  const res = await fetch("/exportmanagement/profile", {
    method: "GET",
    credentials: "include",
  });
  return (await res.json()).user;
}

// ─── Fetch departments ────────────────────────────────────────────────────────
async function fetchDepartments() {
  try {
    const res = await fetch("/exportmanagement/departments", {
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const arr = await res.json();
      deptMap = { __all__: arr };
    }
  } catch (_) {
    deptMap = {};
  }
}

// ─── Fetch & render users ─────────────────────────────────────────────────────
async function fetchAndRenderUsers() {
  const tbody = document.getElementById("userTableBody");
  tbody.innerHTML = `<tr><td colspan="6" class="td-empty">${t("admin.userManagement.table.loading") || "Loading…"}</td></tr>`;
  const res = await fetch("/exportmanagement/users", {
    headers: { "Content-Type": "application/json" },
  });
  users = await res.json();
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById("userTableBody");
  tbody.innerHTML = "";

  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="td-empty">${t("admin.userManagement.table.noData") || "No users found"}</td></tr>`;
    return;
  }

  users.forEach((u, i) => {
    const roleCls =
      { ADMIN: "badge-admin", MANAGER: "badge-manager", USER: "badge-user" }[
        u.role?.toUpperCase()
      ] ?? "badge-user";
    const statusCls =
      u.status?.toUpperCase() === "INACTIVE"
        ? "badge-inactive"
        : "badge-active";
    const statusLabel = u.status ?? "ACTIVE";

    const depts = Array.isArray(u.departments)
      ? u.departments
      : u.department
        ? [u.department]
        : [];
    let deptHtml = "";
    if (!depts.length) {
      deptHtml = `<span style="color:#475569">—</span>`;
    } else if (depts[0] === "ALL" || depts.every((d) => d === "ALL")) {
      deptHtml = `<span class="badge badge-all">ALL</span>`;
    } else {
      deptHtml = `<div class="chips-cell">${depts.map((d) => `<span class="badge badge-chip">${d}</span>`).join("")}</div>`;
    }

    const factories = Array.isArray(u.factories)
      ? u.factories
      : u.factory
        ? [u.factory]
        : [];
    let factHtml = "";
    if (!factories.length) {
      factHtml = `<span style="color:#475569">—</span>`;
    } else if (factories[0] === "ALL") {
      factHtml = `<span class="">ALL</span>`;
    } else {
      factHtml = factories.map((f) => `<span class="">${f}</span>`).join(" ");
    }

    const row = document.createElement("tr");
    row.dataset.idx = i;
    if (selectedIdx === i) row.classList.add("active");

    row.innerHTML = `
      <td class="stt">${String(i + 1).padStart(2, "0")}</td>
      <td style="text-align:left;padding-left:20px;font-weight:600">${u.user_name ?? ""}</td>
      <td><span class="badge ${roleCls}">${u.role ?? ""}</span></td>
      <td>${factHtml}</td>
      <td>${deptHtml}</td>
      <td><span class="badge ${statusCls}">${statusLabel}</span></td>
    `;

    row.addEventListener("click", () => handleSelectRow(i));
    tbody.appendChild(row);
  });
}

// ─── Select row → fill editor ─────────────────────────────────────────────────
function handleSelectRow(idx) {
  selectedIdx = idx;
  mode = "edit";

  document
    .querySelectorAll("#userTableBody tr")
    .forEach((r, i) => r.classList.toggle("active", i === idx));

  const u = users[idx];

  setVal("input-username", u.user_name ?? "");
  setVal("input-password", "");

  const pwInput = document.getElementById("input-password");
  pwInput.placeholder = t("admin.userManagement.form.passwordEditPlaceholder");
  pwInput.dataset.editMode = "1";
  document.getElementById("req-password").style.display = "none";

  setVal("input-role", u.role ?? "USER");
  setVal(
    "input-status",
    u.status?.toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE",
  );

  const factories = Array.isArray(u.factories)
    ? u.factories
    : u.factory
      ? [u.factory]
      : [];
  setComboFactory(factories[0] ?? "");

  const depts = Array.isArray(u.departments)
    ? u.departments
    : u.department
      ? [u.department]
      : [];
  const dept = depts[0] ?? "";
  setCombo("dept", dept, dept === "ALL" ? { isAll: true } : { label: dept });
  selectedDepartment = dept;

  clearErrors();
  syncButtons();
}

// ─── Reset editor ─────────────────────────────────────────────────────────────
function resetEditor() {
  selectedIdx = null;
  mode = "create";

  setVal("input-username", "");
  setVal("input-password", "");

  const pwInput = document.getElementById("input-password");
  pwInput.placeholder = t("admin.userManagement.form.passwordPlaceholder");
  delete pwInput.dataset.editMode;
  document.getElementById("req-password").style.display = "";

  setVal("input-role", "USER");
  setVal("input-status", "ACTIVE");

  setComboFactory("");
  setCombo("dept", "", { label: "" });
  selectedDepartment = "";

  document
    .querySelectorAll("#userTableBody tr")
    .forEach((r) => r.classList.remove("active"));
  clearErrors();
  syncButtons();
}

// ─── Custom combo ─────────────────────────────────────────────────────────────
function initCombo(id, onSelect) {
  const trigger = document.getElementById(`${id}-trigger`);
  const list = document.getElementById(`${id}-list`);

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = list.classList.contains("show");
    closeAllCombos();
    if (!open) {
      list.classList.add("show");
      trigger.classList.add("open");
    }
  });

  list.addEventListener("click", (e) => {
    const opt = e.target.closest(".combo-option");
    if (!opt) return;
    onSelect(opt.dataset.value);
    list.classList.remove("show");
    trigger.classList.remove("open");
  });
}

function closeAllCombos() {
  document
    .querySelectorAll(".combo-list")
    .forEach((l) => l.classList.remove("show"));
  document
    .querySelectorAll(".combo-trigger")
    .forEach((t) => t.classList.remove("open"));
}

document.addEventListener("click", closeAllCombos);

function setCombo(id, value, opts = {}) {
  const display = document.getElementById(`${id}-display`);
  const list = document.getElementById(`${id}-list`);
  const placeholder =
    t("admin.userManagement.form.selectPlaceholder") || "— Select —";

  list.querySelectorAll(".combo-option").forEach((opt) => {
    const sel = opt.dataset.value === value;
    opt.classList.toggle("selected", sel);
    opt.querySelector(".check").textContent = sel ? "✓" : "";
  });

  if (opts.isAll) {
    display.innerHTML = `<span class="pill-all">ALL</span>`;
    display.classList.remove("placeholder");
  } else if (value) {
    display.textContent = value;
    display.classList.remove("placeholder");
  } else {
    display.textContent = placeholder;
    display.classList.add("placeholder");
  }
}

function setComboFactory(value) {
  selectedFactory = value;
  const display = document.getElementById("factory-display");
  const list = document.getElementById("factory-list");
  const placeholder =
    t("admin.userManagement.form.selectPlaceholder") || "— Select —";

  list.querySelectorAll(".combo-option").forEach((opt) => {
    const sel = opt.dataset.value === value;
    opt.classList.toggle("selected", sel);
    opt.querySelector(".check").textContent = sel ? "✓" : "";
  });

  if (value === "ALL") {
    display.innerHTML = `<span class="pill-all">ALL</span>`;
    display.classList.remove("placeholder");
  } else if (value) {
    display.textContent = value;
    display.classList.remove("placeholder");
  } else {
    display.textContent = placeholder;
    display.classList.add("placeholder");
  }

  rebuildDeptList(value);
  selectedDepartment = "";
  setCombo("dept", "", { label: "" });
}

function rebuildDeptList(factory) {
  const list = document.getElementById("dept-list");
  list.innerHTML = "";

  const depts = factory ? (deptMap.__all__ ?? []) : [];

  if (!depts.length) {
    const empty = document.createElement("div");
    empty.style.cssText =
      "color:#475569;font-size:12px;text-align:center;padding:8px";
    empty.textContent = factory
      ? t("admin.userManagement.table.noDepartments") || "No departments found"
      : t("admin.userManagement.form.selectFactoryFirst") ||
        "Select a factory first";
    list.appendChild(empty);
    return;
  }

  depts.forEach((d) => {
    const opt = document.createElement("button");
    opt.type = "button";
    opt.className = d === "ALL" ? "combo-option opt-all" : "combo-option";
    opt.dataset.value = d;
    opt.innerHTML =
      d === "ALL"
        ? `<span class="check"></span><span class="pill-all">ALL</span>`
        : `<span class="check"></span>${d}`;
    list.appendChild(opt);
  });
}

// ─── Sync buttons ─────────────────────────────────────────────────────────────
function syncButtons() {
  const noSel = selectedIdx === null;
  document.getElementById("btn-save-user").disabled = noSel || saving;
  document.getElementById("btn-delete-user").disabled = noSel || deleting;
}

// ─── Add user ─────────────────────────────────────────────────────────────────
async function handleAddUser() {
  const username = getVal("input-username");
  const password = getVal("input-password");
  const role = getVal("input-role");
  const status = getVal("input-status");
  const factory = selectedFactory;
  const department = selectedDepartment;

  clearErrors();
  let hasErr = false;
  if (!username) {
    showFErr("err-username");
    hasErr = true;
  }
  if (!password) {
    showFErr("err-password");
    hasErr = true;
  }
  if (!factory) {
    showFErr("err-factory");
    hasErr = true;
  }
  if (!department) {
    showFErr("err-department");
    hasErr = true;
  }
  if (hasErr) return;

  setSaving(true);
  try {
    const res = await fetch("/exportmanagement/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_name: username,
        password,
        role,
        status,
        factory,
        department,
      }),
    });
    if (res.ok) {
      alert(t("admin.userManagement.alerts.addSuccess"));
      await fetchAndRenderUsers();
      resetEditor();
    } else {
      const d = await res.json();
      alert(d.message || t("admin.userManagement.alerts.addFailed"));
    }
  } catch (e) {
    alert(t("admin.userManagement.alerts.connectionError") + e.message);
  } finally {
    setSaving(false);
  }
}

// ─── Save changes ─────────────────────────────────────────────────────────────
async function handleSaveUser() {
  if (selectedIdx === null) return;

  const password = getVal("input-password");
  const role = getVal("input-role");
  const status = getVal("input-status");
  const factory = selectedFactory;
  const department = selectedDepartment;
  const username = getVal("input-username");
  const id = users[selectedIdx].id;

  clearErrors();
  let hasErr = false;
  if (!factory) {
    showFErr("err-factory");
    hasErr = true;
  }
  if (!department) {
    showFErr("err-department");
    hasErr = true;
  }
  if (hasErr) return;

  setSaving(true);
  try {
    const body = { user_name: username, role, status, factory, department };
    if (password) body.password = password;

    const res = await fetch(`/exportmanagement/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      alert(t("admin.userManagement.alerts.updateSuccess"));
      await fetchAndRenderUsers();
      resetEditor();
    } else {
      const d = await res.json();
      alert(d.message || t("admin.userManagement.alerts.updateFailed"));
    }
  } catch (e) {
    alert(t("admin.userManagement.alerts.connectionError") + e.message);
  } finally {
    setSaving(false);
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
async function handleDeleteUser() {
  if (selectedIdx === null) return;
  if (!confirm(t("admin.userManagement.alerts.confirmDelete"))) return;

  const id = users[selectedIdx].id;
  setDeleting(true);
  try {
    const res = await fetch(`/exportmanagement/users/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      alert(t("admin.userManagement.alerts.deleteSuccess"));
      await fetchAndRenderUsers();
      resetEditor();
    } else {
      const d = await res.json();
      alert(d.message || t("admin.userManagement.alerts.deleteFailed"));
    }
  } catch (e) {
    alert(t("admin.userManagement.alerts.connectionError") + e.message);
  } finally {
    setDeleting(false);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getVal = (id) => (document.getElementById(id)?.value ?? "").trim();
const setVal = (id, v) => {
  const el = document.getElementById(id);
  if (el) el.value = v;
};
const showFErr = (id) =>
  document.getElementById(id)?.classList.remove("hidden");

function clearErrors() {
  ["err-username", "err-password", "err-factory", "err-department"].forEach(
    (id) => document.getElementById(id)?.classList.add("hidden"),
  );
  hideBanner();
}
function showBanner(msg) {
  document.getElementById("errorBannerText").textContent = msg;
  document.getElementById("errorBanner").classList.remove("hidden");
}
const hideBanner = () =>
  document.getElementById("errorBanner")?.classList.add("hidden");

function setSaving(v) {
  saving = v;
  document.getElementById("btn-add-user").disabled = v;
  syncButtons();
}
function setDeleting(v) {
  deleting = v;
  syncButtons();
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await I18n.init("en");
  t = (key, p) => I18n.t(key, p);
  await applyLang();

  document
    .getElementById("btn-add-user")
    .addEventListener("click", handleAddUser);
  document
    .getElementById("btn-save-user")
    .addEventListener("click", handleSaveUser);
  document
    .getElementById("btn-delete-user")
    .addEventListener("click", handleDeleteUser);

  initCombo("factory", (val) => {
    setComboFactory(val);
    document.getElementById("err-factory")?.classList.add("hidden");
  });
  initCombo("dept", (val) => {
    selectedDepartment = val;
    setCombo("dept", val, val === "ALL" ? { isAll: true } : { label: val });
    document.getElementById("err-department")?.classList.add("hidden");
  });

  rebuildDeptList("");
  syncButtons();

  try {
    const user = await getUserProfile();
    localStorage.setItem("user", JSON.stringify(user));

    if (user?.role !== "ADMIN") {
      globalThis.window.location.replace("/home");
      return;
    }

    const header = document.querySelector("app-header");
    if (header?.setUser) header.setUser(user);

    await fetchDepartments();
    await fetchAndRenderUsers();
  } catch (err) {
    console.error("Initialization error:", err);
  }
});
