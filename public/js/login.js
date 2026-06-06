import I18n from "/i18n.js";

let t = (key) => key;

function applyLang() {
  document.getElementById("lbl-username").textContent = t("login.username");
  document.getElementById("lbl-password").textContent = t("login.password");
  document.getElementById("lbl-save-password").textContent =
    t("login.savePassword");
  document.getElementById("lbl-submit").textContent = t("login.submit");
}

function initLangSwitcher() {
  const wrap = document.getElementById("langWrap");
  const trigger = document.getElementById("langTrigger");
  const menu = document.getElementById("langMenu");
  const flagEl = document.getElementById("langFlag");
  const labelEl = document.getElementById("langLabel");

  // Sync UI với ngôn ngữ đã lưu
  const saved = localStorage.getItem("lang") || "en";
  const savedOption = menu.querySelector(`[data-lang="${saved}"]`);
  if (savedOption) {
    menu
      .querySelectorAll(".lang-option")
      .forEach((o) => o.classList.remove("active"));
    savedOption.classList.add("active");
    flagEl.textContent = savedOption.dataset.flag;
    labelEl.textContent = savedOption.dataset.label;
  }

  // Toggle dropdown
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    wrap.classList.toggle("open");
  });

  // Đóng khi click ngoài
  document.addEventListener("click", () => wrap.classList.remove("open"));
  menu.addEventListener("click", (e) => e.stopPropagation());

  // Chọn ngôn ngữ
  menu.querySelectorAll(".lang-option").forEach((option) => {
    option.addEventListener("click", async () => {
      const lang = option.dataset.lang;

      flagEl.textContent = option.dataset.flag;
      labelEl.textContent = option.dataset.label;

      menu
        .querySelectorAll(".lang-option")
        .forEach((o) => o.classList.remove("active"));
      option.classList.add("active");
      wrap.classList.remove("open");

      localStorage.setItem("lang", lang);
      await I18n.init(lang);
      t = (key, params) => I18n.t(key, params);
      applyLang();
    });
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const savedLang = localStorage.getItem("lang") || "en";
  await I18n.init(savedLang);
  t = (key, params) => I18n.t(key, params);
  applyLang();
  initLangSwitcher();

  const form = document.querySelector("#loginForm");
  const submitBtn = document.querySelector("#submitBtn");
  const savePassword = document.querySelector("#savePassword");

  const params = new URLSearchParams(window.location.search);
  const msg = params.get("msg");
  if (msg === "no_permission") alert(t("login.noPermission"));
  if (msg === "invalid_token") alert(t("login.invalidToken"));

  async function handleLogin(e) {
    e.preventDefault();
    const username = form.querySelector("input[name='username']").value.trim();
    const password = form.querySelector("input[name='password']").value.trim();

    if (!username || !password) {
      alert(t("login.emptyFields"));
      return;
    }

    try {
      const isSavePass = savePassword.checked;
      const res = await fetch("/exportmanagement/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, isSavePass }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("isSavePass", isSavePass);
        localStorage.setItem("lang", localStorage.getItem("lang") || "en");
        localStorage.setItem(
          "user",
          JSON.stringify({
            username: data.username,
            fullName: data.fullName,
            role: data.role,
            expiredAt: data.expiredAt,
          }),
        );
        globalThis.location.href = "/home";
      } else {
        alert(data.message || t("login.invalidCredentials"));
      }
    } catch (err) {
      alert(t("login.connectionError"));
      console.error(err);
    }
  }

  submitBtn.addEventListener("click", handleLogin);
  form.addEventListener("submit", handleLogin);
});
