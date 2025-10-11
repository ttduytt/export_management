document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#loginForm");
  const submitBtn = document.querySelector("#submitBtn");
  const forgotBtn = document.querySelector("#forgotBtn");
    forgotBtn.addEventListener("click", (e) => {
    e.preventDefault(); // chặn chuyển trang
    alert("Vui lòng liên hệ IT để lấy lại mật khẩu!");
  });
  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault(); // chặn chuyển trang
    const username = form.querySelector("input[name='username']").value.trim();
    const password = form.querySelector("input[name='password']").value.trim();

    if (!username || !password) {
      alert("Vui lòng nhập đủ tài khoản và mật khẩu!");
      return;
    }
    try {
      const res = await fetch("/exportmanagement/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem("user", JSON.stringify({ username: data.username, password: data.password, role: data.role, factory: data.factory }));
        localStorage.setItem("user", JSON.stringify({ username: data.username, password: data.password, role: data.role, factory: data.factory }));
        window.location.href = "/home";
      } else {
        alert("Sai tài khoản hoặc mật khẩu!");
      }
    } catch (err) {
      alert("Lỗi kết nối server!", err);
    }
  });
});
