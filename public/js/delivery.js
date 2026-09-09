import * as XLSX from "./xlsx.js";
import { formatDate } from "../js/utils.js";
import I18n from "/i18n.js";
import Modal from "./modal.js";
import PalletQueue from "./palletQueue.js";
import PalletExport from "./palletExport.js";

const gridBtn = document.getElementById("gridBtn");
const listBtn = document.getElementById("listBtn");
const gridView = document.getElementById("gridView");
const listView = document.getElementById("listView");
const tableHeader = document.getElementById("tableHeader");
const searchInput = document.querySelector(".searchInput");
const importBtn = document.querySelector(".btnImport");
const excelInput = document.getElementById("excelInput");
const cbbFactory = document.querySelector(".factory");
const errorSound = document.getElementById("errorSound");
const viewPalletBtn = document.getElementById("viewPalletBtn");

let data = [];
let user = null;
let factorySelected = "";
let t = (key, params) => key;

const columnMapping = {
  "MOBIS-CODE": "mobiscode",
  MODEL: "modelname",
  분류: "modeltype",
  수량: "target",
  포장: "type",
  "PARTRON ERP-CODE": "partroncode",
  운송방식: "shippingmethod",
  일자: "shipmentdate",
  출하지: "factory",
  "변경 초도품": "firstexport",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStatusText(status) {
  if (!status) return "";
  const key = status.toLowerCase();
  if (key === "run") return t("statusText.run");
  if (key === "complete") return t("statusText.complete");
  if (key === "wait") return t("statusText.wait");
  return status;
}

const FIRST_EXPORT_TTL = 24 * 60 * 60 * 1000;
const FIRST_EXPORT_PREFIX = "firstExport_shown_";

function setExpiry(key, value, ttl) {
  const item = { value, expiry: Date.now() + ttl };
  localStorage.setItem(key, JSON.stringify(item));
  setTimeout(() => localStorage.removeItem(key), ttl);
}

function getExpiry(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const item = JSON.parse(raw);
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function cleanupExpiredFirstExportKeys() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(FIRST_EXPORT_PREFIX)) continue;
    try {
      const item = JSON.parse(localStorage.getItem(key));
      const remaining = item.expiry - Date.now();
      if (remaining <= 0) {
        localStorage.removeItem(key);
      } else {
        setTimeout(() => localStorage.removeItem(key), remaining);
      }
    } catch {
      localStorage.removeItem(key);
    }
  }
}

// ─── Apply language to static DOM elements ────────────────────────────────────
async function applyLang() {
  document.title = t("title");

  // Helper: chỉ cập nhật text node trong link, giữ nguyên SVG icon
  const setLinkText = (selector, text) => {
    const el = document.querySelector(selector);
    if (!el) return;
    let textNode = [...el.childNodes].findLast(
      (n) => n.nodeType === Node.TEXT_NODE,
    );
    if (textNode) {
      textNode.textContent = " " + text;
    } else {
      el.appendChild(document.createTextNode(" " + text));
    }
  };

  setLinkText(".home a", t("nav.home"));
  setLinkText(".delivery a", t("nav.delivery"));
  setLinkText(".history a", t("nav.history"));
  setLinkText(".admin a", t("nav.admin"));

  const cpNavLink = document.querySelector(".change-password a");
  if (cpNavLink) {
    const textNode = [...cpNavLink.childNodes].find(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim(),
    );
    if (textNode) textNode.textContent = " " + t("nav.changePassword");
  }

  const importBtnText = [...importBtn.childNodes].find(
    (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim(),
  );
  if (importBtnText) importBtnText.textContent = " " + t("import");

  if (searchInput) searchInput.placeholder = t("scanQR");

  const listBtnText = [...listBtn.childNodes].find(
    (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim(),
  );
  if (listBtnText) listBtnText.textContent = " " + t("list");

  const gridBtnText = [...gridBtn.childNodes].find(
    (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim(),
  );
  if (gridBtnText) gridBtnText.textContent = " " + t("grid");

  const headerDivs = document.querySelectorAll("#tableHeader > div");
  if (headerDivs.length >= 11) {
    headerDivs[0].textContent = t("admin.delivery.table.stt");
    headerDivs[1].textContent = t("admin.delivery.table.mobisCode");
    headerDivs[2].textContent = t("admin.delivery.table.modelName");
    headerDivs[3].textContent = t("admin.delivery.table.type");
    headerDivs[4].textContent = t("admin.delivery.table.status");
    headerDivs[5].textContent = t("admin.delivery.table.target");
    headerDivs[6].textContent = t("admin.delivery.table.quantity");
    headerDivs[7].textContent = t("admin.delivery.table.shippingDate");
    headerDivs[8].textContent = t("admin.delivery.table.shippingMethod");
    headerDivs[9].textContent = t("admin.delivery.table.firstExport");
    headerDivs[10].textContent = t("admin.delivery.table.arriveDate");
  }

  const cpHeader = document.querySelector(".cp-header h2");
  if (cpHeader) cpHeader.textContent = t("changePasswordModal.title");

  const infoLabels = document.querySelectorAll(".cp-info-item .cp-label");
  if (infoLabels.length >= 3) {
    infoLabels[0].textContent = t("changePasswordModal.infoSection.username");
    infoLabels[1].textContent = t("changePasswordModal.infoSection.fullName");
    infoLabels[2].textContent = t("changePasswordModal.infoSection.role");
  }

  const cpFormTitle = document.querySelector(".cp-form h3");
  if (cpFormTitle)
    cpFormTitle.textContent = t("changePasswordModal.formSection.title");

  const formLabels = document.querySelectorAll(".cp-field label");
  if (formLabels.length >= 2) {
    formLabels[0].textContent = t(
      "changePasswordModal.formSection.newPasswordLabel",
    );
    formLabels[1].textContent = t(
      "changePasswordModal.formSection.confirmPasswordLabel",
    );
  }

  const cpNewPass = document.getElementById("cpNewPass");
  if (cpNewPass)
    cpNewPass.placeholder = t(
      "changePasswordModal.formSection.newPasswordPlaceholder",
    );

  const cpConfirmPass = document.getElementById("cpConfirmPass");
  if (cpConfirmPass)
    cpConfirmPass.placeholder = t(
      "changePasswordModal.formSection.confirmPasswordPlaceholder",
    );

  const cpBtnText = document.getElementById("cpBtnText");
  if (cpBtnText)
    cpBtnText.textContent = t("changePasswordModal.formSection.submitButton");
}

// ─── API Operations ───────────────────────────────────────────────────────────
async function getUserProfile() {
  const res = await fetch("/exportmanagement/profile", {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json();
  return data.user;
}

function playErrorSound() {
  if (errorSound) {
    errorSound.currentTime = 0;
    errorSound.play().catch(() => {});
  }
}

async function getAll() {
  try {
    const response = await fetch(
      `/exportmanagement/delivery/${factorySelected}`,
    );
    const result = await response.json();
    data = [...result];
    renderList();
    renderGrid();
  } catch (error) {
    Modal.show({
      type: "error",
      title: t("modal.title.error"),
      message: t("delivery.alerts.fetchError"),
    });
    console.error("Error fetching data:", error);
  }
}

function validateShipmentDate(value, rowIndex) {
  if (value === null || value === undefined || value === "") return false;

  let dateObj = null;

  if (typeof value === "number") {
    dateObj = new Date(Date.UTC(1899, 11, 30 + value));
  } else if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return false;
    dateObj = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  } else if (typeof value === "string") {
    const str = value.trim();
    const match = str.match(/^(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,4})$/);
    if (!match) return false;

    const part1 = parseInt(match[1]);
    const part2 = parseInt(match[2]);
    const part3 = parseInt(match[3]);
    let day, month, year;

    if (part1 > 1000) {
      year = part1;
      month = part2;
      day = part3;
    } else if (part3 > 1000) {
      day = part1;
      month = part2;
      year = part3;
    } else if (part1 > 12) {
      day = part1;
      month = part2;
      year = part3;
    } else {
      day = part1;
      month = part2;
      year = part3;
    }

    dateObj = new Date(year, month - 1, day);
  }

  if (!dateObj || Number.isNaN(dateObj.getTime())) return false;

  const checkDate = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate(),
  );
  if (
    checkDate.getDate() !== dateObj.getDate() ||
    checkDate.getMonth() !== dateObj.getMonth() ||
    checkDate.getFullYear() !== dateObj.getFullYear()
  )
    return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dateObj < today) return false;

  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function validateRow(row, rowIndex) {
  for (const [key, value] of Object.entries(row)) {
    if (
      key !== "firstexport" &&
      (value === null || value === undefined || value === "")
    ) {
      throw new Error(
        t("delivery.alerts.emptyColumn", { row: rowIndex + 2, column: key }),
      );
    }
    switch (key) {
      case "targetquantity": {
        const num = Number(value);
        if (Number.isNaN(num) || num <= 0)
          throw new Error(
            t("delivery.alerts.invalidValue", {
              row: rowIndex + 2,
              column: key,
              value,
            }),
          );
        row[key] = num;
        break;
      }
      case "quantity": {
        const num = Number(value);
        if (Number.isNaN(num) || num < 0)
          throw new Error(
            t("delivery.alerts.invalidValue", {
              row: rowIndex + 2,
              column: key,
              value,
            }),
          );
        row[key] = num;
        break;
      }
      default:
        continue;
    }
  }

  if (row.targetquantity < row.quantity) {
    Modal.show({
      type: "warning",
      title: t("modal.title.warning"),
      message: t("delivery.alerts.qtyExceedsTarget", { row: rowIndex + 2 }),
      autoClose: true,
      duration: 2500,
    });
  }
}

async function checkAirFirstExportConflict(items) {
  try {
    const response = await fetch(
      "/exportmanagement/delivery/checkAirFirstExportConflict",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      },
    );
    if (!response.ok)
      return { errors: [], errorsConflictSea: [], warnings: [] };
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi kiểm tra AIR first export conflict:", error);
    return { errors: [], errorsConflictSea: [], warnings: [] };
  }
}

async function addDeliveryAndHistory(rows) {
  try {
    const res = await fetch(`/exportmanagement/delivery/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user.username, deliveries: rows }),
    });
    const result = await res.json();
    if (!res.ok) {
      Modal.show({
        type: "error",
        title: t("modal.title.error"),
        message: result.message,
      });
      return;
    }
    Modal.show({
      type: "success",
      title: t("modal.title.success"),
      message: result.message,
      autoClose: true,
      duration: 2500,
    });
    await getAll();
  } catch (err) {
    Modal.show({
      type: "error",
      title: t("modal.title.error"),
      message: err.message,
    });
  }
}

function validateSheet(workbook) {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const currentValue = Number(`${year}${month}`);
  return workbook.SheetNames.filter((sheetName) => {
    const parts = sheetName.split(".");
    if (parts.length !== 2) return false;
    const [sheetMonth, sheetYear] = parts;
    const sheetValue = Number(`${sheetYear}${sheetMonth.padStart(2, "0")}`);
    return sheetValue >= currentValue;
  });
}

function validateExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const seen = new Set();
        const validRows = [];
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const validSheets = validateSheet(workbook);
        if (validSheets.length === 0)
          return reject(new Error(t("delivery.alerts.invalidSheet")));

        const requiredColumns = Object.keys(columnMapping);

        for (const sheetName of validSheets) {
          const sheet = workbook.Sheets[sheetName];
          let headerRowIndex = null;
          let headerRow = null;
          const rawRows = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: "",
          });

          for (let i = 0; i < rawRows.length; i++) {
            const row = rawRows[i];
            if (requiredColumns.every((col) => row.includes(col))) {
              headerRowIndex = i;
              headerRow = row;
              break;
            }
          }

          if (headerRowIndex === -1 || headerRowIndex === null) {
            reject(new Error(t("delivery.alerts.noHeader")));
            return;
          }

          const filteredHeader = headerRow.filter((col) =>
            requiredColumns.includes(col),
          );
          const columnIndexes = filteredHeader.map((col) =>
            headerRow.indexOf(col),
          );
          const mappedHeader = filteredHeader.map((col) => columnMapping[col]);

          const rows = rawRows
            .slice(headerRowIndex + 1)
            .map((row) => {
              const obj = {};
              columnIndexes.forEach((colIndex, i) => {
                const key = mappedHeader[i];
                let value = row[colIndex] !== undefined ? row[colIndex] : "";
                if (typeof value === "string") value = value.trim();
                obj[key] = value;
              });
              return obj;
            })
            .filter((row) =>
              Object.values(row).some(
                (v) => v !== "" && v !== null && v !== undefined,
              ),
            );

          for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            const keySignature = [
              row.mobiscode,
              row.shipmentdate,
              row.shippingmethod,
              row.type,
              row.factory,
            ]
              .map((v) =>
                String(v || "")
                  .trim()
                  .toLowerCase(),
              )
              .join("|");
            if (seen.has(keySignature)) continue;
            seen.add(keySignature);
            const result = validateShipmentDate(row.shipmentdate, index);
            if (result === false) continue;
            row.shipmentdate = result;
            row.quantity = 0;
            row.firstexport = String(row.firstexport ?? "").trim();
            validateRow(row, index);
            validRows.push(row);
          }
        }

        if (validRows.length < 1)
          return reject(new Error(t("delivery.alerts.emptyFile")));
        resolve(validRows);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    reader.onerror = (err) =>
      reject(err instanceof Error ? err : new Error(String(err)));
    reader.readAsArrayBuffer(file);
  });
}

function renderList() {
  const sortedData = [...data].sort((a, b) => {
    const aIsRun = a.status.toLowerCase() === "run";
    const bIsRun = b.status.toLowerCase() === "run";
    if (aIsRun && !bIsRun) return -1;
    if (!aIsRun && bIsRun) return 1;
    return 0;
  });

  const tableHeader = document.getElementById("tableHeader");
  const existingRows = listView.querySelectorAll(".table-row");
  existingRows.forEach((r) => r.remove());

  sortedData.forEach((item, index) => {
    const firstExportHtml =
      item.first_export == 1
        ? `<span class="first-export-badge"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5"/></svg></span>`
        : "";
    const shipmentDate = item.shipment_date
      ? new Date(item.shipment_date).toLocaleDateString("vi-VN")
      : "";
    const arriveDate =
      item.first_export == 1 &&
      item.arrive_date !== null &&
      item.arrive_date !== undefined &&
      item.arrive_date !== ""
        ? `${item.arrive_date}`
        : "";

    const row = document.createElement("div");
    row.className = `table-row ${item.status.toLowerCase() === "run" ? "running" : ""}`;
    row.innerHTML = `
      <div class="col-center">${index + 1}</div>
      <div class="col-text">${item.mobis_code}</div>
      <div class="col-text">${item.model_name}</div>
      <div class="col-center">${item.type}</div>
      <div class="col-center"><span class="status-badge ${item.status.toLowerCase()}">${getStatusText(item.status)}</span></div>
      <div class="col-num">${item.target}</div>
      <div class="col-num">${item.quantity}</div>
      <div class="col-center">${shipmentDate}</div>
      <div class="col-center">${item.shipping_method}</div>
      <div class="col-center">${firstExportHtml}</div>
      <div class="col-num">${arriveDate ? `<span style="color:red;font-weight:900;font-size:35px;line-height: 0;">${arriveDate}</span>` : ""}</div>
    `;
    listView.appendChild(row);
  });
}

function renderGrid() {
  const sortedData = [...data].sort((a, b) => {
    const aIsRun = a.status.toLowerCase() === "run";
    const bIsRun = b.status.toLowerCase() === "run";
    if (aIsRun && !bIsRun) return -1;
    if (!aIsRun && bIsRun) return 1;
    return 0;
  });

  gridView.innerHTML = sortedData
    .map((item) => {
      const firstExportHtml =
        item.first_export == 1
          ? `<span class="first-export-badge"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>`
          : "";
      const shipmentDate = item.shipment_date
        ? new Date(item.shipment_date).toLocaleDateString("vi-VN")
        : "";
      const arriveDate =
        item.first_export == 1 &&
        item.arrive_date !== null &&
        item.arrive_date !== undefined &&
        item.arrive_date !== ""
          ? `${item.arrive_date}`
          : "";

      return `
      <div class="card ${item.status === "Run" ? "running" : ""}">
        <div class="card-header"><strong>${item.model_name}</strong></div>
        <div class="card-body">
          <div><strong>${t("admin.delivery.table.mobisCode")}:</strong> ${item.mobis_code}</div>l
          <div><strong>${t("admin.delivery.table.type")}:</strong> ${item.type}</div>
          <div><strong>${t("admin.delivery.table.target")}:</strong> ${item.target}</div>
          <div><strong>${t("admin.delivery.table.quantity")}:</strong> ${item.quantity}</div>
          <strong>${t("admin.delivery.table.status")}:</strong> <div class="status-badge ${item.status.toLowerCase()}"> ${getStatusText(item.status)}</div>
          <div><strong>${t("admin.delivery.table.shippingDate")}:</strong> ${shipmentDate}</div>
          <div><strong>${t("admin.delivery.table.shippingMethod")}:</strong> ${item.shipping_method}</div>
          <div><strong>${t("admin.delivery.table.firstExport")}:</strong> ${firstExportHtml}</div>
          <div><strong>${t("admin.delivery.table.arriveDate")}:</strong> ${arriveDate ? `<span style="color:red;font-weight:900;font-size:16px">${arriveDate}</span>` : ""}</div>
        </div>
      </div>
    `;
    })
    .join("");
}

// ─── Event Listeners ──────────────────────────────────────────────────────────
gridBtn.addEventListener("click", () => {
  gridBtn.classList.add("active");
  listBtn.classList.remove("active");
  gridView.classList.add("active");
  listView.classList.add("hidden");
  listView.classList.remove("active");
  tableHeader.classList.add("hidden");
});

listBtn.addEventListener("click", () => {
  listBtn.classList.add("active");
  gridBtn.classList.remove("active");
  listView.classList.add("active");
  listView.classList.remove("hidden");
  gridView.classList.remove("active");
  tableHeader.classList.remove("hidden");
});

importBtn.addEventListener("click", () => excelInput.click());

excelInput.addEventListener("change", async () => {
  const file = excelInput.files[0];
  if (!file) {
    Modal.show({
      type: "error",
      title: t("modal.title.error"),
      message: t("delivery.alerts.selectExcel"),
      showClose: true,
    });
    return;
  }
  try {
    const rows = await validateExcelFile(file);

    const airItems = rows
      .filter((r) => r.shippingmethod?.toUpperCase() === "AIR")
      .map((r) => ({
        mobiscode: r.mobiscode,
        shipmentdate: r.shipmentdate,
        firstexport: r.firstexport,
        factory: r.factory,
      }));

    if (airItems.length > 0) {
      const { errors, errorsConflictSea, warnings } =
        await checkAirFirstExportConflict(airItems);

      if (errors.length > 0) {
        const first = errors[0];

        await new Promise((resolve) => {
          Modal.showSeaAlert({
            type: "error",
            title: t("delivery.alerts.firstExportAirInvalid", {
              mobiscode: first.mobiscode,
              seaShipmentDate: first.sea_shipment_date,
            }),
            mobiscode: first.mobiscode,
            days: first.days_left,
            daysLabel: t("delivery.alerts.daysLeftLabel"),
            confirmLabel: t("modal.closeButton"),
            onClose: resolve,
          });
        });

        return;
      }

      if (errorsConflictSea.length > 0) {
        const first = errorsConflictSea[0];
        await new Promise((resolve) => {
          Modal.showSeaAlert({
            type: "error",
            title: t("delivery.alerts.airNotArrivedErrorTitle"),
            mobiscode: first.mobiscode,
            days: first.days_left,
            daysLabel: t("delivery.alerts.daysLeftLabel"),
            confirmLabel: t("modal.closeButton"),
            onClose: resolve,
          });
        });
        return;
      }

      if (warnings.length > 0) {
        for (const w of warnings) {
          const confirmed = await Modal.showSeaConfirm({
            type: "warning",
            title: t("delivery.alerts.airNotArrivedWarningTitle"),
            mobiscode: w.mobiscode,
            days: w.days_left,
            daysLabel: t("delivery.alerts.daysLeftLabel"),
          });
          if (!confirmed) return; // chỉ cần 1 cái không xác nhận -> hủy import
        }
      }
    }

    await addDeliveryAndHistory(rows);
  } catch (err) {
    Modal.show({
      type: "error",
      title: t("modal.title.error"),
      message: err.message,
      showClose: true,
    });
  } finally {
    excelInput.value = "";
  }
});

async function checkQrExist(factory, qr) {
  try {
    const response = await fetch(
      `exportmanagement/qr/getvalue?factory=${factory}&qrvalue=${qr}`,
    );
    if (!response.ok) {
      console.log(response.message);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Lỗi khi gọi API checkQrExist:", error);
    return null;
  }
}

async function findDelivery(qrData) {
  try {
    const response = await fetch(
      `exportmanagement/qr/${factorySelected}/${qrData.mobiscode}/${qrData.type}`,
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function checkFirstExport(mobiscode, factory) {
  try {
    const response = await fetch(
      `exportmanagement/firstExport/${mobiscode}/${factory}`,
    );
    if (!response.ok) return { firstExport: false };
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Lỗi khi kiểm tra firstExport:", error);
    return { firstExport: false };
  }
}

function getQrData(qr) {
  const parts = qr.split("-");
  switch (parts.length) {
    case 7: {
      if (!Number(parts[3])) throw new Error(t("delivery.alerts.invalidQr"));
      return { mobiscode: parts[2], quantity: parts[3], type: parts[4] };
    }
    case 8: {
      if (!Number(parts[4])) throw new Error(t("delivery.alerts.invalidQr"));
      return {
        mobiscode: parts[2] + parts[3],
        quantity: parts[4],
        type: parts[5],
      };
    }
    case 9: {
      if (!Number(parts[5])) throw new Error(t("delivery.alerts.invalidQr"));
      const startsWithNumber = /^\d/.test(parts[2]);
      return {
        mobiscode: startsWithNumber
          ? parts[2] + parts[3] + parts[4]
          : parts[3] + parts[4],
        quantity: parts[5],
        type: parts[6],
      };
    }
    default:
      throw new Error(t("delivery.alerts.invalidQr"));
  }
}

async function updateDelivery(username, factory, delivery, qr) {
  try {
    const response = await fetch("exportmanagement/delivery/update/quantity", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, factory, delivery, qr }),
    });
    if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.log(error);
    return { status: 500, message: t("delivery.alerts.updateFailed") };
  }
}

let isProcessing = false;

searchInput.addEventListener("keydown", async (e) => {
  if (e.key !== "Enter") return;
  if (isProcessing) return;

  isProcessing = true;
  try {
    const qrValue = searchInput.value.trim();
    if (!qrValue) return;

    const qrPattern = /^[A-Za-z0-9- ]+$/;
    if (!qrPattern.test(qrValue)) {
      playErrorSound();
      Modal.show({
        type: "error",
        title: t("modal.title.error"),
        message: t("delivery.alerts.invalidQr"),
        showClose: true,
      });
      return;
    }

    const invalidLength = qrValue.length < 38 || qrValue.length > 48;
    const validPrefix =
      qrValue.startsWith("R7A8") ||
      qrValue.startsWith("N-") ||
      qrValue.startsWith("NQ5");
    const validDash = qrValue.slice(-5, -4) === "-";

    if (invalidLength || !validPrefix || !validDash) {
      playErrorSound();
      Modal.show({
        type: "error",
        title: t("modal.title.error"),
        message: t("delivery.alerts.invalidQr"),
        showClose: true,
      });
      return;
    }

    const qrData = getQrData(qrValue);

    const isQrExist = await checkQrExist(factorySelected, qrValue);
    if (isQrExist) {
      playErrorSound();
      Modal.show({
        type: "error",
        title: t("modal.title.error"),
        message: t("delivery.alerts.qrExists"),
        showClose: true,
      });
      return;
    }

    const delivery = await findDelivery(qrData);
    if (!delivery) {
      playErrorSound();
      Modal.show({
        type: "error",
        title: t("modal.title.error"),
        message: t("delivery.alerts.noMatchQr"),
        showClose: true,
      });
      return;
    }

    const isFirstExport = await checkFirstExport(
      qrData.mobiscode,
      factorySelected,
    );

    if (
      isFirstExport.firstExport &&
      isFirstExport.seaData?.arrive_date &&
      delivery.shipping_method === "AIR"
    ) {
      const storageKey = `${FIRST_EXPORT_PREFIX}${qrData.mobiscode}_${isFirstExport.seaData.shipment_date}`;
      const alreadyShown = getExpiry(storageKey);

      if (!alreadyShown) {
        const daysLeft = Number(isFirstExport.seaData.arrive_date);
        setExpiry(storageKey, "1", FIRST_EXPORT_TTL);
        Modal.showSeaAlert({
          title: t("delivery.alerts.notificationTitle"),
          mobiscode: qrData.mobiscode,
          days: daysLeft,
          daysLabel: t("delivery.alerts.daysLeftLabel"),
          onClose: () => searchInput?.focus(),
        });
      }
    }

    let newQuantity = Number(delivery.quantity) + Number(qrData.quantity);
    if (newQuantity > delivery.target) {
      playErrorSound();
      Modal.show({
        type: "error",
        title: t("modal.title.error"),
        message: t("delivery.alerts.targetExceeded"),
        showClose: true,
      });
      return;
    }

    if (newQuantity === delivery.target) {
      delivery.status = "Complete";
      delivery.complete_time = formatDate(new Date());
    } else {
      delivery.status = "Run";
    }

    delivery.quantity = newQuantity;
    delivery.shipment_date = formatDate(delivery.shipment_date);

    const response = await updateDelivery(
      user.username,
      factorySelected,
      delivery,
      qrValue,
    );
    if (response.status !== 200) {
      Modal.show({
        type: "error",
        title: t("modal.title.error"),
        message: response.message,
      });
      return;
    }

    // push box vừa scan thành công vào pallet queue
    PalletQueue.addScannedBox({
      qr: qrValue,
      partron_code: delivery.partron_code,
      quantity: qrData.quantity,
      mobis_code: qrData.mobiscode,
      model_name: delivery.model_name,
      factory: factorySelected,
    });

    searchInput.value = "";
    await getAll();
  } catch (error) {
    playErrorSound();
    Modal.show({
      type: "error",
      title: t("modal.title.error"),
      message: error.message || String(error),
      showClose: true,
    });
    searchInput.value = "";
  } finally {
    isProcessing = false;
  }
});

cbbFactory.addEventListener("change", async () => {
  factorySelected = cbbFactory.value.toLowerCase();
  await getAll();
});

viewPalletBtn.addEventListener("click", () => {
  PalletExport.openPalletModal();
});

cbbFactory.addEventListener("change", async () => {
  const newFactory = cbbFactory.value.toLowerCase();

  const queue = PalletQueue.getQueue();
  if (queue && queue.items.length > 0 && newFactory !== factorySelected) {
    const confirmed = await Modal.showConfirm({
      type: "warning",
      title: t("modal.title.warning"),
      message: t("pallet.alerts.switchFactoryWarning"),
      yesLabel: t("modal.yesButton"),
      noLabel: t("modal.noButton"),
    });
    if (!confirmed) {
      cbbFactory.value = factorySelected.toUpperCase();
      return;
    }
  }

  factorySelected = newFactory;
  await getAll();
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap() {
  await I18n.init("en");
  t = (key, params) => I18n.t(key, params);
  Modal.init(t);
  PalletExport.init(t, () => factorySelected);
  cleanupExpiredFirstExportKeys();

  user = await getUserProfile();
  document.querySelector("app-header")?.setUser(user);

  if (user.role.toLowerCase() === "user") {
    searchInput.classList.add("visible");
    cbbFactory.value = user.factory;
    cbbFactory.disabled = true;
  } else {
    importBtn.classList.add("visible");
    searchInput.classList.add("visible");
  }
  factorySelected = cbbFactory.value.toLowerCase();

  await applyLang();
  await getAll();
}

await bootstrap();
