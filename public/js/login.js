document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#loginForm");
  const submitBtn = document.querySelector("#submitBtn");
  const forgotBtn = document.querySelector("#forgotBtn");

  // Xử lý quên mật khẩu
  forgotBtn.addEventListener("click", (e) => {
    e.preventDefault();
    alert("Please contact IT to retrieve your password!");
  });

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
      const res = await fetch("/exportmanagement/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        const userData = {
          username: data.username,
          role: data.role,
          factory: data.factory,
        };
        sessionStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("user", JSON.stringify(userData));

        window.location.href = "/home";
      } else {
        alert("Incorrect username or password!");
      }
    } catch (err) {
      alert("Server connection error!");
    }
  }

  // Gọi cùng hàm khi nhấn nút hoặc nhấn Enter
  submitBtn.addEventListener("click", handleLogin);
  form.addEventListener("submit", handleLogin);
});
