document.addEventListener("DOMContentLoaded", async () => {
  const roleTableBody = document.getElementById("roleTableBody");
  const btnAddRole = document.getElementById("btn-add-role");
  const btnSaveRole = document.getElementById("btn-save-role");
  const btnDeleteRole = document.getElementById("btn-delete-role");

  const inputRoleName = document.getElementById("input-role-name");

  const errorBannerInfo = document.getElementById("errorBannerInfo");
  const errorBannerTextInfo = document.getElementById("errorBannerTextInfo");

  let roles = [];
  let selectedRole = null;
  let isEditing = false;

  // Listen for theme changes from header
  window.addEventListener("header:themeChange", (e) => {
    if (e.detail.theme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
  });

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

  function resetEditor() {
    selectedRole = null;

    inputRoleName.value = "";

    btnSaveRole.disabled = true;
    btnDeleteRole.disabled = true;
    btnAddRole.disabled = false;

    document.querySelectorAll("#roleTableBody tr").forEach(r => r.classList.remove("active"));
    hideError();
  }

  function selectRole(role) {
    selectedRole = role;

    document.querySelectorAll("#roleTableBody tr").forEach(r => {
      r.classList.toggle("active", r.dataset.role === role.role_name);
    });

    inputRoleName.value = role.role_name;

    btnSaveRole.disabled = false;
    btnDeleteRole.disabled = ["ADMIN", "MANAGER", "USER"].includes(role.role_name);

    hideError();
  }

  function renderTable() {
    roleTableBody.innerHTML = "";
    if (roles.length === 0) {
      roleTableBody.innerHTML = '<tr><td colspan="3" class="td-empty">No roles found</td></tr>';
      return;
    }
    roles.forEach((r, idx) => {
      const tr = document.createElement("tr");
      tr.dataset.role = r.role_name;
      if (selectedRole && selectedRole.role_name === r.role_name) {
        tr.classList.add("active");
      }
      tr.innerHTML = `
        <td style="text-align: left;">${idx + 1}</td>
        <td style="text-align: left;">${r.role_name}</td>
      `;
      tr.addEventListener("click", () => {
        if (selectedRole && selectedRole.role_name === r.role_name) {
          resetEditor();
        } else {
          selectRole(r);
        }
      });
      roleTableBody.appendChild(tr);
    });
  }

  btnAddRole.addEventListener("click", async () => {
    const roleName = inputRoleName.value.trim().toUpperCase();

    if (!roleName) {
      showError("Role Name is required");
      return;
    }

    try {
      btnAddRole.disabled = true;
      const res = await fetch("/exportmanagement/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_name: roleName })
      });
      const data = await res.json();
      if (!data.success) {
        showError(data.message);
        btnAddRole.disabled = false;
        return;
      }
      await fetchRoles();
      resetEditor();
      alert("Role created successfully!");
    } catch (err) {
      console.error(err);
      showError("An error occurred");
      btnAddRole.disabled = false;
    }
  });

  btnSaveRole.addEventListener("click", async () => {
    if (!selectedRole) return;
    const roleName = inputRoleName.value.trim().toUpperCase();
    if (!roleName) {
      showError("Role Name is required");
      return;
    }

    try {
      btnSaveRole.disabled = true;
      const res = await fetch(`/exportmanagement/roles/${selectedRole.role_name}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_name: roleName })
      });
      const data = await res.json();
      if (!data.success) {
        showError(data.message);
        btnSaveRole.disabled = false;
        return;
      }
      await fetchRoles();
      resetEditor();
      alert("Role updated successfully!");
    } catch (err) {
      console.error(err);
      showError("An error occurred");
      btnSaveRole.disabled = false;
    }
  });

  btnDeleteRole.addEventListener("click", async () => {
    if (!selectedRole) return;
    if (["ADMIN", "MANAGER", "USER"].includes(selectedRole.role_name)) {
      alert("Cannot delete default roles.");
      return;
    }
    if (!confirm(`Are you sure you want to delete role ${selectedRole.role_name}?`)) return;

    try {
      btnDeleteRole.disabled = true;
      const res = await fetch(`/exportmanagement/roles/${selectedRole.role_name}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        await fetchRoles();
        resetEditor();
      } else {
        showError(data.message);
        btnDeleteRole.disabled = false;
      }
    } catch (err) {
      console.error(err);
      showError("An error occurred while deleting.");
      btnDeleteRole.disabled = false;
    }
  });

  function showError(msg) {
    errorBannerTextInfo.textContent = msg;
    errorBannerInfo.classList.remove("hidden");
  }

  function hideError() {
    errorBannerInfo.classList.add("hidden");
  }

  // Init
  await fetchRoles();
  resetEditor();
});
