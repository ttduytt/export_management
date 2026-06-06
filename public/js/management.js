import I18n from "/i18n.js";

// ─── Global translation handle ────────────────────────────────────────────────
let t = (key, params) => key;

// ─── Apply language to static DOM elements ────────────────────────────────────
async function applyLang() {
  // Welcome card stats
  document.getElementById("lbl-total-in-day").textContent = t(
    "admin.stats.totalInDay",
  );
  document.getElementById("lbl-performance").textContent = t(
    "admin.stats.performance",
  );

  // Chart headers
  document.getElementById("lbl-chart-monthly-title").textContent = t(
    "admin.charts.monthlyPerformance.title",
  );
  document.getElementById("lbl-chart-monthly-sub").textContent = t(
    "admin.charts.monthlyPerformance.subtitle",
  );
  document.getElementById("lbl-chart-status-title").textContent = t(
    "admin.charts.shipmentStatus.title",
  );
  document.getElementById("lbl-chart-status-sub").textContent = t(
    "admin.charts.shipmentStatus.subtitle",
  );



  // Model Spec
  document.getElementById("th-model-spec").textContent = t(
    "admin.modelSpec.title",
  );
  document.getElementById("searchText").placeholder = t(
    "admin.modelSpec.searchPlaceholder",
  );
  document.getElementById("btn-add-spec").textContent = t(
    "admin.modelSpec.addModel",
  );
  document.getElementById("importButton").textContent = t(
    "admin.modelSpec.importFile",
  );
  document.getElementById("exportButton").textContent = t(
    "admin.modelSpec.exportFile",
  );

  // Delivery
  document.getElementById("th-delivery").textContent = t(
    "admin.delivery.title",
  );
  document.getElementById("searchTextDelivery").placeholder = t(
    "admin.delivery.searchPlaceholder",
  );
  document.getElementById("lbl-factory").textContent = t(
    "admin.delivery.factoryLabel",
  );
  document.getElementById("lbl-from").childNodes[0].textContent = t(
    "admin.delivery.fromLabel",
  );
  document.getElementById("lbl-to").childNodes[0].textContent = t(
    "admin.delivery.toLabel",
  );



  // ── Model Spec table headers ────────────────────────────────────────
  document.getElementById("th-spec-stt").textContent = t(
    "admin.modelSpec.table.stt",
  );
  document.getElementById("th-spec-modelType").textContent = t(
    "admin.modelSpec.table.modelType",
  );
  document.getElementById("th-spec-mobisCode").textContent = t(
    "admin.modelSpec.table.mobisCode",
  );
  document.getElementById("th-spec-partronCode").textContent = t(
    "admin.modelSpec.table.partronCode",
  );
  document.getElementById("th-spec-modelName").textContent = t(
    "admin.modelSpec.table.modelName",
  );
  document.getElementById("th-spec-actions").textContent = t(
    "admin.modelSpec.table.actions",
  );

  // ── Delivery table headers ──────────────────────────────────────────
  document.getElementById("th-del-stt").textContent = t(
    "admin.delivery.table.stt",
  );
  document.getElementById("th-del-modelId").textContent = t(
    "admin.delivery.table.modelId",
  );
  document.getElementById("th-del-mobisCode").textContent = t(
    "admin.delivery.table.mobisCode",
  );
  document.getElementById("th-del-modelName").textContent = t(
    "admin.delivery.table.modelName",
  );
  document.getElementById("th-del-type").textContent = t(
    "admin.delivery.table.type",
  );
  document.getElementById("th-del-target").textContent = t(
    "admin.delivery.table.target",
  );
  document.getElementById("th-del-quantity").textContent = t(
    "admin.delivery.table.quantity",
  );
  document.getElementById("th-del-status").textContent = t(
    "admin.delivery.table.status",
  );
  document.getElementById("th-del-completeTime").textContent = t(
    "admin.delivery.table.completeTime",
  );
  document.getElementById("th-del-shippingDate").textContent = t(
    "admin.delivery.table.shippingDate",
  );
  document.getElementById("th-del-shippingMethod").textContent = t(
    "admin.delivery.table.shippingMethod",
  );
  document.getElementById("th-del-actions").textContent = t(
    "admin.delivery.table.actions",
  );
}

// ─── User profile ─────────────────────────────────────────────────────────────
async function getUserProfile() {
  const res = await fetch("/exportmanagement/profile", {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json();
  return data.user;
}

// ─── Overview & Charts ────────────────────────────────────────────────────────
async function initOverview(user) {
  const factory = user.factory || "V4";
  if (
    !document.getElementById("monthlyChart") ||
    !document.getElementById("orderChart")
  )
    return;

  const overviewRes = await fetch(
    `/exportmanagement/api/getoverview?factory=${factory}`,
    { headers: { "Content-Type": "application/json" } },
  );
  const overviewData = await overviewRes.json();
  document.getElementById("totalInDay").textContent =
    overviewData.totalExport || "0";
  document.getElementById("performance").textContent =
    overviewData.performanceInDay
      ? Math.round(overviewData.performanceInDay) + "%"
      : "0%";

  const monthlyRes = await fetch(
    `/exportmanagement/api/getmonthlyperformance?factory=${factory}`,
    { headers: { "Content-Type": "application/json" } },
  );
  const monthlyData = await monthlyRes.json();

  Highcharts.chart("monthlyChart", {
    accessibility: { enabled: false },
    chart: { type: "spline", backgroundColor: "transparent", height: 300 },
    responsive: {
      rules: [
        {
          condition: { maxWidth: 500 },
          chartOptions: { chart: { height: 300 } },
        },
      ],
    },
    title: { text: null },
    xAxis: {
      categories: monthlyData.months,
      labels: { style: { color: "#ffffff" } },
    },
    yAxis: {
      title: {
        text: t("admin.charts.monthlyPerformance.yAxisLabel"),
        style: { color: "#ffffff" },
      },
      labels: { style: { color: "#ffffff" } },
      gridLineColor: "rgba(255,255,255,0.1)",
    },
    legend: { enabled: false },
    series: [
      {
        name: t("admin.charts.monthlyPerformance.seriesName"),
        data: monthlyData.totals,
        color: "#007FFF",
        lineWidth: 3,
      },
    ],
    credits: { enabled: false },
  });

  const statusRes = await fetch(
    `/exportmanagement/api/getstatuscount?factory=${factory}`,
    { headers: { "Content-Type": "application/json" } },
  );
  const statusData = await statusRes.json();

  Highcharts.chart("orderChart", {
    accessibility: { enabled: false },
    chart: { type: "pie", backgroundColor: "transparent" },
    responsive: {
      rules: [
        {
          condition: { maxWidth: 500 },
          chartOptions: { chart: { height: 300 } },
        },
      ],
    },
    title: { text: null },
    plotOptions: {
      series: {
        dataLabels: [
          {
            enabled: true,
            distance: 20,
            format: "{point.name}",
            style: { fontSize: "0.7em", color: "white", textOutline: "none" },
          },
          {
            enabled: true,
            distance: -15,
            format: "{point.percentage:.0f}%",
            style: { fontSize: "0.7em", color: "white", textOutline: "none" },
          },
        ],
      },
      pie: {
        innerSize: "60%",
        dataLabels: { enabled: false },
        showInLegend: true,
      },
    },
    legend: {
      align: "center",
      verticalAlign: "bottom",
      itemStyle: { color: "#ffffff" },
    },
    series: [
      {
        name: t("admin.charts.shipmentStatus.seriesName"),
        data: [
          {
            name: t("admin.charts.shipmentStatus.complete"),
            y: statusData.completed || 0,
            color: "#10b981",
          },
          {
            name: t("admin.charts.shipmentStatus.inProgress"),
            y: statusData.inProgress || 0,
            color: "#f59e0b",
          },
        ],
      },
    ],
    credits: { enabled: false },
  });
}

function rerenderCharts() {
  Highcharts.chart("monthlyChart", {
    chart: { type: "line", backgroundColor: "transparent", height: 250 },
    title: { text: null },
    xAxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      labels: { style: { color: "#ffffff" } },
    },
    yAxis: {
      title: {
        text: t("admin.charts.monthlyPerformance.yAxisLabel"),
        style: { color: "#ffffff" },
      },
      labels: { style: { color: "#ffffff" } },
      gridLineColor: "rgba(255,255,255,0.1)",
    },
    legend: { enabled: false },
    series: [
      {
        name: t("admin.charts.monthlyPerformance.seriesName"),
        data: [0, 0, 0, 0, 0, 0],
        color: "#007FFF",
        lineWidth: 3,
      },
    ],
    credits: { enabled: false },
  });
  Highcharts.chart("orderChart", {
    chart: { type: "pie", backgroundColor: "transparent", height: 250 },
    title: { text: null },
    plotOptions: {
      pie: {
        innerSize: "60%",
        dataLabels: { enabled: false },
        showInLegend: true,
      },
    },
    legend: {
      align: "center",
      verticalAlign: "bottom",
      itemStyle: { color: "#ffffff" },
    },
    series: [
      {
        name: t("admin.charts.shipmentStatus.seriesName"),
        data: [
          {
            name: t("admin.charts.shipmentStatus.complete"),
            y: 0,
            color: "#10b981",
          },
          {
            name: t("admin.charts.shipmentStatus.inProgress"),
            y: 0,
            color: "#f59e0b",
          },
        ],
      },
    ],
    credits: { enabled: false },
  });
}


// ─── Model Spec ───────────────────────────────────────────────────────────────
async function initSpecModel() {
  const specTableBody = document.getElementById("specTableBody");
  const searchText = document.getElementById("searchText");
  specTableBody.innerHTML = "";

  document
    .getElementById("exportButton")
    .removeEventListener("click", exportToCSV);
  document
    .getElementById("exportButton")
    .addEventListener("click", exportToCSV);
  document
    .getElementById("importButton")
    .removeEventListener("click", importFromCSV);
  document
    .getElementById("importButton")
    .addEventListener("click", importFromCSV);

  const res = await fetch("/exportmanagement/models", {
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();

  data.forEach((spec, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td class="model-type">${spec.model_type || ""}</td>
      <td class="mobis-code">${spec.mobis_code || ""}</td>
      <td class="partron-code">${spec.partron_code || ""}</td>
      <td class="model-name">${spec.model_name || ""}</td>
      <td>
        <button class="edit-model"   data-id="${spec.id}">${t("admin.modelSpec.buttons.edit")}</button>
        <button class="delete-model" data-id="${spec.id}">${t("admin.modelSpec.buttons.delete")}</button>
      </td>`;
    specTableBody.appendChild(row);
  });

  searchText.addEventListener("input", function () {
    const filter = this.value.trim().toLowerCase();
    Array.from(specTableBody.getElementsByTagName("tr")).forEach((row) => {
      const cells = Array.from(row.getElementsByTagName("td")).slice(0, -1);
      let match = false;
      cells.forEach((cell) => {
        const orig =
          cell.getAttribute("data-original-text") || cell.textContent;
        if (!cell.getAttribute("data-original-text"))
          cell.setAttribute("data-original-text", orig);
        if (filter && orig.toLowerCase().includes(filter)) {
          match = true;
          cell.innerHTML = orig.replace(
            new RegExp(`(${filter})`, "gi"),
            "<mark>$1</mark>",
          );
        } else {
          cell.innerHTML = orig;
        }
      });
      row.style.display = match || filter === "" ? "" : "none";
    });
  });

  specTableBody.removeEventListener("click", handleModelTableClick);
  specTableBody.addEventListener("click", handleModelTableClick);

  const addSpecBtn = document.querySelector(".add-spec");
  addSpecBtn.removeEventListener("click", handleAddSpec);
  addSpecBtn.addEventListener("click", handleAddSpec);
}

function handleAddSpec() {
  const specTableBody = document.getElementById("specTableBody");
  if (specTableBody.querySelector(".add-new-row")) {
    alert(t("admin.modelSpec.alerts.pendingRow"));
    return;
  }

  const nextStt =
    specTableBody.querySelectorAll("tr:not(.add-new-row)").length + 1;
  const newRow = document.createElement("tr");
  newRow.classList.add("add-new-row");
  newRow.innerHTML = `
    <td>${nextStt}</td>
    <td class="model-type">  <input type="text" placeholder="${t("admin.modelSpec.form.modelTypePlaceholder")}"   class="edit-input model-type-input"   required/></td>
    <td class="mobis-code">  <input type="text" placeholder="${t("admin.modelSpec.form.mobisCodePlaceholder")}"   class="edit-input mobis-code-input"   required/></td>
    <td class="partron-code"><input type="text" placeholder="${t("admin.modelSpec.form.partronCodePlaceholder")}" class="edit-input partron-code-input" required/></td>
    <td class="model-name">  <input type="text" placeholder="${t("admin.modelSpec.form.modelNamePlaceholder")}"   class="edit-input model-name-input"   required/></td>
    <td>
      <button class="edit-model save-new-model">${t("admin.modelSpec.buttons.save")}</button>
      <button class="delete-model cancel-new-model">${t("admin.modelSpec.buttons.cancel")}</button>
    </td>`;

  specTableBody.appendChild(newRow);
  newRow.querySelector(".model-type-input").focus();
  newRow
    .querySelector(".save-new-model")
    .addEventListener("click", () => saveNewModel(newRow));
  newRow
    .querySelector(".cancel-new-model")
    .addEventListener("click", () => cancelNewModel(newRow));
  newRow.querySelectorAll("input").forEach((inp) =>
    inp.addEventListener("keypress", (e) => {
      if (e.key === "Enter") saveNewModel(newRow);
    }),
  );
}

async function saveNewModel(row) {
  const modelType = row.querySelector(".model-type-input").value.trim();
  const mobisCode = row.querySelector(".mobis-code-input").value.trim();
  const partronCode = row.querySelector(".partron-code-input").value.trim();
  const modelName = row.querySelector(".model-name-input").value.trim();

  if (!modelType) {
    alert(t("admin.modelSpec.alerts.modelTypeRequired"));
    row.querySelector(".model-type-input").focus();
    return;
  }
  if (!mobisCode) {
    alert(t("admin.modelSpec.alerts.mobisCodeRequired"));
    row.querySelector(".mobis-code-input").focus();
    return;
  }
  if (!partronCode) {
    alert(t("admin.modelSpec.alerts.partronCodeRequired"));
    row.querySelector(".partron-code-input").focus();
    return;
  }
  if (!modelName) {
    alert(t("admin.modelSpec.alerts.modelNameRequired"));
    row.querySelector(".model-name-input").focus();
    return;
  }

  const saveBtn = row.querySelector(".save-new-model");
  saveBtn.textContent = t("admin.modelSpec.buttons.saving");
  saveBtn.disabled = true;

  try {
    const res = await fetch("/exportmanagement/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model_type: modelType,
        mobis_code: mobisCode,
        partron_code: partronCode,
        model_name: modelName,
      }),
    });
    if (res.ok) {
      alert(t("admin.modelSpec.alerts.addSuccess"));
      await initSpecModel();
    } else {
      const data = await res.json();
      alert(
        "Error: " + (data.message || t("admin.modelSpec.alerts.unknownError")),
      );
      saveBtn.textContent = t("admin.modelSpec.buttons.save");
      saveBtn.disabled = false;
    }
  } catch (err) {
    alert(t("admin.modelSpec.alerts.connectionError") + err.message);
    saveBtn.textContent = t("admin.modelSpec.buttons.save");
    saveBtn.disabled = false;
  }
}

function cancelNewModel(row) {
  if (confirm(t("admin.modelSpec.alerts.confirmCancelModel"))) row.remove();
}

async function handleModelTableClick(e) {
  const row = e.target.closest("tr");
  const id = e.target.dataset.id;

  if (e.target.classList.contains("edit-model")) {
    if (e.target.textContent === t("admin.modelSpec.buttons.edit")) {
      const modelTypeTd = row.querySelector(".model-type");
      const mobisCodeTd = row.querySelector(".mobis-code");
      const partronCodeTd = row.querySelector(".partron-code");
      const modelNameTd = row.querySelector(".model-name");

      modelTypeTd.innerHTML = `<input type="text" value="${modelTypeTd.textContent.trim()}"   class="edit-input model-type-input"/>`;
      mobisCodeTd.innerHTML = `<input type="text" value="${mobisCodeTd.textContent.trim()}"   class="edit-input mobis-code-input"/>`;
      partronCodeTd.innerHTML = `<input type="text" value="${partronCodeTd.textContent.trim()}" class="edit-input partron-code-input"/>`;
      modelNameTd.innerHTML = `<input type="text" value="${modelNameTd.textContent.trim()}"   class="edit-input model-name-input"/>`;

      e.target.textContent = t("admin.modelSpec.buttons.save");
      e.target.nextElementSibling.textContent = t(
        "admin.modelSpec.buttons.cancel",
      );
    } else if (e.target.textContent === t("admin.modelSpec.buttons.save")) {
      const updatedModel = {
        model_type: row.querySelector(".model-type-input").value.trim(),
        mobis_code: row.querySelector(".mobis-code-input").value.trim(),
        partron_code: row.querySelector(".partron-code-input").value.trim(),
        model_name: row.querySelector(".model-name-input").value.trim(),
        event_user: JSON.parse(localStorage.getItem("user")).username,
      };
      if (
        !updatedModel.model_type ||
        !updatedModel.mobis_code ||
        !updatedModel.partron_code ||
        !updatedModel.model_name
      ) {
        alert(t("admin.modelSpec.alerts.allFieldsRequired"));
        return;
      }
      e.target.disabled = true;
      try {
        const res = await fetch(`/exportmanagement/models/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedModel),
        });
        if (res.ok) {
          alert(t("admin.modelSpec.alerts.updateSuccess"));
        } else {
          const d = await res.json();
          alert(
            "Error: " + (d.message || t("admin.modelSpec.alerts.unknownError")),
          );
        }
      } catch (err) {
        alert(t("admin.modelSpec.alerts.connectionError") + err.message);
      }
      await initSpecModel();
    }
  }

  if (e.target.classList.contains("delete-model")) {
    if (e.target.textContent === t("admin.modelSpec.buttons.delete")) {
      if (confirm(t("admin.modelSpec.alerts.confirmDeleteModel"))) {
        try {
          const res = await fetch(`/exportmanagement/models/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
          });
          if (res.ok) {
            alert(t("admin.modelSpec.alerts.deleteSuccess"));
          } else {
            const d = await res.json();
            alert(
              "Error: " +
                (d.message || t("admin.modelSpec.alerts.unknownError")),
            );
          }
        } catch (err) {
          alert(t("admin.modelSpec.alerts.connectionError") + err.message);
        }
        await initSpecModel();
      }
    } else if (e.target.textContent === t("admin.modelSpec.buttons.cancel")) {
      await initSpecModel();
    }
  }
}

// ─── CSV Export / Import ──────────────────────────────────────────────────────
async function exportToCSV() {
  const rows = document.getElementById("specTableBody").querySelectorAll("tr");
  if (rows.length === 0) {
    alert(t("admin.modelSpec.alerts.noDataExport"));
    return;
  }

  let csv =
    "data:text/csv;charset=utf-8,ModelType,MobisCode,PartronCode,ModelName\n";
  rows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td")).slice(1, -1);
    csv +=
      cells.map((td) => td.textContent.trim().replace(/,/g, "")).join(",") +
      "\n";
  });

  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csv));
  link.setAttribute("download", "model_spec_data.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function importFromCSV() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".csv";
  fileInput.click();

  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      alert(t("admin.modelSpec.alerts.invalidCsvFile"));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const lines = e.target.result.split("\n").slice(1);
      const newSpecs = [];
      const user = JSON.parse(localStorage.getItem("user")).username;

      for (const line of lines) {
        const [model_type, mobis_code, partron_code, model_name] = line
          .split(",")
          .map((s) => s.trim());
        if (model_type && mobis_code && partron_code && model_name) {
          newSpecs.push({
            model_type,
            mobis_code,
            partron_code,
            model_name,
            event_user: user,
          });
        }
      }

      if (newSpecs.length === 0) {
        alert(t("admin.modelSpec.alerts.noValidCsvData"));
        return;
      }

      try {
        const res = await fetch("/exportmanagement/models/importmodelspec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ specs: newSpecs }),
        });
        if (res.ok) {
          alert(t("admin.modelSpec.alerts.importSuccess"));
          await initSpecModel();
        } else {
          const d = await res.json();
          alert(
            "Error: " + (d.message || t("admin.modelSpec.alerts.unknownError")),
          );
        }
      } catch (err) {
        alert(t("admin.modelSpec.alerts.connectionError") + err.message);
      }
    };
    reader.readAsText(file);
  };
}

// ─── Delivery ─────────────────────────────────────────────────────────────────
async function initDelivery() {
  const tbody = document.getElementById("DeliveryTableBody");
  const searchInput = document.getElementById("searchTextDelivery");
  const factorySelect = document.getElementById("factorySelect");
  const dateFrom = document.getElementById("deliveryDateFrom");
  const dateTo = document.getElementById("deliveryDateTo");
  tbody.innerHTML = "";

  const res = await fetch(`/exportmanagement/delivery/${factorySelect.value}`, {
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();

  data.forEach((d, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td class="model-type">${d.model_id || ""}</td>
      <td class="mobis-code">${d.mobis_code || ""}</td>
      <td class="partron-code">${d.model_name || ""}</td>
      <td class="model-name">${d.type || ""}</td>
      <td class="model-name">${d.target || ""}</td>
      <td class="model-name">${d.quantity || ""}</td>
      <td class="model-name"><span class="status-badge ${d.status.toLowerCase()}">${d.status || ""}</span></td>
      <td class="model-name">${dayjs(d.complete_time).format("YYYY-MM-DD HH:mm:ss") || ""}</td>
      <td class="model-name">${dayjs(d.shipment_date).format("YYYY-MM-DD") || ""}</td>
      <td class="model-name">${d.shipping_method || ""}</td>
      <td>
        <button class="delete-model" data-model-id="${d.model_id}" data-factory="${factorySelect.value}">
          ${t("admin.delivery.buttons.delete")}
        </button>
      </td>`;
    tbody.appendChild(row);
  });

  function checkDateFilter(row) {
    const from = dateFrom.value ? dayjs(dateFrom.value).startOf("day") : null;
    const to = dateTo.value ? dayjs(dateTo.value).endOf("day") : null;
    if (!from && !to) return true;
    if (!row.cells || row.cells.length < 9) return true;
    const cell = row.cells[8].textContent.trim();
    if (!cell) return false;
    const d = dayjs(cell, "YYYY-MM-DD HH:mm:ss");
    if (!d.isValid()) return false;
    if (from && d.isBefore(from)) return false;
    if (to && d.isAfter(to)) return false;
    return true;
  }

  function applyFilters() {
    const filter = searchInput.value.trim().toLowerCase();
    Array.from(tbody.getElementsByTagName("tr")).forEach((row) => {
      const cells = row.getElementsByTagName("td");
      let textMatch = false;
      [cells[1], cells[2], cells[3]].forEach((cell) => {
        const orig =
          cell.getAttribute("data-original-text") || cell.textContent;
        if (!cell.getAttribute("data-original-text"))
          cell.setAttribute("data-original-text", orig);
        if (filter && orig.toLowerCase().includes(filter)) {
          textMatch = true;
          cell.innerHTML = orig.replace(
            new RegExp(`(${filter})`, "gi"),
            "<mark>$1</mark>",
          );
        } else {
          cell.innerHTML = orig;
        }
      });
      row.style.display =
        (textMatch || filter === "") && checkDateFilter(row) ? "" : "none";
    });
  }

  function clearAllFilters() {
    searchInput.value = "";
    dateFrom.value = "";
    dateTo.value = "";
    applyFilters();
  }

  searchInput.removeEventListener("input", applyFilters);
  searchInput.addEventListener("input", applyFilters);
  dateFrom.removeEventListener("change", applyFilters);
  dateTo.removeEventListener("change", applyFilters);
  dateFrom.addEventListener("change", applyFilters);
  dateTo.addEventListener("change", applyFilters);

  const clearBtn = document.getElementById("clearFilters");
  if (clearBtn) {
    clearBtn.removeEventListener("click", clearAllFilters);
    clearBtn.addEventListener("click", clearAllFilters);
  }

  factorySelect.removeEventListener("change", initDelivery);
  factorySelect.addEventListener("change", initDelivery);

  tbody.removeEventListener("click", handleDeliveryTableClick);
  tbody.addEventListener("click", handleDeliveryTableClick);
}

async function handleDeliveryTableClick(e) {
  if (!e.target.classList.contains("delete-model")) return;
  const modelId = e.target.dataset.modelId;
  const factory = e.target.dataset.factory.toLowerCase();

  if (confirm(t("admin.delivery.alerts.confirmDelete"))) {
    try {
      const res = await fetch(
        `/exportmanagement/delivery?modelid=${modelId}&factory=${factory}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (res.ok) {
        alert(t("admin.delivery.alerts.deleteSuccess"));
        await initDelivery();
      } else {
        const d = await res.json();
        alert(
          "Error: " + (d.message || t("admin.delivery.alerts.unknownError")),
        );
      }
    } catch (err) {
      alert(t("admin.delivery.alerts.connectionError") + err.message);
    }
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Init i18n
  await I18n.init("en");
  t = (key, params) => I18n.t(key, params);

  // 2. Apply static labels
  await applyLang();

  try {
    // 3. Load user profile
    const user = await getUserProfile();
    localStorage.setItem("user", JSON.stringify(user));

    // 4. Pass user to <app-header> so the change-password modal is pre-filled
    const header = document.querySelector("app-header");
    if (header?.setUser) header.setUser(user);

    // 5. Welcome message
    document.getElementById("welcome").textContent =
      user.role === "MANAGER"
        ? t("admin.welcomeManager", { name: user.username || "Admin" })
        : t("admin.welcomeUser");

    // 6. Init all sections
    await initOverview(user);
    await initSpecModel();
    await initDelivery();
  } catch (err) {
    console.error("Initialization error:", err);
    rerenderCharts();
  }
});
