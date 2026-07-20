import I18n from "/i18n.js";

// ─── Shared SVG icons ─────────────────────────────────────────────────────────
const EYE_SVG = /* html */ `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
  <circle cx="12" cy="12" r="3"/>
</svg>`;

// ─── Change-password modal template ──────────────────────────────────────────
const CP_MODAL_HTML = /* html */ `
<div id="changePassOverlay" class="cp-overlay">
  <div class="cp-modal">
    <button class="cp-close" id="closeChangePass">&times;</button>

    <div class="cp-header">
      <div class="cp-avatar">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      </div>
      <h2 class="cp-header-title"></h2>
    </div>

    <div class="cp-info-grid">
      <div class="cp-info-item">
        <span class="cp-label cp-lbl-username"></span>
        <span class="cp-value" id="cpUsername"></span>
      </div>
      <div class="cp-info-item">
        <span class="cp-label cp-lbl-fullname"></span>
        <span class="cp-value" id="cpFullName"></span>
      </div>
      <div class="cp-info-item">
        <span class="cp-label cp-lbl-role"></span>
        <span class="cp-value"><span class="cp-badge" id="cpRole"></span></span>
      </div>
    </div>

    <hr class="cp-divider">

    <div class="cp-form">
      <h3 class="cp-form-title"></h3>

      <div class="cp-field">
        <label class="cp-lbl-newpass"></label>
        <div class="cp-input-wrap">
          <input type="password" id="cpNewPass"/>
          <button class="cp-eye" data-target="cpNewPass">${EYE_SVG}</button>
        </div>
      </div>

      <div class="cp-field">
        <label class="cp-lbl-confirmpass"></label>
        <div class="cp-input-wrap">
          <input type="password" id="cpConfirmPass"/>
          <button class="cp-eye" data-target="cpConfirmPass">${EYE_SVG}</button>
        </div>
      </div>

      <p class="cp-msg" id="cpMsg"></p>

      <button class="cp-btn" id="cpSubmitBtn">
        <span id="cpBtnText"></span>
        <span id="cpBtnLoader" class="cp-spinner" style="display:none"></span>
      </button>
    </div>
  </div>
</div>`;

// ─── Nav HTML ─────────────────────────────────────────────────────────────────
const NAV_HTML = /* html */ `
<nav>
  <div class="nav-container">
    <div class="logo">
      <span><img style="width:120px" src="/images/logo.png" alt=""/></span>
    </div>
    <ul class="nav-menu" id="navMenu">
      <li class="delivery">
        <a href="/delivery" class="nav-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/></svg>
          Delivery
        </a>
      </li>
      <li class="history">
        <a href="/deliveryHistory" class="nav-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
          History
        </a>
      </li>
      <li class="management">
        <a href="/management" class="nav-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
          Management
        </a>
      </li>
      <li class="translations">
        <a href="/translations" class="nav-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          Language
        </a>
      </li>
      <li class="user">
        <a href="/user" class="nav-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          User
        </a>
      </li>
      <li class="change-password">
        <a href="#" id="openChangePass" class="nav-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Change Password
        </a>
      </li>
    </ul>
    <div class="nav-actions">
          <label class="switch">
            <input id="themeCheckbox" type="checkbox"/>
            <span class="slider">
              <div class="star star_1"></div>
              <div class="star star_2"></div>
              <div class="star star_3"></div>
              <svg viewBox="0 0 16 16" class="cloud_1 cloud">
                <path transform="matrix(.77976 0 0 .78395-299.99-418.63)" fill="#fff"
                  d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485
                    2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182
                    3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395
                    0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322
                    0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925"/>
              </svg>
            </span>
          </label>
          <a href="#" class="nav-link logout-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            </svg>
          </a>
        </div>
  </div>
</nav>`;

// ─── Web Component ────────────────────────────────────────────────────────────
class AppHeader extends HTMLElement {
  get active() {
    return (
      this.getAttribute("active") ||
      sessionStorage.getItem("activeMenu") ||
      "home"
    );
  }

  connectedCallback() {
    // Inject CSS once
    if (!document.getElementById("app-header-styles")) {
      const link = document.createElement("link");
      link.id = "app-header-styles";
      link.rel = "stylesheet";
      link.href = "/stylesheets/Header.css";
      document.head.appendChild(link);
    }

    // Render markup
    this.innerHTML = NAV_HTML + CP_MODAL_HTML;

    this._applyActiveClass();
    this._applyRolePermission();
    this._initTheme();
    this._initNavLinks();
    this._initChangePassword();
    this._initI18n();
  }
  // ── Active nav item ─────────────────────────────────────────────────────────
  _applyActiveClass() {
    const active = this.active;
    this.querySelectorAll(".nav-link").forEach((a) =>
      a.classList.remove("active"),
    );
    const target = this.querySelector(`.${active} .nav-link`);
    if (target) target.classList.add("active");
  }

  // ── Theme ───────────────────────────────────────────────────────────────────
  _initTheme() {
    const checkbox = this.querySelector("#themeCheckbox");
    const saved = localStorage.getItem("theme");

    if (saved === "light") {
      document.body.classList.add("light-theme");
      checkbox.checked = true;
    } else {
      checkbox.checked = false;
    }

    checkbox.addEventListener("change", () => {
      document.body.classList.toggle("light-theme");
      const theme = document.body.classList.contains("light-theme")
        ? "light"
        : "dark";
      localStorage.setItem("theme", theme);
      window.dispatchEvent(
        new CustomEvent("header:themeChange", { detail: { theme } }),
      );
    });
  }

  // ── Navigation links ────────────────────────────────────────────────────────
  _initNavLinks() {
    const links = this.querySelectorAll(".nav-menu .nav-link");

    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        const parentClass = link.closest("li").classList[0];
        if (parentClass === "change-password") return;

        e.preventDefault();
        links.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        sessionStorage.setItem("activeMenu", parentClass);

        const routes = {
          home: "/home",
          delivery: "/delivery",
          history: "/deliveryHistory",
          management: "/management",
          user: "/user",
          translations: "/translations",
        };

        if (routes[parentClass]) window.location.href = routes[parentClass];
      });
    });

    const logoutBtn = this.querySelector(".logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this._handleLogout();
      });
    }
  }

  async _handleLogout() {
    if (!confirm(this._t("alerts.confirmLogout"))) return;
    window.dispatchEvent(new CustomEvent("header:logout"));
    sessionStorage.removeItem("activeMenu");
    localStorage.removeItem("user");
    try {
      await fetch("/exportmanagement/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (_) {
      /* ignore */
    }
    window.location.href = "/";
  }

  _applyRolePermission() {
    const user = this._getCurrentUser();
    const role = user?.role; // "ADMIN" | "MANAGER" | "USER" | undefined

    const managementMenu = this.querySelector(".management");
    const userMenu = this.querySelector(".user");
    const languageMenu = this.querySelector(".translations");

    if (role === "ADMIN") {
      // ADMIN thấy tất cả
      return;
    }

    if (role === "MANAGER") {
      // MANAGER: chỉ ẩn menu User
      if (userMenu) userMenu.style.display = "none";
      return;
    }

    // USER
    if (managementMenu) managementMenu.style.display = "none";
    if (userMenu) userMenu.style.display = "none";
    if (languageMenu) languageMenu.style.display = "none";
  }

  // ── Change password modal ───────────────────────────────────────────────────
  _initChangePassword() {
    const overlay = this.querySelector("#changePassOverlay");
    const openBtn = this.querySelector("#openChangePass");
    const closeBtn = this.querySelector("#closeChangePass");

    openBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const user = this._getCurrentUser();
      if (user) {
        this.querySelector("#cpUsername").textContent = user.username || "";
        this.querySelector("#cpFullName").textContent =
          user.fullName || user.full_name || user.username || "";
        this.querySelector("#cpRole").textContent = user.role || "";
      }
      this.querySelector("#cpMsg").textContent = "";
      this.querySelector("#cpMsg").className = "cp-msg";
      this.querySelector("#cpNewPass").value = "";
      this.querySelector("#cpConfirmPass").value = "";
      overlay.classList.add("active");
    });

    closeBtn.addEventListener("click", () =>
      overlay.classList.remove("active"),
    );
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("active");
    });

    // Eye toggles
    this.querySelectorAll(".cp-eye").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = this.querySelector(`#${btn.dataset.target}`);
        const isText = input.type === "text";
        input.type = isText ? "password" : "text";
        btn.style.opacity = isText ? "1" : "0.5";
      });
    });

    // Submit
    this.querySelector("#cpSubmitBtn").addEventListener("click", () =>
      this._submitChangePass(),
    );
  }

  async _submitChangePass() {
    const newPass = this.querySelector("#cpNewPass").value.trim();
    const confirmPass = this.querySelector("#cpConfirmPass").value.trim();
    const msgEl = this.querySelector("#cpMsg");
    const btn = this.querySelector("#cpSubmitBtn");
    const btnText = this.querySelector("#cpBtnText");
    const loader = this.querySelector("#cpBtnLoader");

    msgEl.className = "cp-msg";
    msgEl.textContent = "";

    // Validation
    if (!newPass) {
      msgEl.textContent = this._t(
        "changePasswordModal.validation.emptyPassword",
      );
      msgEl.classList.add("error");
      return;
    }
    if (newPass.length < 6) {
      msgEl.textContent = this._t("changePasswordModal.validation.minLength");
      msgEl.classList.add("error");
      return;
    }
    if (newPass !== confirmPass) {
      msgEl.textContent = this._t(
        "changePasswordModal.validation.passwordMismatch",
      );
      msgEl.classList.add("error");
      return;
    }

    // Loading state
    btn.disabled = true;
    btnText.style.display = "none";
    loader.style.display = "inline-block";

    try {
      const user = this._getCurrentUser();
      const res = await fetch("/exportmanagement/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user?.username, password: newPass }),
      });
      const data = await res.json();

      if (res.ok) {
        msgEl.textContent = "✅ " + data.message;
        msgEl.classList.add("success");
        this.querySelector("#cpNewPass").value = "";
        this.querySelector("#cpConfirmPass").value = "";
        setTimeout(() => {
          this.querySelector("#changePassOverlay").classList.remove("active");
          msgEl.textContent = "";
          msgEl.className = "cp-msg";
        }, 1500);
      } else {
        msgEl.textContent =
          "❌ " +
          (data.message ||
            this._t("changePasswordModal.messages.connectionError"));
        msgEl.classList.add("error");
      }
    } catch {
      msgEl.textContent =
        "❌ " + this._t("changePasswordModal.messages.connectionError");
      msgEl.classList.add("error");
    } finally {
      btn.disabled = false;
      btnText.style.display = "inline";
      loader.style.display = "none";
    }
  }

  // ── i18n ────────────────────────────────────────────────────────────────────
  async _initI18n() {
    if (!I18n.isReady?.()) {
      await I18n.init("en");
    }
    this._applyI18nLabels();
  }

  _t(key, params) {
    try {
      return I18n.t(key, params);
    } catch {
      return key;
    }
  }

  _applyI18nLabels() {
    // Helper cập nhật text node cuối trong link (giữ SVG)
    const setLinkText = (sel, val) => {
      const el = this.querySelector(sel);
      if (!el) return;
      // Tìm text node cuối, nếu không có thì tạo mới
      let textNode = [...el.childNodes].findLast(
        (n) => n.nodeType === Node.TEXT_NODE,
      );
      if (textNode) {
        textNode.textContent = " " + val;
      } else {
        el.appendChild(document.createTextNode(" " + val));
      }
    };

    // Helper cho các element thường (không có SVG)
    const set = (sel, val) => {
      const el = this.querySelector(sel);
      if (el) el.textContent = val;
    };

    // ── Nav links — dùng setLinkText để giữ SVG ───────────────────
    setLinkText(".home .nav-link", this._t("nav.home"));
    setLinkText(".delivery .nav-link", this._t("nav.delivery"));
    setLinkText(".history .nav-link", this._t("nav.history"));
    setLinkText(".management .nav-link", this._t("nav.management"));
    setLinkText(".translations .nav-link", this._t("nav.translations"));
    setLinkText(".user .nav-link", this._t("nav.user"));
    setLinkText(".change-password .nav-link", this._t("nav.changePassword"));

    // ── Modal (không có SVG, dùng set bình thường) ─────────────────
    set(".cp-header-title", this._t("changePasswordModal.title"));
    set(
      ".cp-lbl-username",
      this._t("changePasswordModal.infoSection.username"),
    );
    set(
      ".cp-lbl-fullname",
      this._t("changePasswordModal.infoSection.fullName"),
    );
    set(".cp-lbl-role", this._t("changePasswordModal.infoSection.role"));
    set(".cp-form-title", this._t("changePasswordModal.formSection.title"));
    set(
      ".cp-lbl-newpass",
      this._t("changePasswordModal.formSection.newPasswordLabel"),
    );
    set(
      ".cp-lbl-confirmpass",
      this._t("changePasswordModal.formSection.confirmPasswordLabel"),
    );
    set("#cpBtnText", this._t("changePasswordModal.formSection.submitButton"));

    const newPassEl = this.querySelector("#cpNewPass");
    if (newPassEl)
      newPassEl.placeholder = this._t(
        "changePasswordModal.formSection.newPasswordPlaceholder",
      );

    const confirmPassEl = this.querySelector("#cpConfirmPass");
    if (confirmPassEl)
      confirmPassEl.placeholder = this._t(
        "changePasswordModal.formSection.confirmPasswordPlaceholder",
      );
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  _getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }

  /**
   * Public API — gọi từ page JS sau khi fetch profile để cập nhật user
   * @param {{ username, fullName, role }} user
   */
  setUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
}

customElements.define("app-header", AppHeader);
