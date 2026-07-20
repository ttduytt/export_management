const Modal = (() => {
  const ICONS = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="16 8 10 14 7 11"/></svg>`,
    error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  };

  const THEME = {
    success: {
      bg: "#f0faf4",
      border: "#4caf88",
      icon: "#2e9e68",
      text: "#1a5c3a",
      progress: "#2e9e68",
    },
    error: {
      bg: "#fff3f3",
      border: "#e05c5c",
      icon: "#c0392b",
      text: "#7a1f1f",
      progress: "#c0392b",
    },
    info: {
      bg: "#f0f6ff",
      border: "#5b8dee",
      icon: "#3a6fd8",
      text: "#1a3c7a",
      progress: "#3a6fd8",
    },
    warning: {
      bg: "#fffbf0",
      border: "#e0a020",
      icon: "#c47f17",
      text: "#7a4c00",
      progress: "#c47f17",
    },
  };

  function injectStyles() {
    if (document.getElementById("modal-notification-styles")) return;
    const style = document.createElement("style");
    style.id = "modal-notification-styles";
    style.textContent = `
      .mn-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.38);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
        animation: mn-fade-in 0.18s ease;
      }
      .mn-backdrop.mn-closing {
        animation: mn-fade-out 0.22s ease forwards;
      }
      .mn-box {
        position: relative;
        min-width: 320px;
        max-width: 460px;
        width: 100%;
        border-radius: 14px;
        border: 1.5px solid;
        padding: 28px 28px 20px;
        box-shadow: 0 8px 36px rgba(0,0,0,0.14);
        animation: mn-slide-in 0.22s cubic-bezier(.22,.68,0,1.2);
        overflow: hidden;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .mn-backdrop.mn-closing .mn-box {
        animation: mn-slide-out 0.18s ease forwards;
      }
      .mn-close-btn {
        position: absolute;
        top: 12px;
        right: 14px;
        background: none;
        border: none;
        cursor: pointer;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.45;
        transition: opacity 0.15s, background 0.15s;
        padding: 0;
      }
      .mn-close-btn:hover { opacity: 0.9; background: rgba(0,0,0,0.07); }
      .mn-close-btn svg { width: 16px; height: 16px; }
      .mn-icon-wrap {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 14px;
      }
      .mn-icon-wrap svg { width: 26px; height: 26px; }
      .mn-title {
        font-size: 17px;
        font-weight: 700;
        margin: 0 0 7px;
        line-height: 1.3;
      }
      .mn-message {
        font-size: 14.5px;
        line-height: 1.6;
        margin: 0 0 18px;
        opacity: 0.82;
      }
      .mn-message .sea-label {
        font-weight: 700;
      }
      .mn-message .sea-days {
        font-weight: 700;
        font-size: 4em;
        color: #c0392b;
      }
      .mn-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      .mn-btn-close {
        padding: 8px 22px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: opacity 0.15s, transform 0.12s;
        letter-spacing: 0.01em;
      }
      .mn-btn-close:hover { opacity: 0.88; }
      .mn-btn-close:active { transform: scale(0.97); }
      .mn-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3.5px;
        border-radius: 0 0 14px 0;
        transition: none;
      }
      .mn-progress-animated {
        transition: width linear;
      }
      @keyframes mn-fade-in   { from { opacity:0 } to { opacity:1 } }
      @keyframes mn-fade-out  { from { opacity:1 } to { opacity:0 } }
      @keyframes mn-slide-in  { from { transform: translateY(-18px) scale(0.96); opacity:0 } to { transform: translateY(0) scale(1); opacity:1 } }
      @keyframes mn-slide-out { from { transform: scale(1); opacity:1 } to { transform: scale(0.94); opacity:0 } }

      /* ─── Sea Alert Modal ─── */
      .mn-box.mn-sea-box {
        max-width: 560px;
      }
      .mn-sea-title {
        font-size: 17px;
        font-weight: 700;
        margin: 0 0 18px;
        line-height: 1.3;
      }
      .mn-sea-content {
        display: flex;
        align-items: stretch;
        gap: 16px;
        margin-bottom: 20px;
        min-height: 140px;
      }
      .mn-sea-left {
        flex: 1 1 50%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 8px;
        font-size: 14.5px;
        line-height: 1.7;
      }
      .mn-sea-left .sea-label {
        font-weight: 700;
      }
      .mn-sea-right {
        flex: 1 1 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .mn-sea-divider {
        width: 1.5px;
        align-self: stretch;
        background: currentColor;
        opacity: 0.6;
      }
      .mn-sea-days-number {
        font-weight: 900;
        font-size: 6em;
        line-height: 1;
        color: #c0392b;
      }
      .mn-sea-footer {
        display: flex;
        justify-content: center;
      }
    `;
    document.head.appendChild(style);
  }

  function close(backdrop, callback) {
    backdrop.classList.add("mn-closing");
    backdrop.addEventListener(
      "animationend",
      () => {
        backdrop.remove();
        if (typeof callback === "function") callback();
      },
      { once: true },
    );
  }

  let _t = null;

  function init(tFn) {
    _t = tFn;
  }

  function show(options = {}) {
    const {
      title = _t ? _t("modal.defaultTitle") : "Thông báo",
      message = "",
      type = "info",
      autoClose = false,
      duration = 3000,
      showClose = true,
      onClose,
    } = options;

    injectStyles();

    const theme = THEME[type] || THEME.info;
    const icon = ICONS[type] || ICONS.info;

    const backdrop = document.createElement("div");
    backdrop.className = "mn-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.setAttribute("aria-label", title);

    const closeModal = () => close(backdrop, onClose);

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });

    backdrop.innerHTML = `
      <div class="mn-box" style="background:${theme.bg}; border-color:${theme.border};">
        ${
          showClose
            ? `
        <button class="mn-close-btn" aria-label="${_t ? _t("modal.closeButton") : "Đóng"}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>`
            : ""
        }
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
          <div class="mn-icon-wrap" style="background:${theme.icon}18; margin-bottom:0; flex-shrink:0;">
            <span style="color:${theme.icon}; display:flex;">${icon}</span>
          </div>
          <p class="mn-title" style="color:${theme.text}; margin:0;">${title}</p>
        </div>
        <p class="mn-message" style="color:${theme.text};">${message}</p>
        ${
          showClose
            ? `
        <div class="mn-footer">
          <button class="mn-btn-close" style="background:${theme.icon}; color:#fff;">
            ${_t ? _t("modal.closeButton") : "Đóng"}
          </button>
        </div>`
            : ""
        }
        ${autoClose ? `<div class="mn-progress" style="background:${theme.progress}; width:100%;"></div>` : ""}
      </div>
    `;

    document.body.appendChild(backdrop);

    if (showClose) {
      backdrop
        .querySelector(".mn-close-btn")
        .addEventListener("click", closeModal);
      backdrop
        .querySelector(".mn-btn-close")
        .addEventListener("click", closeModal);
    }

    if (autoClose) {
      const bar = backdrop.querySelector(".mn-progress");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          bar.classList.add("mn-progress-animated");
          bar.style.transitionDuration = duration + "ms";
          bar.style.width = "0%";
        });
      });
      setTimeout(closeModal, duration);
    }

    return { close: closeModal };
  }

  // ─── Sea Alert Modal ──────────────────────────────────────────────────────
  // Dedicated layout for the first-export SEA shipment notification:
  // left half shows mobiscode info, right half shows a large "days left"
  // number, and the close button is centered at the bottom.
  function showSeaAlert(options = {}) {
    const {
      title = _t ? _t("modal.defaultTitle") : "Thông báo",
      mobiscode = "",
      days = "",
      daysLabel = "",
      confirmLabel = _t ? _t("modal.confirmButton") : "Xác nhận",
      type = "warning",
      onClose,
    } = options;

    injectStyles();

    const theme = THEME[type] || THEME.warning;
    const icon = ICONS[type] || ICONS.warning;

    const backdrop = document.createElement("div");
    backdrop.className = "mn-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.setAttribute("aria-label", title);

    const closeModal = () => close(backdrop, onClose);

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });

    backdrop.innerHTML = `
      <div class="mn-box mn-sea-box" style="background:${theme.bg}; border-color:${theme.border}; color:${theme.text};">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
          <div class="mn-icon-wrap" style="background:${theme.icon}18; margin-bottom:0; flex-shrink:0;">
            <span style="color:${theme.icon}; display:flex;">${icon}</span>
          </div>
          <p class="mn-sea-title" style="color:${theme.text}; margin:0;">${title}</p>
        </div>
        <div class="mn-sea-content">
          <div class="mn-sea-left">
            <div><span class="sea-label">Mobis code:</span> ${mobiscode}</div>
            ${daysLabel ? `<div class="sea-label">${daysLabel}:</div>` : ""}
          </div>
          <div class="mn-sea-divider"></div>
          <div class="mn-sea-right">
            <div class="mn-sea-days-number">${days}</div>
          </div>
        </div>
        <div class="mn-sea-footer">
          <button class="mn-btn-close" style="background:${theme.icon}; color:#fff;">
            ${confirmLabel}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    backdrop
      .querySelector(".mn-btn-close")
      .addEventListener("click", closeModal);

    return { close: closeModal };
  }

  // ─── Confirm Modal (Yes/No, bắt buộc chọn) ────────────────────────────────
  // Không có nút đóng, không tắt khi click backdrop — chỉ tắt khi chọn Yes/No.
  // Trả về Promise<boolean>: true nếu chọn Yes, false nếu chọn No.
  function showConfirm(options = {}) {
    const {
      title = _t ? _t("modal.defaultTitle") : "Thông báo",
      message = "",
      type = "warning",
      yesLabel = _t ? _t("modal.yesButton") : "Có",
      noLabel = _t ? _t("modal.noButton") : "Không",
    } = options;

    return new Promise((resolve) => {
      injectStyles();

      const theme = THEME[type] || THEME.warning;
      const icon = ICONS[type] || ICONS.warning;

      const backdrop = document.createElement("div");
      backdrop.className = "mn-backdrop";
      backdrop.setAttribute("role", "dialog");
      backdrop.setAttribute("aria-modal", "true");
      backdrop.setAttribute("aria-label", title);

      const finish = (result) => {
        close(backdrop, () => resolve(result));
      };

      backdrop.innerHTML = `
        <div class="mn-box" style="background:${theme.bg}; border-color:${theme.border};">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
            <div class="mn-icon-wrap" style="background:${theme.icon}18; margin-bottom:0; flex-shrink:0;">
              <span style="color:${theme.icon}; display:flex;">${icon}</span>
            </div>
            <p class="mn-title" style="color:${theme.text}; margin:0;">${title}</p>
          </div>
          <p class="mn-message" style="color:${theme.text};">${message}</p>
          <div class="mn-footer">
            <button class="mn-btn-no" style="padding:8px 22px;border-radius:8px;border:1.5px solid ${theme.border};cursor:pointer;font-size:14px;font-weight:600;background:transparent;color:${theme.text};">
              ${noLabel}
            </button>
            <button class="mn-btn-yes" style="padding:8px 22px;border-radius:8px;border:none;cursor:pointer;font-size:14px;font-weight:600;background:${theme.icon};color:#fff;">
              ${yesLabel}
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);

      backdrop
        .querySelector(".mn-btn-yes")
        .addEventListener("click", () => finish(true));
      backdrop
        .querySelector(".mn-btn-no")
        .addEventListener("click", () => finish(false));

      // Không gắn click-outside-to-close, không có nút X — bắt buộc chọn.
    });
  }

  // ─── Sea Confirm Modal (layout to + Yes/No bắt buộc chọn) ─────────────────
  // Giống showSeaAlert về layout (mobiscode trái, số ngày to bên phải),
  // nhưng có 2 nút Yes/No, không tắt khi click backdrop.
  // Trả về Promise<boolean>.
  function showSeaConfirm(options = {}) {
    const {
      title = _t ? _t("modal.defaultTitle") : "Thông báo",
      mobiscode = "",
      days = "",
      daysLabel = "",
      yesLabel = _t ? _t("modal.yesButton") : "Có",
      noLabel = _t ? _t("modal.noButton") : "Không",
      type = "warning",
    } = options;

    return new Promise((resolve) => {
      injectStyles();

      const theme = THEME[type] || THEME.warning;
      const icon = ICONS[type] || ICONS.warning;

      const backdrop = document.createElement("div");
      backdrop.className = "mn-backdrop";
      backdrop.setAttribute("role", "dialog");
      backdrop.setAttribute("aria-modal", "true");
      backdrop.setAttribute("aria-label", title);

      const finish = (result) => {
        close(backdrop, () => resolve(result));
      };

      backdrop.innerHTML = `
        <div class="mn-box mn-sea-box" style="background:${theme.bg}; border-color:${theme.border}; color:${theme.text};">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
            <div class="mn-icon-wrap" style="background:${theme.icon}18; margin-bottom:0; flex-shrink:0;">
              <span style="color:${theme.icon}; display:flex;">${icon}</span>
            </div>
            <p class="mn-sea-title" style="color:${theme.text}; margin:0;">${title}</p>
          </div>
          <div class="mn-sea-content">
            <div class="mn-sea-left">
              <div><span class="sea-label">Mobis code:</span> ${mobiscode}</div>
              ${daysLabel ? `<div class="sea-label">${daysLabel}:</div>` : ""}
            </div>
            <div class="mn-sea-divider"></div>
            <div class="mn-sea-right">
              <div class="mn-sea-days-number">${days}</div>
            </div>
          </div>
          <div class="mn-sea-footer" style="gap:10px;">
            <button class="mn-btn-no" style="padding:8px 22px;border-radius:8px;border:1.5px solid ${theme.border};cursor:pointer;font-size:14px;font-weight:600;background:transparent;color:${theme.text};">
              ${noLabel}
            </button>
            <button class="mn-btn-yes" style="padding:8px 22px;border-radius:8px;border:none;cursor:pointer;font-size:14px;font-weight:600;background:${theme.icon};color:#fff;">
              ${yesLabel}
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);

      backdrop
        .querySelector(".mn-btn-yes")
        .addEventListener("click", () => finish(true));
      backdrop
        .querySelector(".mn-btn-no")
        .addEventListener("click", () => finish(false));

      // Không gắn click-outside-to-close — bắt buộc chọn Yes/No.
    });
  }

  return { show, showSeaAlert, showConfirm, showSeaConfirm, init };
})();

export default Modal;
