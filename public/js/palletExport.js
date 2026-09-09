import PalletQueue from "./palletQueue.js";
import Modal from "./modal.js";

let t = (key, params) => key;
let currentFactory = "";

function init(tFn, factoryGetter) {
  t = tFn;
  currentFactory = factoryGetter;
}

// ─── Styles cho modal (scoped bằng prefix "pl-") ───────────────────────────
function injectStyles() {
  if (document.getElementById("pallet-modal-styles")) return;
  const style = document.createElement("style");
  style.id = "pallet-modal-styles";
  style.textContent = `
    .pl-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999; padding: 20px;
    }
    .pl-box {
      background: #060c21;
      border: 1px solid #2e4080;
      border-radius: 14px;
      width: 100%; max-width: 640px; max-height: 90vh;
      display: flex; flex-direction: column;
      color: #e3e2e9;
      box-shadow: 0 24px 64px rgba(0,0,0,0.55);
    }
    .pl-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-bottom: 1px solid #2a3f7e;
      flex-shrink: 0;
    }
    .pl-header h2 { margin: 0; font-size: 1.15rem; }
    .pl-close {
      background: none; border: none; color: #7a8fcc; cursor: pointer;
      font-size: 22px; line-height: 1;
    }
    .pl-close:hover { color: #e8eeff; }
    .pl-body { padding: 20px 24px; overflow-y: auto; flex: 1; }
    .pl-empty { text-align: center; color: #6b83c4; padding: 40px 0; }

    /* ─── Label preview table (mô phỏng layout Excel) ─── */
    .pl-label-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #2a3f7e;
      font-size: 14px;
    }
    .pl-label-table td {
      border: 1px solid #2a3f7e;
      padding: 10px 12px;
      vertical-align: middle;
    }
    .pl-label-title {
      text-align: center;
      font-weight: 700;
      font-size: 16px;
      letter-spacing: 0.04em;
      background: rgba(10,20,60,0.6);
    }
    .pl-label-pallet {
      font-weight: 700;
      font-size: 18px;
      color: #6b83c4;
    }
    .pl-label-key {
      font-weight: 700;
      color: #a0b4e8;
      white-space: nowrap;
      width: 110px;
      background: rgba(10,20,60,0.4);
    }
    .pl-label-value {
      white-space: pre-line;
      line-height: 1.5;
    }
    .pl-erp-row td {
      cursor: pointer;
      transition: background 0.15s;
    }
    .pl-erp-row:hover td { background: rgba(255,255,255,0.05); }
    .pl-erp-code { font-weight: 600; }
    .pl-erp-qty { text-align: right; font-weight: 700; color: white; }

    /* ─── FIX: display toggle phải nằm ở <tr>, không phải <td> ───
       Nếu chỉ ẩn <td> thì <tr> vẫn được tính là 1 dòng thực trong'
       
       table layout, làm rowspan của cột "ERP CODE" đếm sai số dòng
       (che phủ nhầm cả các dòng detail đang ẩn), khiến các dòng ERP
       phía sau bị "tụt" ra ngoài vùng rowspan và mất cột label. */
    .pl-erp-detail-row {
      display: none;
      background: rgba(0,0,0,0.25);
    }
    .pl-erp-detail-row.open { display: table-row; }
    .pl-erp-detail-row td { padding: 0; }

    .pl-erp-detail-inner {
  padding: 8px 16px;
  padding-left: calc(110px + 16px);
  font-size: 12.5px;
}
    .pl-detail-item {
      display: flex; justify-content: space-between;
      padding: 4px 0; border-bottom: 1px dashed #2a3f7e;
    }
    .pl-detail-item:last-child { border-bottom: none; }
    .pl-label-total-value {
      text-align: right;
      font-weight: 700;
    }
    .pl-label-footer {
      text-align: center;
      font-weight: 700;
      font-size: 16px;
      background: rgba(10,20,60,0.6);
    }

    .pl-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 16px 24px; border-top: 1px solid #2a3f7e;
      flex-shrink: 0;
    }
    .pl-btn {
      padding: 9px 20px; border-radius: 8px; border: none;
      cursor: pointer; font-size: 14px; font-weight: 600;
    }
    .pl-btn-secondary { background: transparent; border: 1.5px solid #2a3f7e; color: #e3e2e9; }
    .pl-btn-primary {
      background: linear-gradient(135deg, #1de9c4, #0ea5e9);
      color: #0a1628;
    }
    .pl-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  `;
  document.head.appendChild(style);
}

// ─── Excel export (ExcelJS) ────────────────────────────────────────────────
async function buildAndDownloadExcel(groups, totalQuantity, totalBox) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Label");

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

  sheet.mergeCells(`B${r}:D${r}`);
  sheet.getCell(`B${r}`).value = "SHIPPING LABEL";
  sheet.getCell(`B${r}`).font = { bold: true, size: 18 };
  sheet.getCell(`B${r}`).alignment = centerAlign;
  r++;

  sheet.mergeCells(`B${r}:D${r}`);
  sheet.getCell(`B${r}`).value = "PALLET NO. :"; // để trống theo yêu cầu
  sheet.getCell(`B${r}`).font = { bold: true, size: 30 };
  sheet.getCell(`B${r}`).alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(r).height = 100;
  r++;

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

  // ERP CODE — số dòng linh động theo số partron_code thực tế
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

  sheet.getCell(`B${r}`).value = "TOTAL QTY";
  sheet.getCell(`B${r}`).font = { bold: true, size: 18 };
  sheet.getCell(`B${r}`).alignment = { vertical: "middle", horizontal: "left" };
  sheet.mergeCells(`C${r}:D${r}`);
  sheet.getCell(`C${r}`).value = `${totalQuantity} EA`;
  sheet.getCell(`C${r}`).font = { bold: true, size: 18 };
  sheet.getCell(`C${r}`).alignment = centerAlign;
  sheet.getRow(r).height = ROW_HEIGHT;
  r++;

  sheet.getCell(`B${r}`).value = "TOTAL BOX";
  sheet.getCell(`B${r}`).font = { bold: true, size: 18 };
  sheet.getCell(`B${r}`).alignment = { vertical: "middle", horizontal: "left" };
  sheet.mergeCells(`C${r}:D${r}`);
  sheet.getCell(`C${r}`).value = `${totalBox} BOX`;
  sheet.getCell(`C${r}`).font = { bold: true, size: 18 };
  sheet.getCell(`C${r}`).alignment = centerAlign;
  sheet.getRow(r).height = ROW_HEIGHT;
  r++;

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
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const filename = `Label_${currentFactory()}_${ts}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ─── Double-check với server trước khi export ──────────────────────────────
async function checkQrHistory(items) {
  const response = await fetch("exportmanagement/delivery/checkQrHistory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: items.map((i) => ({ qr: i.qr, factory: i.factory })),
    }),
  });
  if (!response.ok) throw new Error(t("pallet.alerts.checkFailed"));
  const data = await response.json();
  return data.foundQrs || [];
}

async function handleExport(items, exportBtn) {
  exportBtn.disabled = true;
  try {
    const foundQrs = await checkQrHistory(items);
    const missing = items.filter((i) => !foundQrs.includes(i.qr));

    if (missing.length > 0) {
      Modal.show({
        type: "error",
        title: t("modal.title.error"),
        message: t("pallet.alerts.mismatchWarning", { count: missing.length }),
        showClose: true,
      });
      return;
    }

    const groups = PalletQueue.groupByPartronCode(items);
    const totalQuantity = items.reduce(
      (sum, i) => sum + (Number(i.quantity) || 0),
      0,
    );
    const totalBox = items.length;

    await buildAndDownloadExcel(groups, totalQuantity, totalBox);

    // chỉ xoá queue sau khi export + download thành công
    PalletQueue.clearQueue();
    closeModal();

    Modal.show({
      type: "success",
      title: t("modal.title.success"),
      message: t("pallet.alerts.exportSuccess"),
      autoClose: true,
      duration: 2000,
    });
  } catch (err) {
    console.error("Export pallet error:", err);
    Modal.show({
      type: "error",
      title: t("modal.title.error"),
      message: err.message || t("pallet.alerts.exportFailed"),
      showClose: true,
    });
  } finally {
    exportBtn.disabled = false;
  }
}

// ─── Modal UI ───────────────────────────────────────────────────────────────
let activeBackdrop = null;

function closeModal() {
  if (activeBackdrop) {
    activeBackdrop.remove();
    activeBackdrop = null;
  }
}

function openPalletModal() {
  injectStyles();

  const queue = PalletQueue.getQueue();

  if (queue && PalletQueue.isExpired(queue)) {
    Modal.showConfirm({
      type: "warning",
      title: t("pallet.alerts.expiredTitle"),
      message: t("pallet.alerts.expiredMessage"),
      yesLabel: t("modal.yesButton"),
      noLabel: t("modal.noButton"),
    }).then((confirmed) => {
      if (confirmed) {
        PalletQueue.clearQueue();
        renderModal(null);
      }
    });
    return;
  }

  renderModal(queue);
}

function renderModal(queue) {
  const items = queue?.items || [];
  const groups = PalletQueue.groupByPartronCode(items);
  const totalQuantity = items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0),
    0,
  );
  const totalBox = items.length;

  const erpRowsHtml = groups
    .map(
      (g, idx) => `
    <tr class="pl-erp-row" data-idx="${idx}">
      ${idx === 0 ? `<td class="pl-label-key" rowspan="${groups.length}">${t("pallet.erpCode")}</td>` : ""}
      <td class="pl-erp-code">${g.partron_code}</td>
      <td class="pl-erp-qty">${g.totalQuantity}</td>
    </tr>
    <tr class="pl-erp-detail-row" id="pl-detail-${idx}">
      <td colspan="3">
        <div class="pl-erp-detail-inner">
          ${g.boxes
            .map(
              (b) =>
                `<div class="pl-detail-item"><span>${b.qr}</span><span>${b.quantity}</span></div>`,
            )
            .join("")}
        </div>
      </td>
    </tr>
  `,
    )
    .join("");

  const backdrop = document.createElement("div");
  backdrop.className = "pl-backdrop";
  backdrop.innerHTML = `
    <div class="pl-box">
      <div class="pl-header">
        <h2>${t("pallet.title")}</h2>
        <button class="pl-close">&times;</button>
      </div>
      <div class="pl-body">
        ${
          groups.length === 0
            ? `<div class="pl-empty">${t("pallet.empty")}</div>`
            : `
        <table class="pl-label-table">
          <tr>
            <td class="pl-label-title" colspan="3">SHIPPING LABEL</td>
          </tr>
          <tr>
            <td class="pl-label-pallet" colspan="3">PALLET NO. :</td>
          </tr>
          <tr>
            <td class="pl-label-key">SHIP FROM</td>
            <td class="pl-label-value" colspan="2">Patron VINA
Lot 11, Khai Quang Industrial Zone, Vinh Phuc Ward, Phu Tho Province, Vietnam</td>
          </tr>
          <tr>
            <td class="pl-label-key">SHIP TO</td>
            <td class="pl-label-value" colspan="2">PARTRON CO.,LTD
22, Samsung 1-ro 2-gil,, Hwaseong-si, Gyeonggi-do, Korea</td>
          </tr>
          ${erpRowsHtml}
          <tr>
            <td class="pl-label-key">TOTAL QTY</td>
            <td class="pl-label-total-value" colspan="2">${totalQuantity} EA</td>
          </tr>
          <tr>
            <td class="pl-label-key">TOTAL BOX</td>
            <td class="pl-label-total-value" colspan="2">${totalBox} BOX</td>
          </tr>
          <tr>
            <td class="pl-label-footer" colspan="3">MADE IN VIET NAM</td>
          </tr>
        </table>
        `
        }
      </div>
      <div class="pl-footer">
        <button class="pl-btn pl-btn-secondary" id="plCloseBtn">${t("modal.closeButton")}</button>
        <button class="pl-btn pl-btn-primary" id="plExportBtn" ${groups.length === 0 ? "disabled" : ""}>
          ${t("pallet.exportButton")}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  activeBackdrop = backdrop;

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });
  backdrop.querySelector(".pl-close").addEventListener("click", closeModal);
  backdrop.querySelector("#plCloseBtn").addEventListener("click", closeModal);

  backdrop.querySelectorAll(".pl-erp-row").forEach((row) => {
    row.addEventListener("click", () => {
      const idx = row.dataset.idx;
      const detail = backdrop.querySelector(`#pl-detail-${idx}`);
      detail.classList.toggle("open");
    });
  });

  const exportBtn = backdrop.querySelector("#plExportBtn");
  if (exportBtn && groups.length > 0) {
    exportBtn.addEventListener("click", () => handleExport(items, exportBtn));
  }
}

export default { init, openPalletModal };
