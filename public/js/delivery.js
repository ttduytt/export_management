import * as XLSX from "https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs";

const gridBtn = document.getElementById("gridBtn");
const listBtn = document.getElementById("listBtn");
const gridView = document.getElementById("gridView");
const listView = document.getElementById("listView");
const tableHeader = document.getElementById("tableHeader");
const searchInput = document.getElementById("searchInput");
const importBtn = document.querySelector(".btnImport");
const excelInput = document.getElementById("excelInput");

const data = [];
const schema = {
  mobis_code: "string",
  model_name: "string",
  model_type: "string",
  target_quantity: "number",
  type: "string",
  partron_code: "string",
  quantity: "number",
  shipping_method: "string",
  shipment_date: "string",
};
const requiredColumns = [
  "Mobis Code",
  "Model Name",
  "Model Type",
  "Target Quantity",
  "Type",
  "Partron Code",
  "Quantity",
  "Shipping Method",
  "Shipment Date",
];

function getAll() {
  fetch("/exportmanagement/delivery/v0")
    .then((response) => response.json())
    .then((result) => {
      data.push(...result);
      renderList();
      renderGrid();
    })
    .catch((error) => console.error("Error fetching data:", error));
}

function validateRow(row, rowIndex) {
  for (const [key, value] of Object.entries(row)) {
    const lowerKey = key.toLowerCase();

    if (value === null || value === undefined || value === "") {
      alert(`dòng ${index + 2} cột ${key} không được để trống`);
      return;
    }

    switch (lowerKey) {
      case "target quantity":
      case "quantity": {
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error(
            `Lỗi tại dòng ${
              rowIndex + 2
            }, cột "${key}": Giá trị không hợp lệ: "${value}"`
          );
        }
        row[key] = num;
        break;
      }

      case "shipment date": {
        const str = String(value).trim();
        const parts = str.split(/[\/\-]/).map(Number);
        if (parts.length !== 3) {
          throw new Error(
            `Lỗi tại dòng ${
              rowIndex + 2
            }, cột "${key}": Ngày không hợp lệ: "${value}"`
          );
        }
        const [day, month, year] = parts;
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) {
          throw new Error(
            `Lỗi tại dòng ${
              rowIndex + 2
            }, cột "${key}": Ngày không hợp lệ: "${value}"`
          );
        }
        row[key] = `${String(day).padStart(2, "0")}/${String(month).padStart(
          2,
          "0"
        )}/${year}`;
        break;
      }

      default:
        continue;
    }
  }
}

function validateExcelFile(file) {
  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

      if (rows.length < 1) {
        alert("⚠️ File rỗng hoặc không có dữ liệu");
        return;
      }

      const headers = Object.keys(rows[0]).map((h) => h.toLowerCase());
      const missing = requiredColumns.filter(
        (col) => !headers.includes(col.toLowerCase())
      );

      if (missing.length > 0) {
        console.log("⚠️ Thiếu cột:", missing);
        alert("⚠️ Thiếu cột: " + missing.join(", "));
        return;
      }

      rows.forEach((row, index) => {
        validateRow(row, index);
      });
    } catch (err) {
      alert(err.message);
    }
  };

  reader.readAsArrayBuffer(file);
}

function renderList() {
  listView.innerHTML = data
    .map((item) => {
      const completeDate = item.complete_time
        ? new Date(item.complete_time).toLocaleDateString("vi-VN")
        : "";
      const shipmentDate = item.shipment_date
        ? new Date(item.shipment_date).toLocaleDateString("vi-VN")
        : "";

      return `
        <div class="table-row">
          <div></div>
          <div>${item.mobis_code}</div>
          <div>${item.model_name}</div>
          <div>${item.type}</div>
          <div><span class="status-badge status-${item.status.toLowerCase()}">${
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
  gridView.innerHTML = data
    .map((item) => {
      const completeDate = item.complete_time
        ? new Date(item.complete_time).toLocaleDateString("vi-VN")
        : "";
      const shipmentDate = item.shipment_date
        ? new Date(item.shipment_date).toLocaleDateString("vi-VN")
        : "";

      return `
        <div class="card">
          <div class="card-header">
              <strong>${item.model_name}</strong>
          </div>
          <div class="card-body">
              <div><strong>Mobis Code:</strong> ${item.mobis_code}</div>
              <div><strong>Type:</strong> ${item.type}</div>
              <div><strong>Target:</strong> ${item.target}</div>
              <div><strong>Quantity:</strong> ${item.quantity}</div>
              <div><strong>Status:</strong> ${item.status}</div>
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

excelInput.addEventListener("change", () => {
  const file = excelInput.files[0];
  if (!file) return alert("Vui lòng chọn file Excel!");
  validateExcelFile(file);
});

listBtn.addEventListener("click", () => {
  listBtn.classList.add("active");
  gridBtn.classList.remove("active");
  listView.classList.add("active");
  listView.classList.remove("hidden");
  gridView.classList.remove("active");
  tableHeader.classList.remove("hidden");
});

searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  document.querySelectorAll(".table-row, .card").forEach((item) => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(searchTerm) ? "" : "none";
  });
});

getAll();
renderList();
renderGrid();
