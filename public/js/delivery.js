import * as XLSX from "./xlsx.js";
import { formatDate } from "../js/utils.js";
import I18n from "/i18n.js";

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

// ─── Apply language to static DOM elements ────────────────────────────────────
async function applyLang() {
  // Page Title
  document.title = t("title");

  // Nav links
  const brandLink = document.querySelector(".logo a");
  if (brandLink) brandLink.textContent = t("nav.brand");

  const homeLink = document.querySelector(".home a");
  if (homeLink) homeLink.textContent = t("nav.home");

  const deliveryLink = document.querySelector(".delivery a");
  if (deliveryLink) deliveryLink.textContent = t("nav.delivery");

  const historyLink = document.querySelector(".history a");
  if (historyLink) historyLink.textContent = t("nav.history");

  const adminLink = document.querySelector(".admin a");
  if (adminLink) adminLink.textContent = t("nav.admin");

  const cpNavLink = document.querySelector(".change-password a");
  if (cpNavLink) {
    const textNode = [...cpNavLink.childNodes].find(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim(),
    );
    if (textNode) textNode.textContent = " " + t("nav.changePassword");
  }

  // Toolbar
  const importBtnText = [...importBtn.childNodes].find(
    (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim(),
  );
  if (importBtnText) importBtnText.textContent = " " + t("import");

  if (searchInput) {
    searchInput.placeholder = t("scanQR");
  }

  const listBtnText = [...listBtn.childNodes].find(
    (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim(),
  );
  if (listBtnText) listBtnText.textContent = " " + t("list");

  const gridBtnText = [...gridBtn.childNodes].find(
    (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim(),
  );
  if (gridBtnText) gridBtnText.textContent = " " + t("grid");

  // Table Headers
  const headerDivs = document.querySelectorAll("#tableHeader > div");
  if (headerDivs.length >= 10) {
    headerDivs[0].textContent = t("admin.delivery.table.stt");
    headerDivs[1].textContent = t("admin.delivery.table.mobisCode");
    headerDivs[2].textContent = t("admin.delivery.table.modelName");
    headerDivs[3].textContent = t("admin.delivery.table.type");
    headerDivs[4].textContent = t("admin.delivery.table.status");
    headerDivs[5].textContent = t("admin.delivery.table.target");
    headerDivs[6].textContent = t("admin.delivery.table.quantity");
    headerDivs[7].textContent = t("admin.delivery.table.completeTime");
    headerDivs[8].textContent = t("admin.delivery.table.shippingDate");
    headerDivs[9].textContent = t("admin.delivery.table.shippingMethod");
  }

  // Change Password Modal Static Texts
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
    alert(t("delivery.alerts.fetchError"));
    console.error("Error fetching data:", error);
  }
}

function validateShipmentDate(value, rowIndex) {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  let dateObj = null;

  // ✅ Trường hợp Excel serial number
  if (typeof value === "number") {
    dateObj = new Date(Date.UTC(1899, 11, 30 + value));
  }
  // ✅ Trường hợp Date object
  else if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return false;
    }
    dateObj = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  // ✅ Trường hợp chuỗi
  else if (typeof value === "string") {
    const str = value.trim();
    const match = str.match(/^(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,4})$/);
    if (!match) {
      return false; // Sai format bỏ qua
    }

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

  // Nếu không parse được
  if (!dateObj || Number.isNaN(dateObj.getTime())) {
    return false;
  }

  // ✅ Kiểm tra ngày hợp lệ tồn tại thực tế
  const checkDate = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate(),
  );
  if (
    checkDate.getDate() !== dateObj.getDate() ||
    checkDate.getMonth() !== dateObj.getMonth() ||
    checkDate.getFullYear() !== dateObj.getFullYear()
  ) {
    return false;
  }

  // ✅ Kiểm tra < ngày hiện tại → bỏ qua
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dateObj < today) {
    return false;
  }

  // ✅ Format chuẩn yyyy-mm-dd
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function validateRow(row, rowIndex) {
  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined || value === "") {
      alert(
        t("delivery.alerts.emptyColumn", { row: rowIndex + 2, column: key }),
      );
      return;
    }

    switch (key) {
      case "targetquantity": {
        const num = Number(value);
        if (Number.isNaN(num) || num <= 0) {
          throw new Error(
            t("delivery.alerts.invalidValue", {
              row: rowIndex + 2,
              column: key,
              value: value,
            }),
          );
        }
        row[key] = num;
        break;
      }

      case "quantity": {
        const num = Number(value);
        if (Number.isNaN(num) || num < 0) {
          throw new Error(
            t("delivery.alerts.invalidValue", {
              row: rowIndex + 2,
              column: key,
              value: value,
            }),
          );
        }
        row[key] = num;
        break;
      }
      default:
        continue;
    }
  }

  if (row.targetquantity < row.quantity) {
    alert(t("delivery.alerts.qtyExceedsTarget", { row: rowIndex + 2 }));
  }
}

async function addDeliveryAndHistory(rows) {
  try {
    const res = await fetch(`/exportmanagement/delivery/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.username,
        deliveries: rows,
      }),
    });

    const result = await res.json();
    alert(result.message);
    await getAll();
  } catch (err) {
    alert("Lỗi: " + err.message);
  }
}

function validateSheet(workbook) {
  // Lấy tháng năm hiện tại
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const currentValue = Number(`${year}${month}`);

  // Tìm sheet có tên >= tháng năm hiện tại
  const validSheets = workbook.SheetNames.filter((sheetName) => {
    const parts = sheetName.split(".");
    if (parts.length !== 2) return false;
    const [sheetMonth, sheetYear] = parts;
    const sheetValue = Number(`${sheetYear}${sheetMonth.padStart(2, "0")}`);
    return sheetValue >= currentValue;
  });

  return validSheets;
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
        if (validSheets.length === 0) {
          return reject(new Error(t("delivery.alerts.invalidSheet")));
        }
        const requiredColumns = Object.keys(columnMapping);
        for (const sheetName of validSheets) {
          const sheet = workbook.Sheets[sheetName];
          let headerRowIndex = null;
          let headerRow = null;

          const rawRows = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: "",
          });

          // Tìm dòng header chứa đủ các cột yêu cầu
          for (let i = 0; i < rawRows.length; i++) {
            const row = rawRows[i];
            const matches = requiredColumns.every((col) => row.includes(col));
            if (matches) {
              headerRowIndex = i;
              headerRow = row;
              break;
            }
          }

          if (headerRowIndex === -1 || headerRowIndex === null) {
            alert(t("delivery.alerts.noHeader"));
            return;
          }
          const filteredHeader = headerRow.filter((col) =>
            requiredColumns.includes(col),
          );
          // 3. Lấy index các cột cần thiết trong Excel dựa vào filteredHeader
          const columnIndexes = filteredHeader.map((col) =>
            headerRow.indexOf(col),
          );

          // Ánh xạ headerRow sang tên chuẩn
          const mappedHeader = filteredHeader.map((col) => columnMapping[col]);

          const rows = rawRows
            .slice(headerRowIndex + 1)
            .map((row) => {
              const obj = {};
              columnIndexes.forEach((colIndex, i) => {
                const key = mappedHeader[i];
                let value = row[colIndex] !== undefined ? row[colIndex] : "";

                if (typeof value === "string") {
                  value = value.trim();
                }

                obj[key] = value;
              });
              return obj;
            })
            // Lọc bỏ các dòng không có dữ liệu thực sự
            .filter((row) =>
              Object.values(row).some(
                (v) => v !== "" && v !== null && v !== undefined,
              ),
            );

          for (let index = 0; index < rows.length; index++) {
            const row = rows[index];

            // Tạo chữ ký xác định dòng trùng
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

            if (seen.has(keySignature)) {
              continue; // bỏ dòng trùng
            }
            seen.add(keySignature);

            // Validate shipment date:
            // - nếu sai định dạng => throw
            // - nếu < ngày hiện tại => return false => bỏ dòng
            const result = validateShipmentDate(row.shipmentdate, index);
            if (result === false) {
              continue; // shipmentdate < ngày hiện tại
            }
            row.shipmentdate = result;
            row.quantity = 0;
            validateRow(row, index);

            // thêm vào danh sách hợp lệ
            validRows.push(row);
          }
        }

        if (validRows.length < 1) {
          return reject(new Error(t("delivery.alerts.emptyFile")));
        }
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
  // Sort data: status "run" first, then others
  const sortedData = [...data].sort((a, b) => {
    const aIsRun = a.status.toLowerCase() === "run";
    const bIsRun = b.status.toLowerCase() === "run";

    if (aIsRun && !bIsRun) return -1;
    if (!aIsRun && bIsRun) return 1;
    return 0;
  });

  listView.innerHTML = sortedData
    .map((item, index) => {
      const completeDate = item.complete_time
        ? new Date(item.complete_time).toLocaleDateString("vi-VN")
        : "";
      const shipmentDate = item.shipment_date
        ? new Date(item.shipment_date).toLocaleDateString("vi-VN")
        : "";

      return `
  <div class="table-row ${
    item.status.toLowerCase() === "run" ? "running" : ""
  }">
    <div>${index + 1}</div>
    <div>${item.mobis_code}</div>
    <div>${item.model_name}</div>
    <div>${item.type}</div>
    <div><span class="status-badge ${item.status.toLowerCase()}">${getStatusText(
      item.status,
    )}</span></div>
    <div>${item.target}</div>
    <div>${item.quantity}</div>
    <div>${completeDate}</div>
    <div>${shipmentDate}</div>
    <div>${item.shipping_method}</div>
  </div>
`;
    })
    .join("");
}

function renderGrid() {
  // Sort data: status "run" first, then others
  const sortedData = [...data].sort((a, b) => {
    const aIsRun = a.status.toLowerCase() === "run";
    const bIsRun = b.status.toLowerCase() === "run";

    if (aIsRun && !bIsRun) return -1;
    if (!aIsRun && bIsRun) return 1;
    return 0;
  });

  gridView.innerHTML = sortedData
    .map((item) => {
      const completeDate = item.complete_time
        ? new Date(item.complete_time).toLocaleDateString("vi-VN")
        : "";
      const shipmentDate = item.shipment_date
        ? new Date(item.shipment_date).toLocaleDateString("vi-VN")
        : "";

      return `
         <div class="card ${item.status === "Run" ? "running" : ""}">
    <div class="card-header">
        <strong>${item.model_name}</strong>
    </div>
    <div class="card-body">
        <div><strong>${t("admin.delivery.table.mobisCode")}:</strong> ${item.mobis_code}</div>
        <div><strong>${t("admin.delivery.table.type")}:</strong> ${item.type}</div>
        <div><strong>${t("admin.delivery.table.target")}:</strong> ${item.target}</div>
        <div><strong>${t("admin.delivery.table.quantity")}:</strong> ${item.quantity}</div>
        <strong>${t("admin.delivery.table.status")}:</strong> <div class="status-badge ${item.status.toLowerCase()}"> ${getStatusText(item.status)}</div>
        <div><strong>${t("admin.delivery.table.completeTime")}:</strong> ${completeDate}</div>
        <div><strong>${t("admin.delivery.table.shippingDate")}:</strong> ${shipmentDate}</div>
        <div><strong>${t("admin.delivery.table.shippingMethod")}:</strong> ${item.shipping_method}</div>
    </div>
  </div>
      `;
    })
    .join("");
}

gridBtn.addEventListener("click", () => {
  gridBtn.classList.add("active");
  listBtn.classList.remove("active");
  gridView.classList.add("active");
  listView.classList.add("hidden");
  listView.classList.remove("active");
  tableHeader.classList.add("hidden");
});

importBtn.addEventListener("click", () => {
  excelInput.click();
});

excelInput.addEventListener("change", async () => {
  const file = excelInput.files[0];
  if (!file) return alert(t("delivery.alerts.selectExcel"));

  try {
    const rows = await validateExcelFile(file);

    await addDeliveryAndHistory(rows);
  } catch (err) {
    alert("Lỗi: " + err.message);
  } finally {
    excelInput.value = "";
  }
});

listBtn.addEventListener("click", () => {
  listBtn.classList.add("active");
  gridBtn.classList.remove("active");
  listView.classList.add("active");
  listView.classList.remove("hidden");
  gridView.classList.remove("active");
  tableHeader.classList.remove("hidden");
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
      `exportmanagement/qr/${user.factory.toLowerCase()}/${qrData.mobiscode}/${
        qrData.type
      }`,
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

function getQrData(qr) {
  const parts = qr.split("-");
  let qrData = {};
  switch (parts.length) {
    case 7: {
      if (!Number(parts[3])) {
        throw new Error(t("delivery.alerts.invalidQr"));
      }
      qrData = {
        mobiscode: parts[2],
        quantity: parts[3],
        type: parts[4],
      };
      return qrData;
    }

    case 8: {
      if (!Number(parts[4])) {
        throw new Error(t("delivery.alerts.invalidQr"));
      }
      qrData = {
        mobiscode: parts[2] + parts[3],
        quantity: parts[4],
        type: parts[5],
      };
      return qrData;
    }

    case 9: {
      if (!Number(parts[5])) {
        throw new Error(t("delivery.alerts.invalidQr"));
      }

      const startsWithNumber = /^\d/.test(parts[2]);

      qrData = {
        mobiscode: startsWithNumber
          ? parts[2] + parts[3] + parts[4]
          : parts[3] + parts[4],
        quantity: parts[5],
        type: parts[6],
      };

      return qrData;
    }

    default:
      throw new Error(t("delivery.alerts.invalidQr"));
  }
}

async function updateDelivery(username, factory, delivery, qr) {
  try {
    const response = await fetch("exportmanagement/delivery/update/quantity", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        factory,
        delivery,
        qr,
      }),
    });

    if (!response.ok) {
      throw new Error(`Lỗi HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.log(error);
    return { status: 500, message: t("delivery.alerts.updateFailed") };
  }
}

let isProcessing = false;

searchInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    if (isProcessing) return;

    isProcessing = true; // ĐÁNH DẤU ĐANG XỬ LÝ
    try {
      const qrValue = searchInput.value.trim();
      if (!qrValue) return;

      // ✅ chỉ cho phép chữ, số và dấu - và khoảng trắng
      const qrPattern = /^[A-Za-z0-9- ]+$/;

      if (!qrPattern.test(qrValue)) {
        playErrorSound();
        alert(t("delivery.alerts.invalidQr"));
        return;
      }

      const invalidLength = qrValue.length < 38 || qrValue.length > 48;

      // phải bắt đầu bằng 1 trong 3 mã
      const validPrefix =
        qrValue.startsWith("R7A8") ||
        qrValue.startsWith("N-") ||
        qrValue.startsWith("NQ5");

      // ký tự thứ 5 từ phải sang phải là '-'
      const fifthFromRight = qrValue.slice(-5, -4);
      const validDash = fifthFromRight === "-";

      if (invalidLength || !validPrefix || !validDash) {
        playErrorSound();
        alert(t("delivery.alerts.invalidQr"));
        return;
      }

      const qrData = getQrData(qrValue);

      const isQrExist = await checkQrExist(user.factory.toLowerCase(), qrValue);

      if (isQrExist) {
        playErrorSound();
        alert(t("delivery.alerts.qrExists"));
        return;
      }

      const delivery = await findDelivery(qrData);

      if (!delivery) {
        playErrorSound();
        alert(t("delivery.alerts.noMatchQr"));
        return;
      }

      let newQuantity = Number(delivery.quantity) + Number(qrData.quantity);
      if (newQuantity > delivery.target) {
        playErrorSound();
        alert(t("delivery.alerts.targetExceeded"));
        return;
      }

      if (newQuantity === delivery.target) {
        delivery.status = "Complete";
        let completeTime = new Date();
        delivery.complete_time = formatDate(completeTime);
      }

      if (newQuantity < delivery.target) {
        delivery.status = "Run";
      }

      delivery.quantity = newQuantity;
      delivery.shipment_date = formatDate(delivery.shipment_date);

      const response = await updateDelivery(
        user.username,
        user.factory.toLowerCase(),
        delivery,
        qrValue,
      );
      if (response.status !== 200) {
        alert(response.message);
        return;
      }
      searchInput.value = "";
      await getAll();
    } catch (error) {
      playErrorSound();
      alert(error.message || error);
      searchInput.value = "";
    } finally {
      isProcessing = false;
    }
  }
});

cbbFactory.addEventListener("change", async () => {
  factorySelected = cbbFactory.value.toLowerCase();
  await getAll();
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap() {
  // 1. Init i18n
  await I18n.init("en");
  t = (key, params) => I18n.t(key, params);
  user = await getUserProfile();
  document.querySelector("app-header")?.setUser(user);
  // 2. Fetch User Profile
  user = await getUserProfile();

  // 3. Set Active Factory Selection & visibility
  if (user.role.toLowerCase() == "user") {
    searchInput.classList.add("visible");
    cbbFactory.value = user.factory;
    cbbFactory.disabled = true;
  } else {
    importBtn.classList.add("visible");
  }
  factorySelected = cbbFactory.value.toLowerCase();

  // 5. Apply Static Label Translations
  await applyLang();

  // 6. Get data and render
  await getAll();
}

await bootstrap();
