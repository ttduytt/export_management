export function formatDate(date) {
  // Nếu date là chuỗi => chuyển thành Date object
  const d = date instanceof Date ? date : new Date(date);

  // Trả về định dạng yyyy-MM-dd HH:mm:ss
  return d.toISOString().slice(0, 19).replace("T", " ");
}
