import { API_ENDPOINTS } from "@/config/api";

export async function downloadBookingPdf(bookingId, fileLabel) {
  const id = bookingId?._id || bookingId?.id || bookingId;
  if (!id) throw new Error("Booking is not ready for a PDF yet");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
  const endpoint =
    (typeof API_ENDPOINTS.BOOKINGS?.PDF === "function" && API_ENDPOINTS.BOOKINGS.PDF(id)) ||
    `/api/v1/bookings/${id}/pdf`;

  const res = await fetch(endpoint, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });

  const type = res.headers.get("content-type") || "";
  if (!res.ok) {
    const errBody = type.includes("application/json") ? await res.json().catch(() => ({})) : {};
    throw new Error(errBody.message || "Could not download the guest PDF");
  }

  if (type.includes("application/json")) {
    const data = await res.json();
    const url = data?.url || data?.data?.url || data?.pdf_url || data?.data?.pdf_url || data?.data?.pdfUrl;
    if (!url) throw new Error(data?.message || "PDF link was not returned");
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  const blob = await res.blob();
  const fileUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = `${fileLabel || `guest-${id}`}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.open(fileUrl, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(fileUrl), 60000);
}
