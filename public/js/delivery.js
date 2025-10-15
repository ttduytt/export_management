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
const requiredColumns = [
  "MobisCode",
  "ModelName",
  "ModelType",
  "TargetQuantity",
  "Type",
  "PartronCode",
  "Quantity",
  "ShippingMethod",
  "ShipmentDate",
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
    if (value === null || value === undefined || value === "") {
      alert(`dòng ${rowIndex + 2} cột ${key} không được để trống`);
      return;
    }

    switch (key) {
      case "targetquantity": {
        const num = Number(value);
        if (isNaN(num) || num <= 0) {
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
        if (isNaN(num) || num < 0) {
          throw new Error(
            `Lỗi tại dòng ${
              rowIndex + 2
            }, cột "${key}": Giá trị không hợp lệ: "${value}"`
          );
        }
        row[key] = num;
        break;
      }

      case "shipmentdate": {
        // Xử lý số Excel date
        if (typeof value === "number") {
          const excelDate = new Date(Date.UTC(1899, 11, 30 + value));
          if (isNaN(excelDate.getTime())) {
            throw new Error(
              `Lỗi tại dòng ${
                rowIndex + 2
              }, cột "${key}": Ngày Excel không hợp lệ: "${value}"`
            );
          }

          const day = excelDate.getUTCDate();
          const month = excelDate.getUTCMonth() + 1;
          const year = excelDate.getUTCFullYear();

          row[key] = `${year}-${String(month).padStart(2, "0")}-${String(
            day
          ).padStart(2, "0")}`;
          break;
        }

        // Xử lý Date object
        if (value instanceof Date) {
          if (isNaN(value.getTime())) {
            throw new Error(
              `Lỗi tại dòng ${rowIndex + 2}, cột "${key}": Ngày không hợp lệ`
            );
          }

          const day = value.getDate();
          const month = value.getMonth() + 1;
          const year = value.getFullYear();

          row[key] = `${year}-${String(month).padStart(2, "0")}-${String(
            day
          ).padStart(2, "0")}`;
          break;
        }

        // Xử lý chuỗi
        const str = String(value).trim();

        const match = str.match(/^(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,4})$/);
        if (!match) {
          throw new Error(
            `Lỗi tại dòng ${
              rowIndex + 2
            }, cột "${key}": Định dạng ngày không hợp lệ: "${value}". ` +
              `Chỉ chấp nhận: dd/mm/yyyy hoặc yyyy/mm/dd`
          );
        }

        const part1 = parseInt(match[1]);
        const part2 = parseInt(match[2]);
        const part3 = parseInt(match[3]);

        let day, month, year;

        // Phân biệt dd/mm/yyyy vs yyyy/mm/dd
        // Nếu part1 > 31 → chắc chắn là năm → format yyyy/mm/dd
        if (part1 > 31) {
          year = part1;
          month = part2;
          day = part3;
        }
        // Nếu part3 > 31 → chắc chắn là năm → format dd/mm/yyyy
        else if (part3 > 31) {
          day = part1;
          month = part2;
          year = part3;
        }
        // Nếu part1 > 12 và part1 <= 31 → chắc chắn là ngày → format dd/mm/yyyy
        else if (part1 > 12) {
          day = part1;
          month = part2;
          year = part3;
        }
        // Nếu part3 <= 31 và có 4 chữ số → format dd/mm/yyyy
        else if (part3 >= 1000) {
          day = part1;
          month = part2;
          year = part3;
        }
        // Nếu part1 có 4 chữ số → format yyyy/mm/dd
        else if (part1 >= 1000) {
          year = part1;
          month = part2;
          day = part3;
        }
        // Mặc định: dd/mm/yyyy (trường hợp애매: 11/10/2025)
        else {
          day = part1;
          month = part2;
          year = part3;
        }

        // Validate năm hợp lý
        if (year < 1900 || year > 2100) {
          throw new Error(
            `Lỗi tại dòng ${
              rowIndex + 2
            }, cột "${key}": Năm không hợp lệ (${year}). Năm phải từ 1900-2100.`
          );
        }

        // Validate tháng
        if (month < 1 || month > 12) {
          throw new Error(
            `Lỗi tại dòng ${
              rowIndex + 2
            }, cột "${key}": Tháng không hợp lệ (${month}). Tháng phải từ 1-12.`
          );
        }

        // Validate ngày
        if (day < 1 || day > 31) {
          throw new Error(
            `Lỗi tại dòng ${
              rowIndex + 2
            }, cột "${key}": Ngày không hợp lệ (${day}). Ngày phải từ 1-31.`
          );
        }

        // Kiểm tra ngày có tồn tại trong tháng đó
        const date = new Date(year, month - 1, day);
        if (
          isNaN(date.getTime()) ||
          date.getDate() !== day ||
          date.getMonth() !== month - 1 ||
          date.getFullYear() !== year
        ) {
          throw new Error(
            `Lỗi tại dòng ${
              rowIndex + 2
            }, cột "${key}": Ngày không tồn tại: ${day}/${month}/${year}. ` +
              `Tháng ${month} không có ngày ${day}.`
          );
        }

        // Format về yyyy-mm-dd
        row[key] = `${year}-${String(month).padStart(2, "0")}-${String(
          day
        ).padStart(2, "0")}`;
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

async function addDeliveryAndHistory(factory, rows) {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const res = await fetch(`/exportmanagement/delivery/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.username,
        factory: factory,
        deliveries: rows,
      }),
    });

    const result = await res.json();

    alert(result.message);
  } catch (err) {
    alert("Lỗi: " + err.message);
  }
}

function validateExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const seen = new Set();
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        const sheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        const rawHeaders = sheetData[0];

        const cleanHeaders = rawHeaders.map((h) =>
          String(h || "")
            .trim()
            .replace(/\s+/g, "")
            .toLowerCase()
        );

        const rows = XLSX.utils
          .sheet_to_json(firstSheet, {
            header: cleanHeaders,
            range: 1,
            defval: "",
          })
          .filter((row) => {
            return Object.values(row).some((v) => String(v).trim() !== "");
          });

        if (rows.length < 1) {
          return reject(new Error("⚠️ File rỗng hoặc không có dữ liệu"));
        }

        const headers = Object.keys(rows[0]).map((h) => h.toLowerCase());
        const missing = requiredColumns.filter(
          (col) => !headers.includes(col.toLowerCase())
        );

        if (missing.length > 0) {
          return reject(new Error("⚠️ Thiếu cột: " + missing.join(", ")));
        }

        rows.forEach((row, index) => {
          const keySignature = [
            row.mobiscode,
            row.target,
            row.shipmentdate,
            row.shippingmethod,
            row.type,
          ]
            .map((v) =>
              String(v || "")
                .trim()
                .toLowerCase()
            )
            .join("|");

          if (seen.has(keySignature)) {
            throw new Error(
              `Dòng ${
                index + 2
              } bị trùng trong file (Mobis Code, Target, Shipment Date, Shipping Method, Type)`
            );
          }

          seen.add(keySignature);
          validateRow(row, index);
        });

        resolve(rows); // Trả về mảng rows nếu hợp lệ
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
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

excelInput.addEventListener("change", async () => {
  const file = excelInput.files[0];
  if (!file) return alert("Vui lòng chọn file Excel!");

  try {
    const rows = await validateExcelFile(file);
    console.log("Dữ liệu hợp lệ:", rows);

    await addDeliveryAndHistory("v0", rows);
  } catch (err) {
    alert("Lỗi: " + err.message);
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

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    alert("Người dùng nhấn Enter với giá trị:", searchInput.value);
  }
});

getAll();
renderList();
renderGrid();
