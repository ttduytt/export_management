import I18n from "/i18n.js";

// ─── Global translation handle ─────────────────────────────────────────────
let t = (key) => key;

// ─── Apply language to static DOM ─────────────────────────────────────────
function applyLang() {
  // Nav

  // Heading bảng
  document.getElementById("th-history-title").textContent = t("history.title");

  // Search placeholder
  document.getElementById("searchTextDelivery").placeholder = t(
    "history.searchPlaceholder",
  );

  // Factory label
  document.getElementById("lbl-factory").textContent = t(
    "history.factoryLabel",
  );

  // Date separator giữ "~" — không cần dịch

  // Pagination
  document.getElementById("prevPage").title = t("pagination.prev");
  document.getElementById("nextPage").title = t("pagination.next");

  // Change Password modal
  document.querySelector(".cp-header h2").textContent = t(
    "changePasswordModal.title",
  );

  document.getElementById("th-his-stt").textContent = t("history.table.stt");
  document.getElementById("th-his-modelId").textContent = t(
    "history.table.modelId",
  );
  document.getElementById("th-his-qr").textContent = t("history.table.qr");
  document.getElementById("th-his-mobisCode").textContent = t(
    "history.table.mobisCode",
  );
  document.getElementById("th-his-modelName").textContent = t(
    "history.table.modelName",
  );
  document.getElementById("th-his-type").textContent = t("history.table.type");
  document.getElementById("th-his-target").textContent = t(
    "history.table.target",
  );
  document.getElementById("th-his-evenQuantity").textContent = t(
    "history.table.evenQuantity",
  );
  document.getElementById("th-his-shippingDate").textContent = t(
    "history.table.shippingDate",
  );
  document.getElementById("th-his-shippingMethod").textContent = t(
    "history.table.shippingMethod",
  );
  document.getElementById("th-his-eventUser").textContent = t(
    "history.table.eventUser",
  );
  document.getElementById("th-his-eventTime").textContent = t(
    "history.table.eventTime",
  );
}

// ─── User profile ──────────────────────────────────────────────────────────
async function getUserProfile() {
  const res = await fetch("/exportmanagement/profile", {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json();
  return data.user;
}

// ─── Delivery History table ────────────────────────────────────────────────
async function initDelivery(page = 1) {
  const searchInput = document.getElementById("searchTextDelivery");
  const factorySelect = document.getElementById("factorySelect");
  const dateFrom = document.getElementById("deliveryDateFrom");
  const dateTo = document.getElementById("deliveryDateTo");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const tbody = document.getElementById("DeliveryTableBody");

  tbody.innerHTML = "";

  const user = await getUserProfile();
  if (!user) {
    alert(t("alerts.loginRequired"));
    globalThis.location.href = "/";
    return;
  }

  const url =
    `/exportmanagement/delivery/history/${factorySelect.value}?page=${page}` +
    `&search=${encodeURIComponent(searchInput.value.trim())}` +
    `&dateFrom=${encodeURIComponent(dateFrom.value)}` +
    `&dateTo=${encodeURIComponent(dateTo.value)}`;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    console.error("Fetch error", await res.text());
    alert(t("alerts.loadDataError"));
    return;
  }

  const result = await res.json();
  const data = result.data || [];
  let stt = (result.page - 1) * result.limit + 1;

  data.forEach((d) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${stt++}</td>
      <td class="model-id">${d.model_id || ""}</td>
      <td class="qr">${d.qr || ""}</td>
      <td class="mobis-code">${d.mobis_code || ""}</td>
      <td class="model-name">${d.model_name || ""}</td>
      <td class="type">${d.type || ""}</td>
      <td class="target">${d.target || ""}</td>
      <td class="quantity">${d.event_quantity || ""}</td>
      <td class="shipment-date">${d.shipment_date ? dayjs(d.shipment_date).format("YYYY-MM-DD") : ""}</td>
      <td class="shipping-method">${d.shipping_method || ""}</td>
      <td class="event-user">${d.event_user || ""}</td>
      <td class="event-time">${d.event_time ? dayjs(d.event_time).format("YYYY-MM-DD HH:mm:ss") : ""}</td>`;
    tbody.appendChild(row);
  });

  // Pagination
  prevPageBtn.disabled = result.page <= 1;
  nextPageBtn.disabled = !result.hasNextPage;
  window.currentDeliveryPage = result.page;

  prevPageBtn.onclick = () => {
    if (window.currentDeliveryPage > 1)
      initDelivery(window.currentDeliveryPage - 1);
  };
  nextPageBtn.onclick = () => {
    if (result.hasNextPage) initDelivery(window.currentDeliveryPage + 1);
  };

  // ── Event listeners (bind 1 lần) ──
  if (!searchInput._bound) {
    let debounce;
    searchInput.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        window.currentDeliveryPage = 1;
        initDelivery(1);
      }, 500);
    });
    searchInput._bound = true;
  }

  if (!dateFrom._bound) {
    dateFrom.addEventListener("change", () => {
      window.currentDeliveryPage = 1;
      initDelivery(1);
    });
    dateFrom._bound = true;
  }

  if (!dateTo._bound) {
    dateTo.addEventListener("change", () => {
      window.currentDeliveryPage = 1;
      initDelivery(1);
    });
    dateTo._bound = true;
  }

  if (!factorySelect._bound) {
    factorySelect.addEventListener("change", () => {
      window.currentDeliveryPage = 1;
      initDelivery(1);
    });
    factorySelect._bound = true;
  }

  const clearBtn = document.getElementById("clearFilters");
  if (clearBtn && !clearBtn._bound) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      dateFrom.value = "";
      dateTo.value = "";
      window.currentDeliveryPage = 1;
      initDelivery(1);
    });
    clearBtn._bound = true;
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const savedLang = localStorage.getItem("lang") || "en";
  await I18n.init(savedLang);
  t = (key, params) => I18n.t(key, params);

  applyLang();

  try {
    let currentUser = await getUserProfile();
    document.querySelector("app-header")?.setUser(currentUser);
    localStorage.setItem("user", JSON.stringify(currentUser));
    await initDelivery(1);
  } catch (err) {
    console.error("Initialization error:", err);
  }
});
