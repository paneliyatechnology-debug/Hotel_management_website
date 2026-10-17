import { API_ENDPOINTS, apiRequest } from "@/config/api";

export function folioMoney(booking) {
  if (!booking) return { total: 0, paid: 0, base: 0, gst: 0, due: 0 };
  const base = Number(booking.baseAmount || booking.base_amount || booking.room_amount || booking.roomAmount || 0);
  const gst = Number(booking.gstAmount || booking.gst_amount || booking.tax_amount || booking.taxAmount || 0);
  const explicit = Number(booking.totalAmount || booking.total_amount || booking.grand_total || booking.grandTotal || 0);
  const total = explicit || (base + gst);
  const paid = Number(
    booking.paidAmount ||
    booking.paid_amount ||
    booking.advancePaid ||
    booking.advance_paid ||
    booking.advancePaymentAmount ||
    booking.advance_payment_amount ||
    0
  );
  return { total, paid, base: base || (explicit ? Math.max(0, explicit - gst) : 0), gst, due: Math.max(0, total - paid) };
}

export async function loadBookingDetail(booking) {
  const id = booking?.id || booking?._id || booking?.bookingId || booking?.booking_id;
  if (!id) return booking || null;
  const endpoint = (typeof API_ENDPOINTS.BOOKINGS?.BY_ID === "function" && API_ENDPOINTS.BOOKINGS.BY_ID(id)) || `${API_ENDPOINTS.BOOKINGS.ALL}/${id}`;
  const res = await apiRequest(endpoint, { forceRefresh: true });
  const detail = res?.data && !Array.isArray(res.data) ? (res.data.data || res.data) : null;
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) return booking;
  return { ...booking, ...detail };
}
