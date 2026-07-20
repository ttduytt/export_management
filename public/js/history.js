import I18n from "/i18n.js";
import DateRangePicker from "/js/dateRangePicker.js";

// ─── Global translation handle ─────────────────────────────────────────────
let t = (key) => key;

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Xóa chỉ rows (không xóa header), append empty message hoặc rows mới */
function clearRows(tbody, rowSelector) {
  tbody
    .querySelectorAll(rowSelector + ", .empty-msg")
    .forEach((r) => r.remove());
}

function showEmpty(tbody, msg) {
  const div = document.createElement("div");
  div.className = "empty-msg";
  div.style.cssText = "text-align:center;padding:32px;color:#6b7db8;";
  div.textContent = msg || "Không có dữ liệu";
  tbody.appendChild(div);
}

function attachCopyTSV(container, rowSelector) {
  container.addEventListener("copy", (e) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const allRows = [...container.querySelectorAll(rowSelector)];
    if (!allRows.length) return;

    const selectedRows = allRows.filter((row) => {
      const range = selection.getRangeAt(0);
      return range.intersectsNode(row);
    });

    if (!selectedRows.length) return;

    const tsv = selectedRows
      .map((row) => {
        if (row.dataset.tsv) return row.dataset.tsv;
        const cells = [...row.querySelectorAll(":scope > div")];
        return cells.map((c) => c.textContent.trim()).join("\t");
      })
      .join("\n");

    e.clipboardData.setData("text/plain", tsv);
    e.preventDefault();
  });
}

// ─── Apply language to static DOM ─────────────────────────────────────────
function applyLang() {
  const searchEl = document.getElementById("searchTextDelivery");
  document.getElementById("prevPage").title = t("pagination.prev");
  document.getElementById("nextPage").title = t("pagination.next");

  const cpHeader = document.querySelector(".cp-header h2");
  if (cpHeader) cpHeader.textContent = t("changePasswordModal.title");

  document.getElementById("th-his-stt").textContent = t("history.table.stt");
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

  const tabEventBtn = document.getElementById("tabBtnEventHistory");
  if (tabEventBtn) tabEventBtn.textContent = t("history.tab.boxHistory");
  const tabDeliveryBtn = document.getElementById("tabBtnDeliveryHistory");
  if (tabDeliveryBtn)
    tabDeliveryBtn.textContent = t("history.tab.deliveryHistory");

  const setHeaderText = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    const textNode = [...el.childNodes].find(
      (n) => n.nodeType === Node.TEXT_NODE,
    );
    if (textNode) textNode.textContent = t(key) + " ";
    else el.insertBefore(document.createTextNode(t(key) + " "), el.firstChild);
  };

  const dhHeaderDivs = document.querySelectorAll("#dhTableHeader > div");
  if (dhHeaderDivs.length >= 9) {
    dhHeaderDivs[0].textContent = t("admin.delivery.table.stt");
    dhHeaderDivs[1].textContent = t("admin.delivery.table.mobisCode");
    dhHeaderDivs[2].textContent = t("admin.delivery.table.modelName");
    dhHeaderDivs[3].textContent = t("admin.delivery.table.type");
    dhHeaderDivs[4].textContent = t("admin.delivery.table.status");
    dhHeaderDivs[5].textContent = t("admin.delivery.table.target");
    dhHeaderDivs[6].textContent = t("admin.delivery.table.quantity");
    dhHeaderDivs[7].textContent = t("admin.delivery.table.shippingDate");
    dhHeaderDivs[8].textContent = t("admin.delivery.table.shippingMethod");
  }
  setHeaderText("dhSortFirstExport", "admin.delivery.table.firstExport");
  setHeaderText("dhSortArriveDate", "admin.delivery.table.arriveDate");
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

// ─── Tab switching ──────────────────────────────────────────────────────────
function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-pill");
  const panels = {
    eventHistory: document.getElementById("panelEventHistory"),
    deliveryHistory: document.getElementById("panelDeliveryHistory"),
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      Object.values(panels).forEach((p) => p.classList.remove("active"));
      panels[btn.dataset.tab]?.classList.add("active");

      if (btn.dataset.tab === "deliveryHistory" && !window._dhLoaded) {
        window._dhLoaded = true;
        initDeliveryHistoryTab();
      }
    });
  });
}

// ─── Delivery History tab ──────────────────────────────────────────────────
const dhSortState = { firstExport: null, arriveDate: null };
let dhCurrentPage = 1;
let dhDatePickerRef = null;

function dhGetStatusText(status) {
  if (!status) return "";
  const key = status.toLowerCase();
  if (key === "run") return t("statusText.run");
  if (key === "complete") return t("statusText.complete");
  if (key === "wait") return t("statusText.wait");
  return status;
}

const DH_SORT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-left:4px;opacity:0.6"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>`;
const DH_SORT_ASC_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-left:4px;opacity:1"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4" stroke-opacity="0.3"/><path d="M17 4v16" stroke-opacity="0.3"/></svg>`;
const DH_SORT_DESC_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-left:4px;opacity:1"><path d="m3 16 4 4 4-4" stroke-opacity="0.3"/><path d="M7 20V4" stroke-opacity="0.3"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>`;

function dhGetSortIcon(state) {
  if (state === "asc") return DH_SORT_ASC_ICON;
  if (state === "desc") return DH_SORT_DESC_ICON;
  return DH_SORT_ICON;
}

function dhUpdateSortHeaders() {
  const sortFirstExportEl = document.getElementById("dhSortFirstExport");
  const sortArriveDateEl = document.getElementById("dhSortArriveDate");
  if (sortFirstExportEl) {
    sortFirstExportEl.innerHTML =
      t("admin.delivery.table.firstExport") +
      " " +
      dhGetSortIcon(dhSortState.firstExport);
  }
  if (sortArriveDateEl) {
    sortArriveDateEl.innerHTML =
      t("admin.delivery.table.arriveDate") +
      " " +
      dhGetSortIcon(dhSortState.arriveDate);
  }
}

function dhRender(data, page, hasNextPage, limit) {
  const tbody = document.getElementById("dhTableBody");
  const prevBtn = document.getElementById("dhPrevPage");
  const nextBtn = document.getElementById("dhNextPage");

  // Xóa chỉ rows cũ, header không bị ảnh hưởng
  clearRows(tbody, ".dh-table-row");

  if (!data || data.length === 0) {
    showEmpty(tbody, "Không có dữ liệu");
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  const startStt = (page - 1) * (limit || 50) + 1;

  data.forEach((item, index) => {
    const firstExportText = item.first_export == 1 ? "✓" : "";
    const shipmentDate = item.shipment_date
      ? dayjs(item.shipment_date).format("YYYY-MM-DD")
      : "";
    const arriveDateVal =
      item.first_export == 1 &&
      item.arrive_date !== null &&
      item.arrive_date !== undefined &&
      item.arrive_date !== ""
        ? String(item.arrive_date)
        : "";

    const row = document.createElement("div");
    row.className = "dh-table-row";
    // data-* để TSV copy lấy giá trị thô (không bị HTML của badge)
    row.dataset.tsv = [
      startStt + index,
      item.mobis_code || "",
      item.model_name || "",
      item.type || "",
      item.status || "",
      item.target || "",
      item.quantity || "",
      shipmentDate,
      item.shipping_method || "",
      firstExportText,
      arriveDateVal,
    ].join("\t");

    row.innerHTML = `
      <div class="col-center">${startStt + index}</div>
      <div class="col-text">${item.mobis_code || ""}</div>
      <div class="col-text">${item.model_name || ""}</div>
      <div class="col-center">${item.type || ""}</div>
      <div class="col-center"><span class="dh-status-badge ${(item.status || "").toLowerCase()}">${dhGetStatusText(item.status)}</span></div>
      <div class="col-num">${item.target || ""}</div>
      <div class="col-num">${item.quantity || ""}</div>
      <div class="col-center">${shipmentDate}</div>
      <div class="col-center">${item.shipping_method || ""}</div>
      <div class="col-center">${item.first_export == 1 ? `<span class="dh-first-export-badge"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>` : ""}</div>
      <div class="col-num">${arriveDateVal ? `<span style="color:red;font-weight:900;font-size:35px;line-height: 0;">${arriveDateVal}</span>` : ""}</div>
    `;
    tbody.appendChild(row);
  });

  prevBtn.disabled = page <= 1;
  nextBtn.disabled = !hasNextPage;
  dhCurrentPage = page;
}

async function dhFetchData(page = 1) {
  const factorySelect = document.getElementById("factorySelectDelivery");
  const searchInput = document.getElementById("dhSearchText");

  const params = new URLSearchParams();
  params.set("page", page);
  params.set("limit", 50);
  if (searchInput?.value.trim()) params.set("search", searchInput.value.trim());
  if (dhDatePickerRef?.getFrom())
    params.set("startDate", dhDatePickerRef.getFrom());
  if (dhDatePickerRef?.getTo()) params.set("endDate", dhDatePickerRef.getTo());

  if (dhSortState.firstExport) {
    params.set("sortBy", "first_export");
    params.set("sortDir", dhSortState.firstExport);
  } else if (dhSortState.arriveDate) {
    params.set("sortBy", "arrive_date");
    params.set("sortDir", dhSortState.arriveDate);
  }

  try {
    const res = await fetch(
      `/exportmanagement/delivery-history/${factorySelect.value}?${params.toString()}`,
    );
    if (!res.ok) throw new Error(await res.text());
    const result = await res.json();
    dhRender(result.data || [], result.page, result.hasNextPage, result.limit);
  } catch (err) {
    console.error("Lỗi fetch delivery history:", err);
    const tbody = document.getElementById("dhTableBody");
    clearRows(tbody, ".dh-table-row");
    showEmpty(tbody, "Lỗi tải dữ liệu");
  }
}

function initDeliveryHistoryTab() {
  const factorySelect = document.getElementById("factorySelectDelivery");
  const searchInput = document.getElementById("dhSearchText");
  const prevBtn = document.getElementById("dhPrevPage");
  const nextBtn = document.getElementById("dhNextPage");
  const clearBtn = document.getElementById("clearFiltersDelivery");

  // Giới hạn quyền chọn xưởng theo role
  applyFactoryRestriction(factorySelect);

  // Date range picker
  dhDatePickerRef = new DateRangePicker({
    inputId: "dhDateRangeText",
    onChange: () => {
      dhCurrentPage = 1;
      dhFetchData(1);
    },
  });

  dhDatePickerRef._setRange(
    dayjs().subtract(21, "day").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
    false,
  );

  // Attach copy-as-TSV cho delivery history
  const dhContainer = document.getElementById("dhTableBody");
  attachCopyTSV(dhContainer, ".dh-table-row");

  dhUpdateSortHeaders();
  dhFetchData(1);

  factorySelect.addEventListener("change", () => {
    dhCurrentPage = 1;
    dhFetchData(1);
  });

  let dhSearchDebounce;
  searchInput.addEventListener("input", () => {
    clearTimeout(dhSearchDebounce);
    dhSearchDebounce = setTimeout(() => {
      dhCurrentPage = 1;
      dhFetchData(1);
    }, 400);
  });

  prevBtn.addEventListener("click", () => {
    if (dhCurrentPage > 1) dhFetchData(dhCurrentPage - 1);
  });
  nextBtn.addEventListener("click", () => {
    dhFetchData(dhCurrentPage + 1);
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    dhSortState.firstExport = null;
    dhSortState.arriveDate = null;
    dhUpdateSortHeaders();
    dhCurrentPage = 1;
    dhDatePickerRef?._setRange(
      dayjs().subtract(21, "day").format("YYYY-MM-DD"),
      dayjs().format("YYYY-MM-DD"),
      false,
    );
    dhFetchData(1);
  });

  document.getElementById("dhSortFirstExport").addEventListener("click", () => {
    dhSortState.arriveDate = null;
    dhSortState.firstExport =
      dhSortState.firstExport === "asc" ? "desc" : "asc";
    dhUpdateSortHeaders();
    dhCurrentPage = 1;
    dhFetchData(1);
  });

  document.getElementById("dhSortArriveDate").addEventListener("click", () => {
    dhSortState.firstExport = null;
    dhSortState.arriveDate = dhSortState.arriveDate === "asc" ? "desc" : "asc";
    dhUpdateSortHeaders();
    dhCurrentPage = 1;
    dhFetchData(1);
  });
}

// ─── Helper: giới hạn factory select theo user ────────────────────────────
function applyFactoryRestriction(selectEl) {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const userFactory = storedUser?.factory?.toUpperCase();

    // Nếu factory là V0 hoặc V5 → chỉ cho chọn factory đó, disable select
    if (userFactory === "V0" || userFactory === "V5") {
      selectEl.value = userFactory.toLowerCase ? userFactory : userFactory;
      const matchOption = [...selectEl.options].find(
        (o) => o.value.toUpperCase() === userFactory,
      );
      if (matchOption) selectEl.value = matchOption.value;
      selectEl.disabled = true;
    } else {
      selectEl.disabled = false;
    }
  } catch (err) {
    console.error("Lỗi đọc user từ localStorage:", err);
  }
}

// ─── Event History ─────────────────────────────────────────────────────────
let eventDatePickerRef = null;

async function initDelivery(page = 1) {
  const searchInput = document.getElementById("searchTextDelivery");
  const factorySelect = document.getElementById("factorySelect");
  applyFactoryRestriction(factorySelect);
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const tbody = document.getElementById("DeliveryTableBody");

  // Xóa chỉ rows cũ, header không bị ảnh hưởng
  clearRows(tbody, ".eh-table-row");

  const user = await getUserProfile();
  if (!user) {
    alert(t("alerts.loginRequired"));
    globalThis.location.href = "/";
    return;
  }

  const url =
    `/exportmanagement/delivery/history/${factorySelect.value}?page=${page}` +
    `&search=${encodeURIComponent(searchInput.value.trim())}` +
    `&dateFrom=${encodeURIComponent(eventDatePickerRef?.getFrom() || "")}` +
    `&dateTo=${encodeURIComponent(eventDatePickerRef?.getTo() || "")}`;

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

  if (!data.length) {
    showEmpty(tbody, "Không có dữ liệu");
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    window.currentDeliveryPage = result.page;
    return;
  }

  let stt = (result.page - 1) * result.limit + 1;

  data.forEach((d) => {
    const shipmentDate = d.shipment_date
      ? dayjs(d.shipment_date).format("YYYY-MM-DD")
      : "";
    const eventTime = d.event_time
      ? dayjs(d.event_time).format("YYYY-MM-DD HH:mm:ss")
      : "";

    const row = document.createElement("div");
    row.className = "eh-table-row";
    // data-tsv để copy ra tab-separated
    row.dataset.tsv = [
      stt,
      d.qr || "",
      d.mobis_code || "",
      d.model_name || "",
      d.type || "",
      d.target || "",
      d.event_quantity || "",
      shipmentDate,
      d.shipping_method || "",
      d.event_user || "",
      eventTime,
    ].join("\t");

    row.innerHTML = `
      <div class="col-center">${stt++}</div>
      <div class="col-text">${d.qr || ""}</div>
      <div class="col-text">${d.mobis_code || ""}</div>
      <div class="col-text">${d.model_name || ""}</div>
      <div class="col-center">${d.type || ""}</div>
      <div class="col-num">${d.target || ""}</div>
      <div class="col-num">${d.event_quantity || ""}</div>
      <div class="col-center">${shipmentDate}</div>
      <div class="col-center">${d.shipping_method || ""}</div>
      <div class="col-text">${d.event_user || ""}</div>
      <div class="col-center">${eventTime}</div>
    `;
    tbody.appendChild(row);
  });

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
      eventDatePickerRef?._setRange(
        dayjs().subtract(21, "day").format("YYYY-MM-DD"),
        dayjs().format("YYYY-MM-DD"),
        false,
      );
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
  initTabs();

  // Attach copy-as-TSV cho event history
  const ehContainer = document.getElementById("DeliveryTableBody");
  attachCopyTSV(ehContainer, ".eh-table-row");

  // Date range picker cho Event History
  eventDatePickerRef = new DateRangePicker({
    inputId: "deliveryDateRangeText",
    onChange: () => {
      window.currentDeliveryPage = 1;
      initDelivery(1);
      a;
    },
  });

  eventDatePickerRef._setRange(
    dayjs().subtract(21, "day").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
    false,
  );

  try {
    let currentUser = await getUserProfile();
    document.querySelector("app-header")?.setUser(currentUser);
    localStorage.setItem("user", JSON.stringify(currentUser));
    await initDelivery(1);
  } catch (err) {
    console.error("Initialization error:", err);
  }
});
