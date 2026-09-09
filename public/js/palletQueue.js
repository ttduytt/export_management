// ─── Pallet Queue Manager ──────────────────────────────────────────────────
// Quản lý danh sách box đã scan cho pallet hiện tại (chưa export).
// Lưu trong localStorage để không mất dữ liệu khi refresh/mất mạng.
// Quy tắc: 1 máy tại 1 thời điểm chỉ có 1 pallet đang "mở".

const STORAGE_KEY = "pallet_queue_v1";
const TTL_MS = 12 * 60 * 60 * 1000; // 12 tiếng kể từ box đầu tiên

function loadRaw() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveRaw(queue) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

/**
 * Trả về { startedAt, items: [] } | null
 * Không tự xoá khi hết hạn — caller quyết định hỏi user có xoá hay không.
 */
function getQueue() {
  return loadRaw();
}

function isExpired(queue) {
  if (!queue || !queue.startedAt) return false;
  return Date.now() - queue.startedAt > TTL_MS;
}

/**
 * Thêm 1 box vừa scan thành công vào queue hiện tại.
 * item: { qr, partron_code, quantity, mobis_code, model_name, factory }
 */
function addScannedBox(item) {
  let queue = loadRaw();

  if (!queue) {
    queue = { startedAt: Date.now(), items: [] };
  }

  queue.items.push({
    ...item,
    scannedAt: Date.now(),
  });

  saveRaw(queue);
  return queue;
}

function clearQueue() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Gộp items theo partron_code, giữ thứ tự xuất hiện lần đầu.
 * Trả về [{ partron_code, totalQuantity, boxes: [{qr, quantity, scannedAt}] }]
 */
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
      scannedAt: item.scannedAt,
    });
  }
  return [...map.values()];
}

export default {
  getQueue,
  isExpired,
  addScannedBox,
  clearQueue,
  groupByPartronCode,
  TTL_MS,
};