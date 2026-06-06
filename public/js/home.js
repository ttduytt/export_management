// home.js — Bootstrap logic cho trang Home
// Cấu trúc giống delivery.js: I18n → profile → applyLang → typewriter → slider

import I18n from "/i18n.js";

let t = (key) => key;
let user = null;

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const cpOverlay = document.getElementById("changePassOverlay");
const cpModalTitle = document.getElementById("cpModalTitle");
const cpLabelUsername = document.getElementById("cpLabelUsername");
const cpLabelFullName = document.getElementById("cpLabelFullName");
const cpLabelRole = document.getElementById("cpLabelRole");
const cpFormTitle = document.getElementById("cpFormTitle");
const cpLabelNewPass = document.getElementById("cpLabelNewPass");
const cpLabelConfirm = document.getElementById("cpLabelConfirmPass");
const cpBtnText = document.getElementById("cpBtnText");
const cpNewPassInput = document.getElementById("cpNewPass");
const cpConfirmInput = document.getElementById("cpConfirmPass");
const cpUsernameEl = document.getElementById("cpUsername");
const cpFullNameEl = document.getElementById("cpFullName");
const cpRoleEl = document.getElementById("cpRole");
const cpMsg = document.getElementById("cpMsg");
const cpSubmitBtn = document.getElementById("cpSubmitBtn");
const cpBtnLoader = document.getElementById("cpBtnLoader");
const closeChangePass = document.getElementById("closeChangePass");

// ─── API ──────────────────────────────────────────────────────────────────────
async function getUserProfile() {
  const res = await fetch("/exportmanagement/profile", {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json();
  return data.user;
}

// ─── Typewriter effect ────────────────────────────────────────────────────────
function typeWriter(el, text, speed = 40) {
  return new Promise((resolve) => {
    el.textContent = "";
    el.classList.remove("hide-cursor");
    let i = 0;
    const timer = setInterval(() => {
      el.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        resolve();
      }
    }, speed);
  });
}

// Fade-in slogans lần lượt sau khi typewriter xong
function revealSlogans() {
  document.querySelectorAll(".typing-sub").forEach((el, idx) => {
    setTimeout(() => el.classList.add("visible"), idx * 200);
  });
}

// ─── Apply i18n (tất cả trừ title — title do typewriter xử lý) ───────────────
function applyLang() {
  document.title = t("title");

  const s1 = document.getElementById("slogan1");
  const s2 = document.getElementById("slogan2");
  const s3 = document.getElementById("slogan3");
  if (s1) s1.textContent = t("welcome.slogan1");
  if (s2) s2.textContent = t("welcome.slogan2");
  if (s3) s3.textContent = t("welcome.slogan3");

  // Change Password Modal labels
  if (cpModalTitle) cpModalTitle.textContent = t("changePasswordModal.title");
  if (cpLabelUsername)
    cpLabelUsername.textContent = t("changePasswordModal.infoSection.username");
  if (cpLabelFullName)
    cpLabelFullName.textContent = t("changePasswordModal.infoSection.fullName");
  if (cpLabelRole)
    cpLabelRole.textContent = t("changePasswordModal.infoSection.role");
  if (cpFormTitle)
    cpFormTitle.textContent = t("changePasswordModal.formSection.title");
  if (cpLabelNewPass)
    cpLabelNewPass.textContent = t(
      "changePasswordModal.formSection.newPasswordLabel",
    );
  if (cpLabelConfirm)
    cpLabelConfirm.textContent = t(
      "changePasswordModal.formSection.confirmPasswordLabel",
    );
  if (cpBtnText)
    cpBtnText.textContent = t("changePasswordModal.formSection.submitButton");
  if (cpNewPassInput)
    cpNewPassInput.placeholder = t(
      "changePasswordModal.formSection.newPasswordPlaceholder",
    );
  if (cpConfirmInput)
    cpConfirmInput.placeholder = t(
      "changePasswordModal.formSection.confirmPasswordPlaceholder",
    );
}

// ─── Change Password Modal ────────────────────────────────────────────────────
function openModal() {
  if (!user) return;
  cpUsernameEl.textContent = user.username || "";
  cpFullNameEl.textContent = user.fullname || user.full_name || "";
  cpRoleEl.textContent = user.role || "";
  cpMsg.textContent = "";
  cpMsg.className = "cp-msg";
  cpNewPassInput.value = "";
  cpConfirmInput.value = "";
  cpOverlay.classList.add("active");
}

function closeModal() {
  cpOverlay.classList.remove("active");
  cpMsg.textContent = "";
  cpMsg.className = "cp-msg";
  cpNewPassInput.value = "";
  cpConfirmInput.value = "";
}

window.submitChangePass = async function () {
  const newPass = cpNewPassInput.value.trim();
  const confirmPass = cpConfirmInput.value.trim();
  cpMsg.className = "cp-msg";
  cpMsg.textContent = "";

  if (!newPass) {
    cpMsg.textContent = t("changePasswordModal.validation.emptyPassword");
    cpMsg.classList.add("error");
    return;
  }
  if (newPass.length < 6) {
    cpMsg.textContent = t("changePasswordModal.validation.minLength");
    cpMsg.classList.add("error");
    return;
  }
  if (newPass !== confirmPass) {
    cpMsg.textContent = t("changePasswordModal.validation.passwordMismatch");
    cpMsg.classList.add("error");
    return;
  }

  cpSubmitBtn.disabled = true;
  cpBtnText.style.display = "none";
  cpBtnLoader.style.display = "inline-block";

  try {
    const res = await fetch("/exportmanagement/change-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: user.username, password: newPass }),
    });
    const data = await res.json();
    if (res.ok) {
      cpMsg.textContent = "✅ " + data.message;
      cpMsg.classList.add("success");
      cpNewPassInput.value = "";
      cpConfirmInput.value = "";
      setTimeout(closeModal, 1500);
    } else {
      cpMsg.textContent = "❌ " + (data.message || "Đổi mật khẩu thất bại.");
      cpMsg.classList.add("error");
    }
  } catch {
    cpMsg.textContent = t("changePasswordModal.messages.connectionError");
    cpMsg.classList.add("error");
  } finally {
    cpSubmitBtn.disabled = false;
    cpBtnText.style.display = "inline";
    cpBtnLoader.style.display = "none";
  }
};

// ─── Image slider (infinite vertical scroll) ──────────────────────────────────
function initSlider() {
  const track = document.getElementById("slideTrack");
  if (!track) return;
  track.innerHTML += track.innerHTML; // nhân đôi để loop vô hạn
  let offset = 0;
  (function scrollLoop() {
    offset += 0.5;
    if (offset >= track.scrollHeight / 2) offset = 0;
    track.style.transform = `translateY(-${offset}px)`;
    requestAnimationFrame(scrollLoop);
  })();
}

// ─── Events ───────────────────────────────────────────────────────────────────
closeChangePass.addEventListener("click", closeModal);
cpOverlay.addEventListener("click", (e) => {
  if (e.target === cpOverlay) closeModal();
});
// header.js dispatch event này khi click "Change Password"
document.addEventListener("open-change-password", openModal);

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap() {
  // 1. Init i18n
  await I18n.init("en");
  t = (key, params) => I18n.t(key, params);

  // 2. Fetch user profile → set lên app-header
  try {
    user = await getUserProfile();
    document.querySelector("app-header")?.setUser(user);
  } catch (err) {
    console.warn("Không lấy được profile:", err);
  }

  // 3. Apply i18n tĩnh
  applyLang();

  // 4. Typewriter trên tiêu đề → rồi reveal slogans
  const h1 = document.getElementById("welcomeTitle");
  if (h1) {
    await typeWriter(h1, t("welcome.title"), 38);
    revealSlogans();
  }

  // 5. Vertical image slider
  initSlider();
}

await bootstrap();
