import I18n from "/i18n.js";

// ─── Global translation handle ────────────────────────────────────────────────
let t = (key, params) => key;

// ─── User profile ─────────────────────────────────────────────────────────────
async function getUserProfile() {
  const res = await fetch("/exportmanagement/profile", {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json();
  return data.user;
}

// ─── Apply language ───────────────────────────────────────────────────────────
function applyLang() {
  document.title = t("dashboard.title") || "Dashboard";

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set("lbl-total-in-day", t("admin.stats.totalInDay") || "Total in day");
  set("lbl-performance", t("admin.charts.shipmentStatus.complete") || "Complete");
  set("lbl-chart-monthly-title", t("admin.charts.monthlyPerformance.title") || "Monthly Performance");
  set("lbl-chart-monthly-sub", t("admin.charts.monthlyPerformance.subtitle") || "Export count over the last 6 months");
  set("lbl-chart-status-title", t("admin.charts.shipmentStatus.title") || "Shipment Status");
  set("lbl-chart-status-sub", t("admin.charts.shipmentStatus.subtitle") || "Current order status distribution");
  set("lbl-top-models-title", t("dashboard.topModels.title") || "Top Exported Models This Month");
  set("th-top-modelType", t("admin.modelSpec.table.modelType") || "Model Type");
  set("th-top-mobisCode", t("admin.delivery.table.mobisCode") || "Mobis Code");
  set("th-top-modelName", t("admin.delivery.table.modelName") || "Model Name");
  set("th-top-total", t("dashboard.topModels.totalExported") || "Total Exported");
}

// ─── Init Overview (combined V0 + V5) ─────────────────────────────────────────
async function initOverview() {
  // Overview - combined (V0 + V5)
  const overviewRes = await fetch(`/exportmanagement/api/getoverview?factory=ALL`, {
    headers: { "Content-Type": "application/json" },
  });
  const overviewData = await overviewRes.json();

  const totalToday = overviewData.totalExport || 0;
  const completedToday = overviewData.completedToday ?? 0;

  document.getElementById("totalInDay").textContent = totalToday;
  document.getElementById("performance").textContent = completedToday;

  return { overviewData };
}

// ─── Init Charts ──────────────────────────────────────────────────────────────
async function initCharts() {
  // Monthly performance - combined
  const monthlyRes = await fetch(`/exportmanagement/api/getmonthlyperformance?factory=ALL`, {
    headers: { "Content-Type": "application/json" },
  });
  const monthlyData = await monthlyRes.json();

  const isLight = document.body.classList.contains("light-theme");
  const textColor = isLight ? "#1f2937" : "#ffffff";
  const gridColor = isLight ? "#e5e7eb" : "rgba(255,255,255,0.1)";

  Highcharts.chart("monthlyChart", {
    accessibility: { enabled: false },
    chart: { type: "spline", backgroundColor: "transparent", height: 300 },
    title: { text: null },
    xAxis: {
      categories: monthlyData.months,
      labels: { style: { color: textColor } },
    },
    yAxis: {
      title: {
        text: t("admin.charts.monthlyPerformance.yAxisLabel") || "Exports",
        style: { color: textColor },
      },
      labels: { style: { color: textColor } },
      gridLineColor: gridColor,
    },
    legend: { enabled: false },
    series: [
      {
        name: t("admin.charts.monthlyPerformance.seriesName") || "Exports",
        data: monthlyData.totals,
        color: "#007FFF",
        lineWidth: 3,
      },
    ],
    credits: { enabled: false },
  });

  // Status pie - combined
  const statusRes2 = await fetch(`/exportmanagement/api/getstatuscount?factory=ALL`, {
    headers: { "Content-Type": "application/json" },
  });
  const statusData = await statusRes2.json();

  Highcharts.chart("orderChart", {
    accessibility: { enabled: false },
    chart: { type: "pie", backgroundColor: "transparent" },
    title: { text: null },
    plotOptions: {
      series: {
        dataLabels: [
          {
            enabled: true,
            distance: 20,
            format: "{point.name}",
            style: { fontSize: "0.7em", color: textColor, textOutline: "none" },
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
      itemStyle: { color: textColor },
    },
    series: [
      {
        name: t("admin.charts.shipmentStatus.seriesName") || "Orders",
        data: [
          {
            name: t("admin.charts.shipmentStatus.complete") || "Complete",
            y: statusData.completed || 0,
            color: "#10b981",
          },
          {
            name: t("admin.charts.shipmentStatus.inProgress") || "In Progress",
            y: statusData.inProgress || 0,
            color: "#f59e0b",
          },
        ],
      },
    ],
    credits: { enabled: false },
  });
}

// ─── Init Top Models ──────────────────────────────────────────────────────────
async function initTopModels() {
  const tbody = document.getElementById("topModelsBody");

  try {
    const res = await fetch(`/exportmanagement/api/gettopmodels`, {
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = `<tr class="no-data-row"><td colspan="5">${t("dashboard.topModels.noData") || "No data for this month"}</td></tr>`;
      document.getElementById("topModelsBadge").textContent = "0 models";
      return;
    }

    document.getElementById("topModelsBadge").textContent = `${data.length} models`;

    tbody.innerHTML = data
      .map((item, i) => {
        return `<tr>
          <td>${i + 1}</td>
          <td>${item.model_type || ""}</td>
          <td>${item.mobis_code || ""}</td>
          <td>${item.model_name || ""}</td>
          <td class="total-qty">${item.total_exported.toLocaleString()}</td>
        </tr>`;
      })
      .join("");
  } catch (err) {
    console.error("Error fetching top models:", err);
    tbody.innerHTML = `<tr class="no-data-row"><td colspan="5">Error loading data</td></tr>`;
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await I18n.init("en");
  t = (key, params) => I18n.t(key, params);
  applyLang();

  try {
    const user = await getUserProfile();
    localStorage.setItem("user", JSON.stringify(user));

    const header = document.querySelector("app-header");
    if (header?.setUser) header.setUser(user);

    document.getElementById("welcome").textContent =
      user.role === "MANAGER"
        ? t("admin.welcomeManager", { name: user.username || "Admin" }) || `Welcome back, ${user.username || "Admin"}!`
        : t("admin.welcomeUser") || "Welcome!";

    await initOverview();
    await initCharts();
    await initTopModels();
  } catch (err) {
    console.error("Dashboard initialization error:", err);
  }
});

// Re-render charts on theme change
window.addEventListener("header:themeChange", () => {
  initCharts();
});

