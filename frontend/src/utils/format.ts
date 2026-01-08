// Format currency (USD)
export function formatUSD(amount: number | null | undefined): string {
  if (amount == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format currency (IDR)
export function formatIDR(amount: number | null | undefined): string {
  if (amount == null) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format percentage
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '-';
  return `${value.toFixed(1)}%`;
}

// Format date
export function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Format date time
export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format number
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-US').format(value);
}

// Get status color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Inquiry Status
    NEW: 'bg-blue-100 text-blue-800',
    QUOTED: 'bg-yellow-100 text-yellow-800',
    WON: 'bg-green-100 text-green-800',
    LOST: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',

    // Quotation Status
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-orange-100 text-orange-800',

    // Shipment Status
    BOOKED: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-indigo-100 text-indigo-800',
    IN_TRANSIT: 'bg-purple-100 text-purple-800',
    ARRIVED: 'bg-teal-100 text-teal-800',
    DELIVERED: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-green-100 text-green-800',

    // Payment Status
    PENDING: 'bg-yellow-100 text-yellow-800',
    INVOICED: 'bg-blue-100 text-blue-800',
    PARTIAL: 'bg-orange-100 text-orange-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
  };

  return colors[status] || 'bg-gray-100 text-gray-800';
}

// Combine class names
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
