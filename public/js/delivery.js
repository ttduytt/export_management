const gridBtn = document.getElementById("gridBtn");
const listBtn = document.getElementById("listBtn");
const gridView = document.getElementById("gridView");
const listView = document.getElementById("listView");
const tableHeader = document.getElementById("tableHeader");
const searchInput = document.getElementById("searchInput");

const data = [];

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
