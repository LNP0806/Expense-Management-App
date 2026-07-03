export function formatCurrency(amount) {
  if (amount == null) return '0 đ';
  // Use VND format, replacing currency symbol with 'đ' or formatting appropriately
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date);
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return formatDate(dateStr);
}

export function formatPercent(value) {
  if (value == null) return '0%';
  return `${Math.round(value)}%`;
}

export function getAmountDisplay(amount, type) {
  const formatted = formatCurrency(Math.abs(amount));
  if (type === 'INCOME') return { text: `+${formatted}`, className: 'amount-income' };
  return { text: `-${formatted}`, className: 'amount-expense' };
}

export function getTransactionTypeLabel(type) {
  return type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu';
}

export function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}
