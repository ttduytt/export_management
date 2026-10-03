import I18n from "/i18n.js";
import Modal from "./modal.js";
import { formatDate } from "./utils.js";

// ─── DOM Elements ──────────────────────────────────────────────────────────
const endPalletBtn = document.getElementById("endPalletBtn");
const qrInput = document.getElementById("qrInput");
const scanTableBody = document.getElementById("scanTableBody");


const lblErpTable = document.getElementById("lblErpTable");
const lblTotalQty = document.getElementById("lblTotalQty");
const lblTotalBox = document.getElementById("lblTotalBox");
import { errorSoundBase64 } from "./audio-data.js";
const errorSound = new Audio(`data:audio/mp3;base64,${errorSoundBase64}`);

// ─── State ─────────────────────────────────────────────────────────────────
let palletItems = [];
let activePalletNo = 1;
let lastScannedQr = null;

let user = null;
let factorySelected = "";
let data = []; // delivery list from server
let isProcessing = false;
let t = (key) => key;

// ─── File System Access API State ──────────────────────────────────────────
let exportDirHandle = null;
const DB_NAME = 'FileStorageDB_ScanPallet';
const STORE_NAME = 'handles';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveDirectoryHandle(handle) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(handle, 'exportDir');
}

async function getStoredDirectoryHandle() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get('exportDir');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function ensureExportDirectory() {
  if (typeof window.showDirectoryPicker !== "function") {
    console.warn("API không hỗ trợ hoặc bị chặn. Chuyển sang tải file thông thường.");
    return; // Dừng việc lấy quyền ghi thư mục, chuyển sang chế độ fallback
  }

  if (!exportDirHandle) {
    exportDirHandle = await getStoredDirectoryHandle();
  }
  if (!exportDirHandle) {
    exportDirHandle = await window.showDirectoryPicker();
    await saveDirectoryHandle(exportDirHandle);
  } else {
    const permission = await exportDirHandle.requestPermission({ mode: 'readwrite' });
    if (permission !== 'granted') {
      throw new Error("Không được cấp quyền ghi vào thư mục xuất file!");
    }
  }
}

// ─── Bootstrap ─────────────────────────────────────────────────────────────
async function applyLang() {
  const el = (id) => document.getElementById(id);
  if (el("th-scan-stt")) el("th-scan-stt").textContent = t("history.table.stt");
  if (el("th-scan-qr")) el("th-scan-qr").textContent = t("history.table.qr");
  if (el("th-scan-mobis")) el("th-scan-mobis").textContent = t("admin.modelSpec.table.mobisCode");
  if (el("th-scan-type")) el("th-scan-type").textContent = t("admin.modelSpec.table.modelType");
  if (el("th-scan-partron")) el("th-scan-partron").textContent = t("admin.modelSpec.table.partronCode");
  if (el("th-scan-name")) el("th-scan-name").textContent = t("admin.modelSpec.table.modelName");
  if (el("th-scan-user")) el("th-scan-user").textContent = t("history.table.eventUser");
  if (el("th-scan-time")) el("th-scan-time").textContent = t("history.table.eventTime");
}

async function bootstrap() {
  await I18n.init("en");
  t = (key, params) => I18n.t(key, params);
  await applyLang();
  Modal.init(t);

  user = await getUserProfile();
  if (user) {
    factorySelected = user.factory?.toLowerCase() || "";
  }

  await getAllDeliveries();

  qrInput.addEventListener("keydown", handleQrInput);
  endPalletBtn.addEventListener("click", handleEndPallet);

  updateUI();
}

// ─── API helpers (same logic as delivery.js) ───────────────────────────────
async function getUserProfile() {
  try {
    const res = await fetch("/exportmanagement/profile", {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json();
    return data.user;
  } catch (err) {
    console.error("Failed to get user profile:", err);
    return null;
  }
}

async function getAllDeliveries() {
  try {
    const res = await fetch(`/exportmanagement/delivery/${factorySelected}`);
    if (res.ok) {
      data = await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch deliveries:", err);
  }
}

async function checkQrExistInPallet(qr) {
  try {
    const response = await fetch(
      `exportmanagement/history-pallet/check?qr=${encodeURIComponent(qr)}`,
    );
    if (!response.ok) {
      console.error("checkQrExistInPallet HTTP error:", response.status);
      return false;
    }
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error("Lỗi khi gọi API checkQrExistInPallet:", error);
    return false;
  }
}

async function savePalletHistory(items, eventUser) {
  try {
    const response = await fetch("exportmanagement/history-pallet/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          qr: item.qr,
          mobis_code: item.mobis_code,
          model_type: item.model_type || "",
          partron_code: item.partron_code || "",
          model_name: item.model_name || "",
        })),
        event_user: eventUser,
      }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi lưu history_pallet:", error);
    throw error;
  }
}

async function getDeliverySpec(mobiscode) {
  try {
    const response = await fetch(
      `exportmanagement/delivery-spec/by-mobis/${encodeURIComponent(mobiscode)}`,
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi gọi API getDeliverySpec:", error);
    return null;
  }
}

// ─── QR parsing (same logic as delivery.js) ────────────────────────────────
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


function playErrorSound() {
  if (errorSound) {
    errorSound.currentTime = 0;
    errorSound.play().catch(() => { });
  }
}

// ─── QR Scan handler (validation logic from delivery.js) ───────────────────
async function handleQrInput(e) {
  if (e.key !== "Enter") return;
  if (isProcessing) return;

  const qrValue = qrInput.value.trim();
  if (!qrValue) return;

  isProcessing = true;

  try {
    // 1. Validate format
    const qrPattern = /^[A-Za-z0-9- ]+$/;
    if (!qrPattern.test(qrValue)) {
      playErrorSound();
      Modal.show({ type: "error", title: t("modal.title.error"), message: t("delivery.alerts.invalidQr"), showClose: true });
      return;
    }

    const invalidLength = qrValue.length < 37 || qrValue.length > 48;
    const validPrefix =
      qrValue.startsWith("R7A8") ||
      qrValue.startsWith("N-") ||
      qrValue.startsWith("NQ5");
    const validDash = qrValue.slice(-5, -4) === "-";

    if (invalidLength || !validPrefix || !validDash) {
      playErrorSound();
      Modal.show({ type: "error", title: t("modal.title.error"), message: t("delivery.alerts.invalidQr"), showClose: true });
      return;
    }

    // 2. Parse QR data
    const qrData = getQrData(qrValue);

    // 3. Check duplicate in current pallet
    if (palletItems.some((item) => item.qr === qrValue)) {
      playErrorSound();
      Modal.show({
        type: "error",
        title: t("modal.title.error"),
        message: "Mã QR này đã được quét trong pallet hiện tại!",
        autoClose: true,
        duration: 2000,
      });
      return;
    }

    // 4. Check if QR already exists in history_pallet
    const isQrExist = await checkQrExistInPallet(qrValue);
    if (isQrExist) {
      playErrorSound();
      Modal.show({ type: "error", title: t("modal.title.error"), message: t("delivery.alerts.qrExists"), showClose: true });
      return;
    }

    // 5. Lookup delivery_spec for model_type, partron_code, model_name
    const spec = await getDeliverySpec(qrData.mobiscode);
    if (!spec) {
      playErrorSound();
      Modal.show({
        type: "error",
        title: t("modal.title.error"),
        message: `Mobis code "${qrData.mobiscode}" không tồn tại trong Delivery Spec!`,
        showClose: true,
      });
      return;
    }

    // 9. Add to pallet items
    const newItem = {
      qr: qrValue,
      mobis_code: qrData.mobiscode,
      model_type: spec?.model_type || "",
      partron_code: spec?.partron_code || "",
      model_name: spec?.model_name || "",
      quantity: Number(qrData.quantity),
      event_user: user?.username || "Unknown",
      factory: factorySelected,
      scanned_at: new Date(Date.now() + 7 * 60 * 60 * 1000), // Giờ Việt Nam (UTC+7)
    };

    palletItems.push(newItem);
    lastScannedQr = qrValue;

    updateUI();

  } catch (err) {
    playErrorSound();
    Modal.show({ type: "error", title: t("modal.title.error"), message: err.message || String(err), showClose: true });
  } finally {
    qrInput.value = "";
    isProcessing = false;
    qrInput.focus();
  }
}

// ─── UI Update ─────────────────────────────────────────────────────────────
function updateUI() {
  // Left Panel: scanned QR list
  endPalletBtn.disabled = palletItems.length === 0;

  scanTableBody.innerHTML = "";

  palletItems.forEach((item, index) => {
    const tr = document.createElement("tr");
    const timeStr = item.scanned_at.toISOString().replace("T", " ").substring(0, 19);

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td class="qr-code-cell">${item.qr}</td>
      <td class="part-number-cell">${item.mobis_code}</td>
      <td>${item.model_type || ""}</td>
      <td>${item.partron_code || ""}</td>
      <td>${item.model_name || ""}</td>
      <td>${item.event_user || ""}</td>
      <td style="text-align: right;">${timeStr}</td>
    `;
    scanTableBody.appendChild(tr);
  });

  // Auto-scroll to the bottom
  const tableContainer = document.querySelector(".table-container");
  if (tableContainer) {
    tableContainer.scrollTop = tableContainer.scrollHeight;
  }

  // Right Panel: label preview (same grouping logic as palletQueue.groupByPartronCode)

  const groups = groupByPartronCode(palletItems);
  const totalQty = palletItems.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const totalBox = palletItems.length;

  if (groups.length === 0) {
    lblErpTable.innerHTML = "";
  } else {
    lblErpTable.innerHTML = groups
      .map(
        (g) => `
      <tr>
        <td style="border-right: 1px solid black; width: 60%;">${g.partron_code}</td>
        <td class="sl-erp-qty">${g.totalQuantity}</td>
      </tr>
    `,
      )
      .join("");
  }

  lblTotalQty.textContent = totalQty;
  lblTotalBox.textContent = totalBox;
}

// ─── Group items by partron_code (same as palletQueue.js) ──────────────────
function groupByPartronCode(items) {
  const map = new Map();
  for (const item of items) {
    const key = item.partron_code || "(chưa có ERP code)";
    if (!map.has(key)) {
      map.set(key, { partron_code: key, totalQuantity: 0, boxes: [] });
    }
    const group = map.get(key);
    group.totalQuantity += Number(item.quantity) || 0;
    group.boxes.push({
      qr: item.qr,
      quantity: item.quantity,
      scannedAt: item.scanned_at,
    });
  }
  return [...map.values()];
}

// ─── End Pallet ────────────────────────────────────────────────────────────
async function handleEndPallet() {
  if (palletItems.length === 0) return;

  const confirmed = await Modal.showConfirm({
    type: "info",
    title: "Confirm Export",
    message: `Are you sure you want to export this pallet?`,
    yesLabel: "SAVE",
    noLabel: "CANCEL",
  });

  if (!confirmed) return;

  try {
    await ensureExportDirectory();
  } catch (err) {
    if (err.name !== 'AbortError') {
      Modal.show({ type: "error", title: "Lỗi", message: err.message, showClose: true });
    }
    return;
  }

  try {
    endPalletBtn.disabled = true;

    const groups = groupByPartronCode(palletItems);
    const totalQuantity = palletItems.reduce(
      (sum, i) => sum + (Number(i.quantity) || 0),
      0,
    );
    const totalBox = palletItems.length;

    // Lưu file Excel trước, nếu thất bại sẽ throw error và không chạy tiếp xuống dưới (rollback)
    await buildAndDownloadExcel(groups, totalQuantity, totalBox);

    // Lưu Excel thành công mới lưu vào DB
    const eventUser = user?.username || "Unknown";
    await savePalletHistory(palletItems, eventUser);

    // Reset for next pallet
    palletItems = [];
    lastScannedQr = null;
    activePalletNo++;

    qrInput.value = "";
    qrInput.focus();

    updateUI();

    Modal.show({
      type: "success",
      title: "Thành công",
      message: "Đã xuất Pallet thành công!",
      autoClose: true,
      duration: 2000,
    });
  } catch (error) {
    console.error("Lỗi quá trình lưu Pallet:", error);
    Modal.show({
      type: "error",
      title: "Lỗi",
      message: "Lỗi lưu file hoặc DB: " + error.message,
      showClose: true,
    });
  } finally {
    endPalletBtn.disabled = palletItems.length === 0;
  }
}

// ─── Excel export (same layout as palletExport.js) ─────────────────────────
async function buildAndDownloadExcel(groups, totalQuantity, totalBox) {
  const ExcelJS = window.ExcelJS;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Label");

  // Thiết lập trang in (Print Setup)
  sheet.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    horizontalCentered: true,
    verticalCentered: true,
    margins: {
      left: 0.25, right: 0.25,
      top: 0.75, bottom: 0.75,
      header: 0.3, footer: 0.3
    }
  };

  sheet.columns = [{ width: 4 }, { width: 25 }, { width: 40 }, { width: 45 }];

  const boldCenter = { bold: true, size: 18 };
  const centerAlign = { vertical: "middle", horizontal: "center" };
  const leftAlign = { vertical: "middle", horizontal: "left", wrapText: true };
  const ROW_HEIGHT = 100;
  const thinBorder = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  let r = 1;

  // SHIPPING LABEL
  sheet.mergeCells(`B${r}:D${r}`);
  sheet.getCell(`B${r}`).value = "SHIPPING LABEL";
  sheet.getCell(`B${r}`).font = { bold: true, size: 18 };
  sheet.getCell(`B${r}`).alignment = centerAlign;
  r++;

  // PALLET NO
  sheet.mergeCells(`B${r}:D${r}`);
  sheet.getCell(`B${r}`).value = `PALLET NO.`;
  sheet.getCell(`B${r}`).font = { bold: true, size: 30 };
  sheet.getCell(`B${r}`).alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(r).height = 100;
  r++;

  // SHIP FROM
  sheet.getCell(`B${r}`).value = "SHIP FROM";
  sheet.getCell(`B${r}`).font = { bold: true, size: 18 };
  sheet.getCell(`B${r}`).alignment = { vertical: "middle", horizontal: "left" };
  sheet.mergeCells(`C${r}:D${r}`);
  sheet.getCell(`C${r}`).value =
    "Patron VINA\nLot 11, Khai Quang Industrial Zone, Vinh Phuc Ward, Phu Tho Province, Vietnam";
  sheet.getCell(`C${r}`).font = { bold: true, size: 18 };
  sheet.getCell(`C${r}`).alignment = leftAlign;
  sheet.getRow(r).height = 120;
  r++;

  // SHIP TO
  sheet.getCell(`B${r}`).value = "SHIP TO";
  sheet.getCell(`B${r}`).font = { bold: true, size: 18 };
  sheet.getCell(`B${r}`).alignment = { vertical: "middle", horizontal: "left" };
  sheet.mergeCells(`C${r}:D${r}`);
  sheet.getCell(`C${r}`).value =
    "PARTRON CO.,LTD\n22, Samsung 1-ro 2-gil,, Hwaseong-si, Gyeonggi-do, Korea";
  sheet.getCell(`C${r}`).font = { bold: true, size: 18 };
  sheet.getCell(`C${r}`).alignment = leftAlign;
  sheet.getRow(r).height = 120;
  r++;

  // ERP CODE — dynamic rows based on partron_code groups
  const erpStartRow = r;
  for (const group of groups) {
    sheet.getCell(`C${r}`).value = group.partron_code;
    sheet.getCell(`C${r}`).font = boldCenter;
    sheet.getCell(`C${r}`).alignment = {
      vertical: "middle",
      horizontal: "left",
    };
    sheet.getCell(`D${r}`).value = group.totalQuantity;
    sheet.getCell(`D${r}`).font = boldCenter;
    sheet.getCell(`D${r}`).alignment = centerAlign;
    sheet.getRow(r).height = ROW_HEIGHT;
    r++;
  }
  const erpEndRow = r - 1;
  if (erpEndRow >= erpStartRow) {
    sheet.mergeCells(`B${erpStartRow}:B${erpEndRow}`);
    sheet.getCell(`B${erpStartRow}`).value = "ERP CODE";
    sheet.getCell(`B${erpStartRow}`).font = { bold: true, size: 18 };
    sheet.getCell(`B${erpStartRow}`).alignment = {
      vertical: "middle",
      horizontal: "left",
    };
  }

  // TOTAL QTY
  sheet.getCell(`B${r}`).value = "TOTAL QTY";
  sheet.getCell(`B${r}`).font = { bold: true, size: 18 };
  sheet.getCell(`B${r}`).alignment = { vertical: "middle", horizontal: "left" };
  sheet.mergeCells(`C${r}:D${r}`);
  sheet.getCell(`C${r}`).value = `${totalQuantity} EA`;
  sheet.getCell(`C${r}`).font = { bold: true, size: 18 };
  sheet.getCell(`C${r}`).alignment = centerAlign;
  sheet.getRow(r).height = ROW_HEIGHT;
  r++;

  // TOTAL BOX
  sheet.getCell(`B${r}`).value = "TOTAL BOX";
  sheet.getCell(`B${r}`).font = { bold: true, size: 18 };
  sheet.getCell(`B${r}`).alignment = { vertical: "middle", horizontal: "left" };
  sheet.mergeCells(`C${r}:D${r}`);
  sheet.getCell(`C${r}`).value = `${totalBox} BOX`;
  sheet.getCell(`C${r}`).font = { bold: true, size: 18 };
  sheet.getCell(`C${r}`).alignment = centerAlign;
  sheet.getRow(r).height = ROW_HEIGHT;
  r++;

  // MADE IN VIET NAM
  sheet.mergeCells(`B${r}:D${r}`);
  sheet.getCell(`B${r}`).value = "MADE IN VIET NAM";
  sheet.getCell(`B${r}`).font = { bold: true, size: 30 };
  sheet.getCell(`B${r}`).alignment = centerAlign;
  sheet.getRow(r).height = ROW_HEIGHT;

  // border cho toàn bộ vùng B1:D{r}
  for (let row = 1; row <= r; row++) {
    for (const col of ["B", "C", "D"]) {
      sheet.getCell(`${col}${row}`).border = thinBorder;
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = `Label_Pallet_${dateStr}_${timeStr}.xlsx`;

  // Nếu có exportDirHandle (tức là tính năng không bị chặn và hoạt động bình thường)
  if (exportDirHandle && typeof window.showDirectoryPicker === "function") {
    const fileHandle = await exportDirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(buffer);
    await writable.close();
  } else {
    // Bị chặn: Chuyển sang cách tải file thông thường
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

document.addEventListener("DOMContentLoaded", bootstrap);
