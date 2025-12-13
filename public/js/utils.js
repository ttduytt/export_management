const isSavePass = localStorage.getItem("isSavePass");

export function formatDate(date) {
  // Nếu date là chuỗi => chuyển thành Date object
  const d = date instanceof Date ? date : new Date(date);

  // Trả về định dạng yyyy-MM-dd HH:mm:ss
  return d.toISOString().slice(0, 19).replace("T", " ");
}

export async function handleRefreshtoken(isSavePass) {
  try {
    const params = new URLSearchParams({ savePass: isSavePass }).toString();

    const res = await fetch(`/exportmanagement/refreshToken?${params}`, {
      method: "GET",
      credentials: "include",
    });

    if (res.status === 401 || res.status === 403) {
      globalThis.location.href = "/";
      return;
    }

    // Nếu có lỗi khác
    if (!res.ok) {
      globalThis.location.href = "/";
      return;
    }

    const data = await res.json();

    // Nếu backend trả về success = false
    if (!data.success) {
      globalThis.location.href = "/";
      return;
    }

    const refreshTime = 10000; // 10s trước khi hết hạn
    const timeNow = Date.now();
    let refreshAfter = data.expiredAt - timeNow - refreshTime;

    if (refreshAfter < 0) refreshAfter = 0;

    scheduleRefreshtoken(refreshAfter);
  } catch (error) {
    console.error("Refresh token request failed:", error);
    globalThis.location.href = "/";
  }
}

let refreshTimer = null;
export function scheduleRefreshtoken(refreshAfter) {
  // clear timer cũ
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  // tạo timer đặt thời gian refresh
  refreshTimer = setTimeout(() => {
    handleRefreshtoken(isSavePass);
  }, refreshAfter);
}
