import { API_ENDPOINTS } from "@/config/api";

export async function downloadBookingPdf(bookingId, fileLabel) {
  return downloadBookingFile(bookingId, fileLabel, "pdf");
}

export async function downloadBookingBill(bookingId, fileLabel) {
  return downloadBookingFile(bookingId, fileLabel, "bill");
}

async function downloadBookingFile(bookingId, fileLabel, kind) {
  const id = bookingId?._id || bookingId?.id || bookingId;
  if (!id) throw new Error("Booking is not ready yet");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
  const endpoint = kind === "bill"
    ? ((typeof API_ENDPOINTS.BOOKINGS?.BILL === "function" && API_ENDPOINTS.BOOKINGS.BILL(id)) || `/api/v1/bookings/${id}/bill`)
    : ((typeof API_ENDPOINTS.BOOKINGS?.PDF === "function" && API_ENDPOINTS.BOOKINGS.PDF(id)) || `/api/v1/bookings/${id}/pdf`);

  const res = await fetch(endpoint, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });

  const type = res.headers.get("content-type") || "";
  if (!res.ok) {
    const errBody = type.includes("application/json") ? await res.json().catch(() => ({})) : {};
    throw new Error(errBody.message || (kind === "bill" ? "Could not generate the bill" : "Could not download the guest PDF"));
  }

  if (type.includes("application/json")) {
    const data = await res.json();
    const url = data?.url || data?.data?.url || data?.pdf_url || data?.data?.pdf_url || data?.data?.pdfUrl || data?.data?.bill_url || data?.bill_url;
    if (!url) throw new Error(data?.message || "File link was not returned");
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  const blob = await res.blob();
  const fileUrl = URL.createObjectURL(new Blob([blob], { type: type.includes("pdf") ? "application/pdf" : type || "application/pdf" }));
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = `${fileLabel || `${kind}-${id}`}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.open(fileUrl, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(fileUrl), 60000);
}
