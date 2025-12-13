import { scheduleRefreshtoken } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#loginForm");
  const submitBtn = document.querySelector("#submitBtn");
  const forgotBtn = document.querySelector("#forgotBtn");
  const savePassword = document.querySelector("#savePassword");

  // Xử lý quên mật khẩu
  forgotBtn.addEventListener("click", (e) => {
    e.preventDefault();
    alert("Please contact IT to retrieve your password!");
  });

  const params = new URLSearchParams(window.location.search);
  const msg = params.get("msg");

  if (msg === "no_permission") {
    alert("Bạn không có quyền truy cập trang này");
  }

  if (msg === "invalid_token") {
    alert(
      "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại!"
    );
  }

  // Hàm xử lý login dùng chung
  async function handleLogin(e) {
    e.preventDefault(); // chặn reload hoặc chuyển trang mặc định

    const username = form.querySelector("input[name='username']").value.trim();
    const password = form.querySelector("input[name='password']").value.trim();

    if (!username || !password) {
      alert("Please enter your username and password!");
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
        localStorage.setItem("isSavePass", isSavePass)
        globalThis.location.href = "/home";
      } else {
        alert("Incorrect username or password!");
      }
    } catch (err) {
      alert("Server connection error!");
      console.log(err);
    }
  }

  // Gọi cùng hàm khi nhấn nút hoặc nhấn Enter
  submitBtn.addEventListener("click", handleLogin);
  form.addEventListener("submit", handleLogin);
});
