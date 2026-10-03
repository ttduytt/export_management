document.addEventListener("DOMContentLoaded", async () => {
  const roleTableBody = document.getElementById("roleTableBody");
  const btnSaveMenus = document.getElementById("btn-save-menus");
  const menuListContainer = document.getElementById("menu-list-container");

  const errorBanner = document.getElementById("errorBanner");
  const errorBannerText = document.getElementById("errorBannerText");

  let roles = [];
  let allMenus = [];
  let selectedRole = null;

  // Listen for theme changes from header
  window.addEventListener("header:themeChange", (e) => {
    if (e.detail.theme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
  });

  async function fetchMenus() {
    try {
      const res = await fetch("/exportmanagement/menus");
      const data = await res.json();
      if (data.success) {
        allMenus = data.data;
        renderMenuCheckboxes();
      }
    } catch (err) {
      console.error(err);
    }
  }

  function renderMenuCheckboxes() {
    menuListContainer.innerHTML = "";
    if (!selectedRole) {
      return;
    }

    allMenus.forEach(m => {
      const label = document.createElement("label");
      label.className = "menu-item";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = m.menu_code;
      cb.className = "menu-checkbox";

      const text = document.createElement("span");
      text.className = "menu-item-label";
      text.textContent = m.menu_name || m.menu_code;

      label.appendChild(cb);
      label.appendChild(text);
      menuListContainer.appendChild(label);
    });
  }

  async function fetchRoles() {
    try {
      roleTableBody.innerHTML = '<tr><td colspan="3" class="td-empty">Loading...</td></tr>';
      const res = await fetch("/exportmanagement/roles");
      const data = await res.json();
      if (data.success) {
        roles = data.data;
        renderTable();
      }
    } catch (err) {
      console.error(err);
      roleTableBody.innerHTML = '<tr><td colspan="3" class="td-empty" style="color:red;">Error loading roles</td></tr>';
    }
  }

  function renderTable() {
    roleTableBody.innerHTML = "";
    if (roles.length === 0) {
      roleTableBody.innerHTML = '<tr><td colspan="3" class="td-empty">No roles found</td></tr>';
      return;
    }
    roles.forEach((r, idx) => {
      const tr = document.createElement("tr");
      if (selectedRole && selectedRole.role_name === r.role_name) {
        tr.classList.add("active");
      }
      tr.innerHTML = `
        <td style="text-align: left;">${idx + 1}</td>
        <td style="text-align: left;">${r.role_name}</td>
      `;
      tr.addEventListener("click", () => selectRole(r));
      roleTableBody.appendChild(tr);
    });
  }

  async function selectRole(role) {
    selectedRole = role;
    renderTable(); // Update active row

    btnSaveMenus.disabled = false;
    hideError();

    // Re-render checkboxes to show them
    renderMenuCheckboxes();

    // Reset checkboxes
    document.querySelectorAll(".menu-checkbox").forEach(cb => cb.checked = false);

    // Fetch menus for this role
    try {
      const res = await fetch(`/exportmanagement/roles/${role.role_name}/menus`);
      const data = await res.json();
      if (data.success) {
        const allowed = data.data;
        document.querySelectorAll(".menu-checkbox").forEach(cb => {
          if (allowed.includes(cb.value)) cb.checked = true;
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  btnSaveMenus.addEventListener("click", async () => {
    if (!selectedRole) return;

    try {
      btnSaveMenus.disabled = true;

      const checkedMenus = Array.from(document.querySelectorAll(".menu-checkbox:checked")).map(cb => cb.value);
      const resMenu = await fetch(`/exportmanagement/roles/${selectedRole.role_name}/menus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menus: checkedMenus })
      });
      const dataMenu = await resMenu.json();
      if (!dataMenu.success) {
        showError(dataMenu.message);
      } else {
        alert("Permissions updated successfully!");
      }
    } catch (err) {
      console.error(err);
      showError("An error occurred");
    } finally {
      btnSaveMenus.disabled = false;
    }
  });

  function showError(msg) {
    errorBannerText.textContent = msg;
    errorBanner.classList.remove("hidden");
  }

  function hideError() {
    errorBanner.classList.add("hidden");
  }

  // Init
  fetchMenus().then(fetchRoles);
});
