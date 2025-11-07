import * as XLSX from "./xlsx.js";

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
import { formatDate } from "../js/utils.js";

let data = [];
const user = JSON.parse(localStorage.getItem("user"));
if (!user) {
  alert("Unauthorized! Please log in.");
  globalThis.location.href = "/";
}
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

if (user.factory.toLowerCase() == "v4") {
  importBtn.classList.add("visible");
} else {
  searchInput.classList.add("visible");
  cbbFactory.value = user.factory;
  cbbFactory.disabled = true;
}

let factorySelected = cbbFactory.value.toLowerCase();

cbbFactory.addEventListener("change", async () => {
  factorySelected = cbbFactory.value.toLowerCase();
  await getAll();
});

function playErrorSound() {
  if (errorSound) {
    errorSound.currentTime = 0;
    errorSound.play().catch(() => {});
  }
}

async function getAll() {
  try {
    const response = await fetch(
      `/exportmanagement/delivery/${factorySelected}`
    );
    const result = await response.json();
    data = [...result];
    renderList();
    renderGrid();
  } catch (error) {
    alert("Lỗi khi lấy dữ liệu xuất hàng");
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
    dateObj.getDate()
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
      alert(`dòng ${rowIndex + 2} cột ${key} không được để trống`);
      return;
    }

    switch (key) {
      case "targetquantity": {
        const num = Number(value);
        if (Number.isNaN(num) || num <= 0) {
          throw new Error(
            `Lỗi tại dòng ${
              rowIndex + 2
            }, cột "${key}": Giá trị không hợp lệ: "${value}"`
          );
        }
        row[key] = num;
        break;
      }

      case "quantity": {
        const num = Number(value);
        if (Number.isNaN(num) || num < 0) {
          throw new Error(
            `Lỗi tại dòng ${
              rowIndex + 2
            }, cột "${key}": Giá trị không hợp lệ: "${value}"`
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
    alert(`dòng ${rowIndex + 2} Quantity không được lớn hơn Target Quantity`);
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
          return reject(
            new Error(
              "Không tìm thấy sheet hợp lệ cho tháng hiện tại hoặc tương lai"
            )
          );
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

          if (headerRowIndex === -1) {
            alert("Không tìm thấy dòng header phù hợp!");
            return;
          }
          const filteredHeader = headerRow.filter((col) =>
            requiredColumns.includes(col)
          );
          // 3. Lấy index các cột cần thiết trong Excel dựa vào filteredHeader
          const columnIndexes = filteredHeader.map((col) =>
            headerRow.indexOf(col)
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
                (v) => v !== "" && v !== null && v !== undefined
              )
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
                  .toLowerCase()
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
          return reject(new Error("⚠️ File rỗng hoặc không có dữ liệu hợp lệ"));
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
    <div><span class="status-badge ${item.status.toLowerCase()}">${
        item.status
      }</span></div>
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
        <div><strong>Mobis Code:</strong> ${item.mobis_code}</div>
        <div><strong>Type:</strong> ${item.type}</div>
        <div><strong>Target:</strong> ${item.target}</div>
        <div><strong>Quantity:</strong> ${item.quantity}</div>
        <strong>Status:</strong> <div class="status-badge ${item.status.toLowerCase()}"> ${
        item.status
      }</div>
        <div><strong>Complete Time:</strong> ${completeDate}</div>
        <div><strong>Shipment Date:</strong> ${shipmentDate}</div>
        <div><strong>Shipping method:</strong> ${item.shipping_method}</div>
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
  if (!file) return alert("Vui lòng chọn file Excel!");

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
      `exportmanagement/qr/getvalue?factory=${factory}&qrvalue=${qr}`
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
      }`
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
        throw new Error("Mã QR không hợp lệ");
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
        throw new Error("Mã QR không hợp lệ");
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
        throw new Error("Mã QR không hợp lệ");
      }
      qrData = {
        mobiscode: parts[2] + parts[3] + parts[4],
        quantity: parts[5],
        type: parts[6],
      };
      return qrData;
    }

    default:
      throw new Error("Mã QR không hợp lệ");
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
    return { status: 500, message: "Cập nhật thất bại (fetch error)" };
  }
}

searchInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    try {
      const qrValue = searchInput.value.trim();
      if (!qrValue) return;

      const qrData = getQrData(qrValue);

      const isQrExist = await checkQrExist(user.factory.toLowerCase(), qrValue);

      if (isQrExist) {
        playErrorSound();
        alert("Mã QR đã tồn tại");
        return;
      }

      const delivery = await findDelivery(qrData);

      if (!delivery) {
        playErrorSound();
        alert("không tìm thấy thông tin xuất hàng khớp với qr");
        return;
      }

      let newQuantity = Number(delivery.quantity) + Number(qrData.quantity);
      if (newQuantity > delivery.target) {
        playErrorSound();
        alert("số lượng cộng thêm lớn hơn số lượng mục tiêu");
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
        qrValue
      );
      if (response.status !== 200) {
        alert(response.message);
        return;
      }
      searchInput.value = "";
      await getAll();
    } catch (error) {
      playErrorSound();
      alert(error);
      searchInput.value = "";
    }
  }
});

await getAll();
renderList();
renderGrid();
