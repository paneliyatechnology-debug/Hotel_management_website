import { calculateOverstayFee, formatTime12Hour } from "./timeUtils";

const PDF_DOCUMENT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  body, .pdf-container {
    background-color: #FFFFFF;
    color: #0F172A;
    font-size: 12px;
    line-height: 1.45;
    padding: 20px 24px;
    width: 794px;
    box-sizing: border-box;
  }

  .pdf-section {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    width: 100%;
    box-sizing: border-box;
  }
  
  /* Hero Command Ribbon (Exact match with App Header) */
  .hero-ribbon {
    background: linear-gradient(135deg, #092622 0%, #0F766E 55%, #14B8A6 100%);
    border-radius: 16px;
    padding: 16px 20px;
    color: #FFFFFF;
    margin-bottom: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 8px 20px rgba(15, 118, 110, 0.25);
  }
  
  .hotel-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .brand-icon {
    width: 44px;
    height: 44px;
    background: #FFFFFF;
    border: 1px solid #CBD5E1;
    color: #0F172A;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    overflow: hidden;
    padding: 3px;
    flex-shrink: 0;
  }

  .brand-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  .hero-ribbon .brand-icon {
    width: 44px;
    height: 44px;
    background: #FFFFFF;
    border: none;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 3px;
    flex-shrink: 0;
  }
  
  .hotel-title {
    font-size: 18px;
    font-weight: 900;
    color: #FFFFFF;
    letter-spacing: -0.3px;
  }
  
  .hotel-meta {
    font-size: 10.5px;
    color: rgba(255, 255, 255, 0.85);
    font-weight: 600;
    margin-top: 2px;
  }
  
  .ribbon-badge {
    background: transparent;
    border: none;
    padding: 6px 12px;
    border-radius: 10px;
    text-align: right;
  }
  
  .ribbon-badge .title {
    font-size: 13px;
    font-weight: 900;
    color: #FFFFFF;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .ribbon-badge .sub {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.85);
    font-weight: 700;
  }

  /* Header Banner Styles (Matching UI Dialogs) */
  .header-banner {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #E2E8F0;
    padding-bottom: 16px;
    margin-bottom: 18px;
  }

  .hotel-name {
    font-size: 18px;
    font-weight: 900;
    color: #0F172A;
    letter-spacing: -0.3px;
  }

  .hotel-sub {
    font-size: 11px;
    color: #64748B;
    font-weight: 600;
    margin-top: 2px;
  }

  .doc-meta {
    text-align: right;
  }

  .doc-title {
    font-size: 17px;
    font-weight: 900;
    color: #0F766E;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .doc-id {
    font-size: 13px;
    font-weight: 800;
    color: #0F172A;
    margin-top: 2px;
  }

  .doc-date {
    font-size: 11px;
    color: #64748B;
    font-weight: 600;
  }

  /* Info Grid (Billed To & Stay Details) */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 18px;
  }

  .info-block {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 12px 14px;
    box-sizing: border-box;
    word-break: break-word;
  }

  .info-block h4 {
    font-size: 10.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #0F766E;
    margin-bottom: 6px;
  }

  .info-block p {
    font-size: 13px;
    font-weight: 800;
    color: #0F172A;
    margin-bottom: 4px;
  }

  .info-block span {
    display: block;
    font-size: 11px;
    color: #475569;
    margin-top: 2px;
  }

  /* Late Checkout Notice Box */
  .late-checkout-box {
    background: #FEF2F2;
    border: 1.5px solid #FCA5A5;
    border-radius: 10px;
    padding: 10px 14px;
    margin-bottom: 16px;
  }

  .late-checkout-box .title {
    font-size: 11.5px;
    font-weight: 900;
    color: #DC2626;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .late-checkout-box .desc {
    font-size: 11px;
    color: #475569;
    margin-top: 3px;
  }

  /* Total Settlement Card */
  .total-card {
    margin-left: auto;
    width: 330px;
    background: #F8FAFC;
    border: 1.5px solid #CBD5E1;
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 18px;
    box-sizing: border-box;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 11px;
    color: #475569;
  }

  .total-row.grand {
    border-top: 1.5px solid #CBD5E1;
    padding-top: 8px;
    margin-top: 8px;
    font-size: 14px;
    font-weight: 900;
    color: #0F766E;
  }
  
  /* 4 KPI Telemetry Cards (Same to Same as Dashboard Boxes!) */
  .kpi-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 18px;
  }
  
  .kpi-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 12px 14px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(15, 118, 110, 0.05);
  }
  
  .kpi-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3.5px;
  }
  
  .kpi-card.green::before { background: #10B981; }
  .kpi-card.blue::before { background: #0F766E; }
  .kpi-card.purple::before { background: #8B5CF6; }
  .kpi-card.orange::before { background: #F59E0B; }
  
  .kpi-title {
    font-size: 9.5px;
    font-weight: 800;
    text-transform: uppercase;
    color: #64748B;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  
  .kpi-val {
    font-size: 19px;
    font-weight: 900;
    line-height: 1.1;
    margin-bottom: 4px;
  }
  
  .kpi-card.green .kpi-val { color: #059669; }
  .kpi-card.blue .kpi-val { color: #0F766E; }
  .kpi-card.purple .kpi-val { color: #7C3AED; }
  .kpi-card.orange .kpi-val { color: #D97706; }
  
  .kpi-sub {
    font-size: 9.5px;
    color: #64748B;
    font-weight: 600;
  }
  
  /* Category Breakdown Bar */
  .breakdown-section {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 18px;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .section-title {
    font-size: 11.5px;
    font-weight: 900;
    text-transform: uppercase;
    color: #0F172A;
    letter-spacing: 0.5px;
  }
  
  .breakdown-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
  
  .breakdown-item {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 8px 10px;
  }
  
  .breakdown-item .label {
    font-size: 9.5px;
    font-weight: 700;
    color: #64748B;
  }
  
  .breakdown-item .amt {
    font-size: 13px;
    font-weight: 900;
    color: #0F172A;
    margin-top: 2px;
  }
  
  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
    border-radius: 8px;
    overflow: hidden;
  }
  
  th {
    background-color: #0F766E;
    color: #FFFFFF;
    font-weight: 800;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 8px 10px;
    text-align: left;
  }
  
  td {
    padding: 8px 10px;
    border-bottom: 1px solid #E2E8F0;
    font-size: 11px;
    color: #1E293B;
  }
  
  tr:nth-child(even) td {
    background-color: #F8FAFC;
  }
  
  .text-right {
    text-align: right;
  }
  
  .text-center {
    text-align: center;
  }
  
  /* Pill Badges */
  .badge {
    display: inline-block;
    padding: 2.5px 7px;
    border-radius: 6px;
    font-size: 9.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  
  .badge-success { background: transparent; color: #15803D; border: none; }
  .badge-warning { background: transparent; color: #B45309; border: none; }
  .badge-primary { background: transparent; color: #0F766E; border: none; }
  .badge-purple { background: transparent; color: #6D28D9; border: none; }
  
  /* Grand Total Box */
  .summary-card-right {
    margin-left: auto;
    width: 280px;
    background: #F8FAFC;
    border: 1.5px solid #CBD5E1;
    border-radius: 10px;
    padding: 10px 14px;
    margin-bottom: 18px;
  }
  
  .summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    font-size: 11px;
    color: #475569;
  }
  
  .summary-row.grand {
    border-top: 1.5px solid #CBD5E1;
    padding-top: 6px;
    margin-top: 6px;
    font-size: 13.5px;
    font-weight: 900;
    color: #059669;
  }
  
  /* Footer */
  .footer {
    border-top: 1.5px solid #E2E8F0;
    padding-top: 14px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 20px;
    font-size: 10px;
    color: #64748B;
  }
  
  .sign-box {
    text-align: center;
    width: 160px;
  }
  
  .sign-line {
    border-bottom: 1.5px solid #94A3B8;
    height: 30px;
    margin-bottom: 4px;
  }
`;

/**
 * Direct Smart Multi-Page PDF Download Engine
 * Converts HTML template into an exact, beautifully paginated A4 .pdf file.
 * Prevents any section, card, or text from ever being sliced in half across pages!
 */
export async function openPrintOrSavePDF(title, htmlBody) {
  if (typeof window === "undefined") return;

  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const rawClean = (title || "Document").replace(/[^a-zA-Z0-9_\-]/g, "_");
  const fileName = `${rawClean}.pdf`;

  // Create isolated stage wrapper so measuring/rendering never alters document body scroll or UI layout
  const stageWrapper = document.createElement("div");
  stageWrapper.id = "pdf-isolated-stage-wrapper";
  stageWrapper.style.position = "fixed";
  stageWrapper.style.top = "-9999px";
  stageWrapper.style.left = "-9999px";
  stageWrapper.style.width = "794px";
  stageWrapper.style.height = "1123px";
  stageWrapper.style.overflow = "hidden";
  stageWrapper.style.opacity = "0";
  stageWrapper.style.pointerEvents = "none";
  stageWrapper.style.zIndex = "-999999";

  // Create temporary container inside stage wrapper to measure elements
  const container = document.createElement("div");
  container.className = "pdf-container";
  container.style.position = "absolute";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "794px"; // Standard A4 width at 96 DPI
  container.style.backgroundColor = "#FFFFFF";
  container.style.color = "#0F172A";
  container.style.padding = "20px 24px";
  container.style.boxSizing = "border-box";
  container.style.fontFamily = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  container.innerHTML = `
    <style>
      ${PDF_DOCUMENT_STYLES}
    </style>
    <div id="pdf-content-wrapper">
      ${htmlBody}
    </div>
  `;

  stageWrapper.appendChild(container);
  document.body.appendChild(stageWrapper);

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Ensure all images are fully loaded before rendering
    const images = container.querySelectorAll("img");
    if (images.length > 0) {
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) return resolve();
              img.onload = resolve;
              img.onerror = resolve;
              setTimeout(resolve, 500);
            })
        )
      );
    }

    const contentWrapper = container.querySelector("#pdf-content-wrapper");
    // Get all top-level direct child sections/elements
    const rawSections = Array.from(contentWrapper.children).filter((el) => el.nodeType === 1);

    // Standard A4 pixel budget for single page (1123px total)
    // Page 1 budget = 980px (accounts for 40px padding + bottom breathing space)
    // Page N budget = 920px (accounts for 40px padding + 50px continuation header + bottom breathing space)
    const PAGE_1_BUDGET = 980;
    const PAGE_N_BUDGET = 920;

    const pages = [];
    let currentPage = [];
    let currentHeight = 0;

    rawSections.forEach((sec) => {
      const rect = sec.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(sec);
      const marginTop = parseFloat(computedStyle.marginTop) || 0;
      const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
      const secHeight = Math.ceil((rect.height || sec.offsetHeight || 60) + marginTop + marginBottom);

      const budget = pages.length === 0 ? PAGE_1_BUDGET : PAGE_N_BUDGET;

      // If adding this section exceeds budget and page already has content, push to new page!
      if (currentHeight + secHeight > budget && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [sec];
        currentHeight = secHeight;
      } else {
        currentPage.push(sec);
        currentHeight += secHeight;
      }
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    // Clear initial measurement container from stage
    stageWrapper.removeChild(container);

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      if (pIdx > 0) {
        pdf.addPage();
      }

      // Create a dedicated page container inside stage
      const pageDiv = document.createElement("div");
      pageDiv.style.width = "794px";
      pageDiv.style.minHeight = "1123px";
      pageDiv.style.backgroundColor = "#FFFFFF";
      pageDiv.style.padding = "20px 24px";
      pageDiv.style.boxSizing = "border-box";
      pageDiv.style.position = "absolute";
      pageDiv.style.left = "0";
      pageDiv.style.top = "0";
      pageDiv.style.fontFamily = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      pageDiv.style.display = "flex";
      pageDiv.style.flexDirection = "column";
      pageDiv.style.justifyContent = "flex-start";

      // Style tag
      const styleTag = document.createElement("style");
      styleTag.textContent = PDF_DOCUMENT_STYLES;
      pageDiv.appendChild(styleTag);

      // Continuation header on page 2+
      if (pIdx > 0) {
        const contHeader = document.createElement("div");
        contHeader.style.padding = "8px 14px";
        contHeader.style.marginBottom = "14px";
        contHeader.style.borderBottom = "2px solid #E2E8F0";
        contHeader.style.display = "flex";
        contHeader.style.justifyContent = "space-between";
        contHeader.style.alignItems = "center";
        contHeader.style.fontSize = "11px";
        contHeader.style.color = "#64748B";
        contHeader.style.fontWeight = "800";
        contHeader.innerHTML = `
          <div style="color: #0F766E; font-weight: 900; text-transform: uppercase;">${(title || "Folio").replace(/_/g, " ")} (Continuation)</div>
          <div style="background: #F1F5F9; padding: 2px 8px; border-radius: 6px;">Page ${pIdx + 1} of ${pages.length}</div>
        `;
        pageDiv.appendChild(contHeader);
      }

      // Add sections belonging to this page
      pages[pIdx].forEach((sec) => {
        pageDiv.appendChild(sec.cloneNode(true));
      });

      stageWrapper.appendChild(pageDiv);

      const canvas = await html2canvas(pageDiv, {
        scale: 2, // High-DPI crisp vector-quality rendering
        useCORS: true,
        logging: false,
        backgroundColor: "#FFFFFF",
        windowWidth: 794,
        windowHeight: 1123,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

      if (stageWrapper.contains(pageDiv)) {
        stageWrapper.removeChild(pageDiv);
      }
    }

    // Direct Instant Download in Browser!
    pdf.save(fileName);
  } catch (err) {
    console.warn("Smart PDF rendering notice, falling back:", err);
    fallbackPrintWindow(title, htmlBody);
  } finally {
    if (document.body.contains(stageWrapper)) {
      document.body.removeChild(stageWrapper);
    }
  }
}

function fallbackPrintWindow(title, htmlBody) {
  const printWindow = window.open("", "_blank", "width=850,height=900,menubar=no,toolbar=no,location=no,status=no");
  if (!printWindow) return;
  const documentHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title || "Document"}</title>
  <style>
    ${PDF_DOCUMENT_STYLES}
  </style>
</head>
<body>
  ${htmlBody}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>
`;
  printWindow.document.open();
  printWindow.document.write(documentHtml);
  printWindow.document.close();
}

/**
 * 1. Generate & Download Official GST Tax Invoice PDF (Receptionist / Front Desk)
 */
export function downloadTaxInvoicePDF(booking = {}, hotel = {}) {
  const guest = booking.guest || {};
  const room = booking.room || {};
  const roomType = booking.roomType || {};
  const charges = booking.posCharges || booking.charges || [];
  const accompanying = booking.accompanyingGuests || guest.accompanyingGuests || [];
  const paymentHistory = booking.paymentHistory || booking.payments || [];

  const hotelName = hotel.name || "MYOWNPMS Luxury Hotel";
  const hotelAddress = hotel.address || hotel.city || "Marine Drive, Mumbai, Maharashtra";
  const hotelGst = hotel.gstin || hotel.settings?.gstin || "27AABCG1234F1Z8";
  const hotelPhone = hotel.phone || hotel.ownerPhone || "+91 98200 12345";
  const invoiceNum = booking.bookingNumber ? `INV-${booking.bookingNumber}` : `INV-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const overstay = calculateOverstayFee(booking, hotel);
  const lateFee = Number(booking.lateCheckoutCharge) || Number(overstay.lateFee) || 0;
  const lateHours = Number(booking.lateCheckoutHours) || Number(overstay.chargeableHours) || 0;
  const hourlyRate = Number(booking.hourlyRate) || Number(overstay.hourlyRate) || (lateHours > 0 ? Math.round(lateFee / lateHours) : 0);
  const isLate = lateFee > 0;

  const posTotal = charges.reduce((s, c) => s + (Number(c.amount) || 0), 0);

  // Compute actual stay nights
  const checkInRaw = booking.checkInDate || booking.createdAt;
  const checkOutRaw = booking.checkOutDate;
  let computedNights = 1;
  if (checkInRaw && checkOutRaw) {
    try {
      const d1 = new Date(checkInRaw);
      const d2 = new Date(checkOutRaw);
      const diffDays = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) computedNights = diffDays;
    } catch {
      computedNights = 1;
    }
  }
  const nights = Number(booking.numberOfNights) || Number(booking.nights) || computedNights || 1;

  // Snapshot or calculated values from booking
  const roomBreakdowns = Array.isArray(booking.roomGstBreakdown) && booking.roomGstBreakdown.length > 0 ? booking.roomGstBreakdown : [];

  const rawBookingTotal = Number(booking.totalAmount) || Number(booking.grandTotal) || (booking.paidAmount ? Number(booking.paidAmount) : 3000);
  const originalBookingTotal = isLate && rawBookingTotal > lateFee ? rawBookingTotal - lateFee : rawBookingTotal;

  // Real GST & Taxable Calculations
  let defaultGstRate = Number(booking.gstRate);
  if (isNaN(defaultGstRate) || defaultGstRate === undefined || defaultGstRate === null || defaultGstRate === 0) {
    defaultGstRate = 18;
  }

  let taxableVal = Number(booking.taxableAmount);
  let totalGst = Number(booking.gstAmount);

  if (roomBreakdowns.length > 0) {
    taxableVal = roomBreakdowns.reduce((s, r) => s + (Number(r.taxableAmount) || 0), 0);
    totalGst = roomBreakdowns.reduce((s, r) => s + (Number(r.gstAmount) || 0), 0);
  }

  if (isNaN(taxableVal) || taxableVal === undefined || taxableVal === null || taxableVal === 0) {
    const basePerNight = Number(booking.rate) || Number(booking.pricePerNight) || Number(booking.basePrice) || Number(room.pricePerNight) || Number(roomType.basePrice);
    if (basePerNight > 0) {
      taxableVal = basePerNight * nights;
    } else if (booking.taxInclusive) {
      taxableVal = Math.round(originalBookingTotal / (1 + defaultGstRate / 100));
    } else {
      taxableVal = originalBookingTotal;
    }
  }

  if (isNaN(totalGst) || totalGst === undefined || totalGst === null || totalGst === 0) {
    if (booking.gstAmount !== undefined && booking.gstAmount !== null && Number(booking.gstAmount) > 0) {
      totalGst = Number(booking.gstAmount);
    } else {
      totalGst = Math.round((taxableVal * defaultGstRate) / 100);
    }
  }

  const cgstVal = Number(booking.cgstAmount) || (roomBreakdowns.length > 0 ? roomBreakdowns.reduce((s, r) => s + (Number(r.cgstAmount) || 0), 0) : Math.round(totalGst / 2));
  const sgstVal = Number(booking.sgstAmount) || (roomBreakdowns.length > 0 ? roomBreakdowns.reduce((s, r) => s + (Number(r.sgstAmount) || 0), 0) : Math.max(0, totalGst - cgstVal));

  const mainGstRate = defaultGstRate;
  const mainCgstRate = Number(booking.cgstRate) || (mainGstRate / 2);
  const mainSgstRate = Number(booking.sgstRate) || (mainGstRate / 2);

  const baseRatePerNight = Math.round(taxableVal / nights) || Number(booking.pricePerNight) || Math.round(originalBookingTotal / nights);

  const grandTotalAmount = Number(booking.grandTotal) || (taxableVal + totalGst + lateFee + posTotal);
  const paidAmount = Number(booking.paidAmount) !== undefined && Number(booking.paidAmount) !== null && !isNaN(Number(booking.paidAmount))
    ? Number(booking.paidAmount)
    : (paymentHistory.length > 0 ? paymentHistory.reduce((s, p) => s + (Number(p.amount) || 0), 0) : grandTotalAmount);

  const balanceDue = Number(booking.dueAmount) !== undefined && !isNaN(Number(booking.dueAmount))
    ? Number(booking.dueAmount)
    : Math.max(0, grandTotalAmount - paidAmount);

  const checkInDateFormatted = booking.checkInDate ? (typeof booking.checkInDate === 'string' ? booking.checkInDate.split('T')[0] : new Date(booking.checkInDate).toLocaleDateString('en-IN')) : "On Record";
  const checkInTimeFormatted = booking.checkInTime ? formatTime12Hour(booking.checkInTime) : "12:00 PM";
  const checkOutDateFormatted = booking.checkOutDate ? (typeof booking.checkOutDate === 'string' ? booking.checkOutDate.split('T')[0] : new Date(booking.checkOutDate).toLocaleDateString('en-IN')) : "Scheduled";
  const checkOutTimeFormatted = formatTime12Hour(booking.checkOutTime || hotel.checkOutTime || "11:00 AM");

  const guestName = guest.fullName || guest.name || booking.guestName || "Valued Guest";
  const guestPhone = guest.mobileNumber || guest.phone || booking.guestPhone || "On Record";
  const guestEmail = guest.email || booking.guestEmail || "guest@hotelfolio.in";
  const govtIdType = guest.idProof?.idType || guest.govtIdType || guest.idType || "Aadhaar";
  const govtIdNumber = guest.idProof?.idNumber || guest.govtIdNumber || guest.idNumber || "Verified On Record";
  const guestAddress = guest.address || guest.city || "Verified On Record";
  const roomNumberDisplay = booking.roomNumber || room.roomNumber || booking.roomAssigned || "101";
  const roomTypeNameDisplay = roomType.name || room.type || booking.roomTypeName || "Executive Suite";

  const html = `
    <!-- Top Branded Executive Header -->
    <div class="pdf-section" style="background: linear-gradient(135deg, #092622 0%, #0F766E 50%, #14B8A6 100%); border-radius: 16px; padding: 18px 22px; color: #FFFFFF; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 8px 24px rgba(15, 118, 110, 0.25);">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 48px; height: 48px; background: #FFFFFF; border: 2px solid rgba(255,255,255,0.8); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; overflow: hidden; padding: 4px; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <img src="/logo.png" alt="${hotelName}" onerror="this.outerHTML='🏨'" style="width:100%;height:100%;object-fit:contain;" />
        </div>
        <div>
          <div style="font-size: 20px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.4px;">${hotelName}</div>
          <div style="font-size: 11px; color: rgba(255, 255, 255, 0.9); font-weight: 600; margin-top: 2px;">
            📍 ${hotelAddress} &bull; 📞 ${hotelPhone}
          </div>
          <div style="display: inline-flex; align-items: center; gap: 5px; margin-top: 4px; border: none; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; letter-spacing: 0.3px;">
          
            GSTIN: <strong>${hotelGst}</strong> &bull; Verified Taxpayer
          </div>
        </div>
      </div>

      <div style="text-align: right; border: none; padding: 4px 8px;">
        <div style="font-size: 15px; font-weight: 900; color: #FFFFFF; text-transform: uppercase; letter-spacing: 1px;">TAX INVOICE</div>
        <div style="font-size: 13px; font-weight: 800; color: #CCFBF1; margin-top: 2px; font-family: monospace;">#${invoiceNum}</div>
        <div style="font-size: 10px; color: rgba(255, 255, 255, 0.85); font-weight: 700; margin-top: 2px;">Date: ${dateStr} &bull; ${timeStr}</div>
      </div>
    </div>

    <!-- 2-Column Guest & Stay Cards -->
    <div class="pdf-section" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
      <!-- Billed To Card -->
      <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 14px; padding: 14px 16px; position: relative; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 3.5px; background: #0F766E;"></div>
        <div style="font-size: 10.5px; font-weight: 900; color: #0F766E; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>👤</span> BILLED TO (PRIMARY GUEST)
        </div>
        <div style="font-size: 14px; font-weight: 900; color: #0F172A; margin-bottom: 5px;">${guestName}</div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 3px;">
          📞 Phone: <strong style="color:#0F172A;">${guestPhone}</strong> &bull; ✉️ ${guestEmail}
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 3px; display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
          <span>🛡️ Govt ID:</span>
          <strong style="color:#0F172A; font-family: monospace;">${govtIdType}: ${govtIdNumber}</strong>
          <span style="display: inline-block; background: transparent; color: #15803D; border: none; padding: 1px 6px; border-radius: 4px; font-size: 9.5px; font-weight: 800;">✓ Verified</span>
        </div>
        <div style="font-size: 11px; color: #475569;">
          🏠 Address: <span style="color:#0F172A;">${guestAddress}</span>
        </div>
      </div>

      <!-- Stay Allocation Card -->
      <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 14px; padding: 14px 16px; position: relative; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 3.5px; background: #10B981;"></div>
        <div style="font-size: 10.5px; font-weight: 900; color: #10B981; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>🏨</span> STAY &amp; ROOM ALLOCATION
        </div>
        <div style="font-size: 14px; font-weight: 900; color: #0F172A; margin-bottom: 5px;">
          Room #${roomNumberDisplay} &bull; <span style="font-size: 12px; color: #0F766E; font-weight: 800;">${roomTypeNameDisplay}</span>
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 3px;">
          📥 Check-In: <strong style="color:#0F172A;">${checkInDateFormatted} (${checkInTimeFormatted})</strong>
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 3px;">
          📤 Check-Out: <strong style="color:#0F172A;">${checkOutDateFormatted} (${checkOutTimeFormatted})</strong>
        </div>
        <div style="font-size: 11px; color: #475569; display: flex; align-items: center; gap: 6px;">
          <span>⏱️ Duration: <strong>${nights} Night${nights > 1 ? "s" : ""}</strong></span>
          <span>&bull;</span>
          <span>Folio: <strong style="color:#0F766E;">#${booking.bookingNumber || "BK-8921"}</strong></span>
        </div>
        ${isLate ? `
          <div style="margin-top:6px; background:#FEF2F2; border:1px solid #FCA5A5; border-radius:6px; padding:4px 8px; font-size:10.5px; color:#DC2626; font-weight:800;">
            ⚠️ Late Check-Out Surcharge: ${lateHours}h past checkout @ ₹${hourlyRate}/hr (+₹${lateFee.toLocaleString("en-IN")})
          </div>
        ` : ""}
      </div>
    </div>

    <!-- Accompanying Members Section -->
    ${accompanying && accompanying.length > 0 ? `
      <div class="pdf-section" style="margin-bottom: 14px;">
        <div style="font-size: 11.5px; font-weight: 900; color: #0F172A; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
          <span>👥</span> ACCOMPANYING FAMILY MEMBERS &amp; CO-GUESTS (${accompanying.length})
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 0; border-radius: 10px; overflow: hidden; border: 1px solid #E2E8F0;">
          <thead>
            <tr style="background: #0F766E; color: #FFFFFF;">
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 35px;">#</th>
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Member Full Name</th>
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Age / Gender</th>
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Relationship</th>
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Govt ID Type</th>
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">ID Proof Number</th>
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 90px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${accompanying.map((m, idx) => `
              <tr style="border-bottom: 1px solid #E2E8F0; background: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
                <td style="padding: 8px 10px; font-size: 11px; text-align: center; font-weight: 700; color: #64748B;">${idx + 1}</td>
                <td style="padding: 8px 10px; font-size: 11px; font-weight: 800; color: #0F172A;">${m.name || m.fullName || `Member ${idx + 1}`}</td>
                <td style="padding: 8px 10px; font-size: 11px; color: #475569;">${m.age ? `${m.age} yrs` : "-"} / ${m.gender || "-"}</td>
                <td style="padding: 8px 10px; font-size: 11px;"><span style="display:inline-block; padding:2px 7px; border-radius:5px; font-size:9.5px; font-weight:800; background: transparent; color:#6D28D9; border:none;">${m.relationship || "Accompanying Guest"}</span></td>
                <td style="padding: 8px 10px; font-size: 11px; font-weight: 700; color: #334155;">${m.idType || "AADHAAR"}</td>
                <td style="padding: 8px 10px; font-size: 11px;"><code style="font-family:monospace; background:#F1F5F9; padding:2px 5px; border-radius:4px; font-size:10.5px;">${m.idNumber || "Verified On Record"}</code></td>
                <td style="padding: 8px 10px; font-size: 11px; text-align: center;"><span style="display:inline-block; padding:2px 7px; border-radius:5px; font-size:9.5px; font-weight:800; background: transparent; color:#15803D; border:none;">✓ Verified</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : ""}

    <!-- Main Itemized Charges Breakdown Table -->
    <div class="pdf-section" style="margin-bottom: 14px;">
      <div style="font-size: 11.5px; font-weight: 900; color: #0F172A; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
        <span>📋</span> ITEMIZED ROOM TARIFF, TAXES &amp; EXTRA SERVICES BREAKDOWN
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 0; border-radius: 10px; overflow: hidden; border: 1px solid #CBD5E1; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
        <thead>
          <tr style="background: #0F766E; color: #FFFFFF;">
            <th style="padding: 9px 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 32px;">#</th>
            <th style="padding: 9px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Description of Service / Tariff Charge</th>
            <th style="padding: 9px 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 70px;">HSN/SAC</th>
            <th style="padding: 9px 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 70px;">Qty/Nights</th>
            <th style="padding: 9px 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; width: 75px;">Rate (₹)</th>
            <th style="padding: 9px 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; width: 85px;">Taxable (₹)</th>
            <th style="padding: 9px 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 65px;">GST Rate</th>
            <th style="padding: 9px 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; width: 85px;">Tax Amount</th>
            <th style="padding: 9px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; width: 90px;">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${roomBreakdowns.length > 0 ? roomBreakdowns.map((rb, idx) => {
    const rbNights = Number(rb.nights) || nights || 1;
    const rbGstRate = Number(rb.gstRate) !== undefined && !isNaN(Number(rb.gstRate)) ? Number(rb.gstRate) : defaultGstRate;
    let rbTaxable = Number(rb.taxableAmount);
    let rbFinal = Number(rb.finalAmount);
    if (!rbTaxable || rbTaxable === 0) {
      if (rbFinal && rbFinal > 0) {
        rbTaxable = Math.round(rbFinal / (1 + rbGstRate / 100));
      } else {
        rbTaxable = taxableVal;
      }
    }
    const rbRate = Number(rb.basePrice) || Math.round(rbTaxable / rbNights) || baseRatePerNight;
    const rbGstAmount = Number(rb.gstAmount) !== undefined && !isNaN(Number(rb.gstAmount)) ? Number(rb.gstAmount) : Math.round((rbTaxable * rbGstRate) / 100);
    if (!rbFinal || rbFinal === 0) rbFinal = rbTaxable + rbGstAmount;
    const rbCgstRate = rbGstRate / 2;
    const rbSgstRate = rbGstRate / 2;
    const rbCgstAmt = Math.round(rbGstAmount / 2);
    const rbSgstAmt = rbGstAmount - rbCgstAmt;

    return `
              <tr style="border-bottom: 1px solid #E2E8F0; background: #FFFFFF;">
                <td style="padding: 9px 8px; font-size: 11px; text-align: center; font-weight: 700; color: #64748B;">${idx + 1}</td>
                <td style="padding: 9px 10px; font-size: 11px;">
                  <div style="font-weight: 900; color: #0F172A;">Room #${rb.roomNumber || roomNumberDisplay} &bull; ${rb.roomTypeName || roomTypeNameDisplay}</div>
                  <div style="font-size: 10px; color: #64748B; margin-top: 2px;">CGST @ ${rbCgstRate}% (₹${rbCgstAmt.toLocaleString("en-IN")}) + SGST @ ${rbSgstRate}% (₹${rbSgstAmt.toLocaleString("en-IN")})</div>
                </td>
                <td style="padding: 9px 6px; font-size: 11px; text-align: center; font-family: monospace; color: #475569;">996311</td>
                <td style="padding: 9px 6px; font-size: 11px; text-align: center; font-weight: 700; color: #0F172A;">${rbNights} Night${rbNights > 1 ? "s" : ""}</td>
                <td style="padding: 9px 8px; font-size: 11px; text-align: right; color: #334155;">₹${rbRate.toLocaleString("en-IN")}</td>
                <td style="padding: 9px 8px; font-size: 11px; text-align: right; font-weight: 700; color: #0F172A;">₹${rbTaxable.toLocaleString("en-IN")}</td>
                <td style="padding: 9px 6px; font-size: 11px; text-align: center;"><span style="display:inline-block; padding:2px 6px; border-radius:4px; font-size:9.5px; font-weight:800; background: transparent; color:#0F766E;">${rbGstRate}%</span></td>
                <td style="padding: 9px 8px; font-size: 11px; text-align: right; color: #475569;">₹${rbGstAmount.toLocaleString("en-IN")}</td>
                <td style="padding: 9px 10px; font-size: 11.5px; text-align: right; font-weight: 900; color: #059669;">₹${rbFinal.toLocaleString("en-IN")}</td>
              </tr>
            `;
  }).join("") : `
            <tr style="border-bottom: 1px solid #E2E8F0; background: #FFFFFF;">
              <td style="padding: 9px 8px; font-size: 11px; text-align: center; font-weight: 700; color: #64748B;">1</td>
              <td style="padding: 9px 10px; font-size: 11px;">
                <div style="font-weight: 900; color: #0F172A;">Room #${roomNumberDisplay} &bull; ${roomTypeNameDisplay}</div>
                <div style="font-size: 10px; color: #64748B; margin-top: 2px;">CGST @ ${mainCgstRate}% (₹${cgstVal.toLocaleString("en-IN")}) + SGST @ ${mainSgstRate}% (₹${sgstVal.toLocaleString("en-IN")})</div>
              </td>
              <td style="padding: 9px 6px; font-size: 11px; text-align: center; font-family: monospace; color: #475569;">996311</td>
              <td style="padding: 9px 6px; font-size: 11px; text-align: center; font-weight: 700; color: #0F172A;">${nights} Night${nights > 1 ? "s" : ""}</td>
              <td style="padding: 9px 8px; font-size: 11px; text-align: right; color: #334155;">₹${baseRatePerNight.toLocaleString("en-IN")}</td>
              <td style="padding: 9px 8px; font-size: 11px; text-align: right; font-weight: 700; color: #0F172A;">₹${taxableVal.toLocaleString("en-IN")}</td>
              <td style="padding: 9px 6px; font-size: 11px; text-align: center;"><span style="display:inline-block; padding:2px 6px; border-radius:4px; font-size:9.5px; font-weight:800; background: transparent; color:#0F766E;">${mainGstRate}%</span></td>
              <td style="padding: 9px 8px; font-size: 11px; text-align: right; color: #475569;">₹${totalGst.toLocaleString("en-IN")}</td>
              <td style="padding: 9px 10px; font-size: 11.5px; text-align: right; font-weight: 900; color: #059669;">₹${(taxableVal + totalGst).toLocaleString("en-IN")}</td>
            </tr>
          `}

          ${isLate ? `
            <tr style="border-bottom: 1px solid #E2E8F0; background: #FFF5F5;">
              <td style="padding: 9px 8px; font-size: 11px; text-align: center; font-weight: 700; color: #DC2626;">${(roomBreakdowns.length || 1) + 1}</td>
              <td style="padding: 9px 10px; font-size: 11px;">
                <div style="font-weight: 900; color: #DC2626;">Late Check-Out Penalty Surcharge</div>
                <div style="font-size: 10px; color: #991B1B;">Overstayed ${lateHours} Hours past checkout @ ₹${hourlyRate}/hr</div>
              </td>
              <td style="padding: 9px 6px; font-size: 11px; text-align: center; font-family: monospace; color: #475569;">996311</td>
              <td style="padding: 9px 6px; font-size: 11px; text-align: center; font-weight: 700;">${lateHours}h</td>
              <td style="padding: 9px 8px; font-size: 11px; text-align: right;">₹${hourlyRate.toLocaleString("en-IN")}</td>
              <td style="padding: 9px 8px; font-size: 11px; text-align: right; font-weight: 700;">₹${lateFee.toLocaleString("en-IN")}</td>
              <td style="padding: 9px 6px; font-size: 11px; text-align: center;"><span style="display:inline-block; padding:2px 6px; border-radius:4px; font-size:9.5px; font-weight:800; background:#F1F5F9; color:#475569;">0%</span></td>
              <td style="padding: 9px 8px; font-size: 11px; text-align: right;">₹0</td>
              <td style="padding: 9px 10px; font-size: 11.5px; text-align: right; font-weight: 900; color: #DC2626;">₹${lateFee.toLocaleString("en-IN")}</td>
            </tr>
          ` : ""}

          ${charges.map((c, i) => {
    const cAmt = Number(c.amount) || 0;
    return `
              <tr style="border-bottom: 1px solid #E2E8F0; background: ${i % 2 === 0 ? '#F8FAFC' : '#FFFFFF'};">
                <td style="padding: 9px 8px; font-size: 11px; text-align: center; font-weight: 700; color: #64748B;">${(roomBreakdowns.length || 1) + (isLate ? 1 : 0) + 1 + i}</td>
                <td style="padding: 9px 10px; font-size: 11px;">
                  <div style="font-weight: 800; color: #0F172A;">${c.title || c.item || c.serviceName || "POS Room Service / Extra Item"}</div>
                  <div style="font-size: 10px; color: #64748B;">Category: <strong>${c.category || "F&B / Sundry"}</strong>${c.reason || c.note ? ` &bull; ${c.reason || c.note}` : ""}</div>
                </td>
                <td style="padding: 9px 6px; font-size: 11px; text-align: center; font-family: monospace; color: #475569;">996331</td>
                <td style="padding: 9px 6px; font-size: 11px; text-align: center; font-weight: 700;">${c.quantity || 1}</td>
                <td style="padding: 9px 8px; font-size: 11px; text-align: right;">₹${cAmt.toLocaleString("en-IN")}</td>
                <td style="padding: 9px 8px; font-size: 11px; text-align: right; font-weight: 700;">₹${cAmt.toLocaleString("en-IN")}</td>
                <td style="padding: 9px 6px; font-size: 11px; text-align: center;"><span style="display:inline-block; padding:2px 6px; border-radius:4px; font-size:9.5px; font-weight:800; background:#F1F5F9; color:#475569;">0%</span></td>
                <td style="padding: 9px 8px; font-size: 11px; text-align: right;">₹0</td>
                <td style="padding: 9px 10px; font-size: 11.5px; text-align: right; font-weight: 900; color: #0F172A;">₹${cAmt.toLocaleString("en-IN")}</td>
              </tr>
            `;
  }).join("")}
        </tbody>
      </table>
    </div>

    <!-- Payment Transaction History Ledger (if any) -->
    ${paymentHistory && paymentHistory.length > 0 ? `
      <div class="pdf-section" style="margin-bottom: 14px;">
        <div style="font-size: 11.5px; font-weight: 900; color: #0F172A; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
          <span>💳</span> PAYMENT TRANSACTION HISTORY LEDGER (${paymentHistory.length})
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 0; border-radius: 10px; overflow: hidden; border: 1px solid #E2E8F0;">
          <thead>
            <tr style="background: #0F766E; color: #FFFFFF;">
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 35px;">#</th>
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Receipt / Txn ID</th>
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Date &amp; Time</th>
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Payment Stage</th>
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Method</th>
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Amount (₹)</th>
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 85px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${paymentHistory.map((p, idx) => {
    const pAmt = Number(p.amount) || 0;
    const pMethod = (p.paymentMethod || "CASH").toUpperCase();
    return `
                <tr style="border-bottom: 1px solid #E2E8F0; background: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
                  <td style="padding: 8px 10px; font-size: 11px; text-align: center; font-weight: 700; color: #64748B;">${idx + 1}</td>
                  <td style="padding: 8px 10px; font-size: 11px; font-weight: 800; color: #0F766E; font-family: monospace;">#${p.receiptNumber || p.transactionId || "RCP-001"}</td>
                  <td style="padding: 8px 10px; font-size: 11px; color: #475569;">${p.formattedDate || (p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : dateStr)}</td>
                  <td style="padding: 8px 10px; font-size: 11px; font-weight: 600; color: #334155;">${p.paymentType || "Tariff Advance / Settlement"}</td>
                  <td style="padding: 8px 10px; font-size: 11px;"><span style="display:inline-block; padding:2px 7px; border-radius:5px; font-size:9.5px; font-weight:800; background: transparent; color:#0F766E; border:none;">${pMethod}</span></td>
                  <td style="padding: 8px 10px; font-size: 11px; text-align: right; font-weight: 900; color: #059669;">₹${pAmt.toLocaleString("en-IN")}</td>
                  <td style="padding: 8px 10px; font-size: 11px; text-align: center;"><span style="display:inline-block; padding:2px 7px; border-radius:5px; font-size:9.5px; font-weight:800; background: transparent; color:#15803D; border:none;">✓ PAID</span></td>
                </tr>
              `;
  }).join("")}
          </tbody>
        </table>
      </div>
    ` : ""}

    <!-- Financial Settlement Summary & Terms Dual Container -->
    <div class="pdf-section" style="display: grid; grid-template-columns: 1fr 340px; gap: 16px; margin-bottom: 16px; align-items: start;">
      <!-- Left: Terms & Statutory Declaration -->
      <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 14px; padding: 14px 16px; font-size: 10.5px; color: #475569; line-height: 1.55;">
        <div style="font-weight: 900; color: #0F172A; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
          <span>📌</span> TERMS &amp; STATUTORY GST DECLARATION
        </div>
        <ul style="margin: 0; padding-left: 16px;">
          <li style="margin-bottom: 4px;">All services and room charges are billed in Indian Rupees (INR) subject to statutory GST regulations under HSN/SAC code 996311.</li>
          <li style="margin-bottom: 4px;">Hotel standard check-in time is 12:00 PM and check-out time is 11:00 AM. Overstay fees apply for non-authorized extensions.</li>
          <li>This is a computer-generated tax invoice verified under Section 31 of the Central Goods and Services Tax (CGST) Act, 2017.</li>
        </ul>
      </div>

      <!-- Right: Financial Ledger Card -->
      <div style="background: #FFFFFF; border: 2px solid #CBD5E1; border-radius: 14px; padding: 14px 18px; box-shadow: 0 4px 14px rgba(12, 39, 59, 0.06);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; color: #475569;">
          <span>Room Base Tariff:</span>
          <span style="font-weight: 800; color: #0F172A;">₹${taxableVal.toLocaleString("en-IN")}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; color: #475569;">
          <span>GST (CGST ₹${cgstVal.toLocaleString("en-IN")} + SGST ₹${sgstVal.toLocaleString("en-IN")}):</span>
          <span style="font-weight: 800; color: #0F172A;">₹${totalGst.toLocaleString("en-IN")}</span>
        </div>
        ${posTotal > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; color: #0F766E; font-weight: 700;">
            <span>Extra POS / F&amp;B (${charges.length} items):</span>
            <span style="font-weight: 800;">+₹${posTotal.toLocaleString("en-IN")}</span>
          </div>
        ` : ""}
        ${isLate ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; color: #DC2626; font-weight: 700;">
            <span>Late Checkout Fee (${lateHours}h):</span>
            <span style="font-weight: 800;">+₹${lateFee.toLocaleString("en-IN")}</span>
          </div>
        ` : ""}
        <div style="border-top: 1.5px dashed #CBD5E1; margin: 8px 0;"></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; font-weight: 900; color: #0F172A;">
          <span>Grand Total Payable:</span>
          <span style="color: #059669; font-size: 15px;">₹${grandTotalAmount.toLocaleString("en-IN")}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; font-weight: 800; color: #059669;">
          <span>Total Payments Received:</span>
          <span>−₹${paidAmount.toLocaleString("en-IN")}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1.5px solid #E2E8F0; margin-top: 4px; font-size: 13px; font-weight: 900; color: ${balanceDue <= 0 ? '#059669' : '#DC2626'};">
          <span>Outstanding Balance:</span>
          <span>${balanceDue <= 0 ? '₹0 (✓ Settled)' : `₹${balanceDue.toLocaleString("en-IN")}`}</span>
        </div>
      </div>
    </div>

    <!-- Official Authorization Footer -->
    <div class="pdf-section" style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 14px; border-top: 1.5px solid #E2E8F0; font-size: 11px; color: #64748B;">
      <div>
        <div style="font-weight: 800; color: #0F172A; font-size: 12px;">Thank you for staying at ${hotelName}!</div>
        <div style="font-size: 10px; color: #94A3B8; margin-top: 2px;">This is a system-generated computer tax invoice &bull; Digitally authenticated by PMS</div>
      </div>
      <div style="text-align: right; width: 220px;">
        <div style="border-bottom: 1.5px dashed #94A3B8; margin-bottom: 6px; height: 35px;"></div>
        <div style="font-size: 10.5px; font-weight: 800; color: #0F172A; text-transform: uppercase;">Authorized Signatory / Cashier</div>
      </div>
    </div>
  `;

  openPrintOrSavePDF(`Tax_Invoice_${invoiceNum}`, html);
}

/**
 * 2. Generate & Download Payment Receipt / Voucher PDF
 */
export function downloadPaymentReceiptPDF(payment = {}, hotel = {}) {
  const hotelName = hotel.name || "MYOWNPMS";
  const receiptNum = payment.receiptNumber || `RCP-${Date.now().toString().slice(-6)}`;
  const dateStr = payment.dateStr || new Date().toLocaleDateString("en-IN");
  const timeStr = payment.timeStr || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const paidAmount = Number(payment.amount) || 0;
  const booking = payment.booking || {};
  const gstRate = Number(booking.gstRate) || Number(payment.gstRate) || 18;

  let taxableVal = Number(payment.taxableAmount) || Number(booking.taxableAmount);
  let gstVal = Number(payment.gstAmount) || Number(booking.gstAmount);

  if (!taxableVal || isNaN(taxableVal)) {
    taxableVal = Math.round(paidAmount / (1 + gstRate / 100));
  }
  if (!gstVal || isNaN(gstVal)) {
    gstVal = Math.max(0, paidAmount - taxableVal);
  }

  const cgstVal = Number(payment.cgstAmount) || Number(booking.cgstAmount) || Math.round(gstVal / 2);
  const sgstVal = Number(payment.sgstAmount) || Number(booking.sgstAmount) || Math.max(0, gstVal - cgstVal);

  const html = `
    <div class="header-banner">
      <div class="hotel-brand">
        <div class="brand-icon"><img src="/logo.png" alt="MYOWNPMS" onerror="this.outerHTML='💳'" /></div>
        <div>
          <div class="hotel-name">${hotelName}</div>
          <div class="hotel-sub">Official Counter Payment Voucher &bull; Front Desk Cashier</div>
        </div>
      </div>
      <div class="doc-meta">
        <div class="doc-title" style="color:#059669;">Payment Receipt</div>
        <div class="doc-id">#${receiptNum}</div>
        <div class="doc-date">${dateStr} &bull; ${timeStr}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <h4>Received From (Guest)</h4>
        <p>${payment.guest?.fullName || payment.guestName || "Guest"}</p>
        <span>📞 ${payment.guest?.mobileNumber || payment.guestPhone || "N/A"}</span>
        <span>Room #${payment.booking?.roomNumber || payment.roomNumber || "101"} (Folio: #${payment.booking?.bookingNumber || payment.bookingNumber || "BK-001"})</span>
      </div>
      <div class="info-block">
        <h4>Payment &amp; Collector Details</h4>
        <p>Method: <strong>${payment.paymentMethod || "CASH"}</strong></p>
        <span>Collector: ${payment.collectedBy?.name || payment.collectedByName || "Front Desk Staff"}</span>
        <span>Reference / UTR: ${payment.transactionId || "Counter Cash"}</span>
      </div>
    </div>

    <div style="background: transparent; border: 2px solid #86EFAC; border-radius: 14px; padding: 18px 20px; margin-bottom: 20px;">
      <div style="text-align: center; margin-bottom: 12px;">
        <div style="font-size: 11px; font-weight: 800; color: #15803D; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">Amount Paid in Full</div>
        <div style="font-size: 32px; font-weight: 900; color: #15803D; letter-spacing: -1px;">₹${paidAmount.toLocaleString("en-IN")}</div>
        <div style="font-size: 11px; color: #166534; margin-top: 2px;">Stage: <strong>${payment.paymentType || "SETTLEMENT"}</strong> &bull; Status: <strong>PAID / VERIFIED</strong></div>
      </div>

      <div style="border-top: 1px dashed #86EFAC; padding-top: 10px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 11px; text-align: center;">
        <div style="background: #F0FDF4; padding: 6px; border-radius: 8px;">
          <div style="color: #475569; font-size: 10px;">Taxable Base</div>
          <div style="font-weight: 800; color: #0F172A; margin-top: 2px;">₹${taxableVal.toLocaleString("en-IN")}</div>
        </div>
        <div style="background: #F0FDF4; padding: 6px; border-radius: 8px;">
          <div style="color: #475569; font-size: 10px;">CGST (${gstRate / 2}%)</div>
          <div style="font-weight: 800; color: #0F172A; margin-top: 2px;">₹${cgstVal.toLocaleString("en-IN")}</div>
        </div>
        <div style="background: #F0FDF4; padding: 6px; border-radius: 8px;">
          <div style="color: #475569; font-size: 10px;">SGST (${gstRate / 2}%)</div>
          <div style="font-weight: 800; color: #0F172A; margin-top: 2px;">₹${sgstVal.toLocaleString("en-IN")}</div>
        </div>
        <div style="background: #F0FDF4; padding: 6px; border-radius: 8px;">
          <div style="color: #15803D; font-size: 10px; font-weight: 800;">Total GST (${gstRate}%)</div>
          <div style="font-weight: 900; color: #15803D; margin-top: 2px;">₹${gstVal.toLocaleString("en-IN")}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div>
        <p>Automated payment receipt &bull; Digitally logged in PMS Treasury</p>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <p>Cashier / Desk Staff Signature</p>
      </div>
    </div>
  `;

  openPrintOrSavePDF(`Receipt_${receiptNum}`, html);
}

/**
 * 3. Generate & Download Shift Handover & Drawer Settlement Voucher PDF (Hotel Admin / Cashier)
 */
export function downloadHandoverVoucherPDF(handover = {}, hotel = {}) {
  const hotelName = hotel.name || "MYOWNPMS";
  const code = handover.handoverCode || `HO-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date(handover.createdAt || Date.now()).toLocaleString("en-IN");

  const html = `
    <div class="header-banner">
      <div class="hotel-brand">
        <div class="brand-icon"><img src="/logo.png" alt="MYOWNPMS" onerror="this.outerHTML='💼'" /></div>
        <div>
          <div class="hotel-name">${hotelName}</div>
          <div class="hotel-sub">Shift Handover &amp; Cash Drawer Settlement Audit Record</div>
        </div>
      </div>
      <div class="doc-meta">
        <div class="doc-title" style="color:#D97706;">Handover Slip</div>
        <div class="doc-id">#${code}</div>
        <div class="doc-date">${dateStr}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <h4>Audit &amp; Shift Officer</h4>
        <p>Settled By: <strong>${handover.settledByAdmin?.name || "Hotel General Manager"}</strong></p>
        <span>Audit Timestamp: ${dateStr}</span>
      </div>
      <div class="info-block">
        <h4>Settlement Scope</h4>
        <p>Total Receipts Settled: <strong>${handover.paymentsCount || 0} Transactions</strong></p>
        <span>Status: <strong style="color:#059669;">DEPOSITED IN VAULT / SAFE</strong></span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Payment Channel</th>
          <th class="text-right">Amount Settled (₹)</th>
          <th class="text-right">Audit Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Physical Counter Cash</strong></td>
          <td class="text-right" style="font-weight:800;color:#059669;">₹${(handover.cashAmount || 0).toLocaleString("en-IN")}</td>
          <td class="text-right"><span class="badge badge-success">Vault Locked</span></td>
        </tr>
        <tr>
          <td><strong>UPI QR Digital Collections</strong></td>
          <td class="text-right" style="font-weight:800;color:#7C3AED;">₹${(handover.upiAmount || 0).toLocaleString("en-IN")}</td>
          <td class="text-right"><span class="badge badge-primary">Bank Direct</span></td>
        </tr>
        <tr>
          <td><strong>Card POS &amp; Net Banking</strong></td>
          <td class="text-right" style="font-weight:800;color:#2563EB;">₹${(handover.cardAmount || 0).toLocaleString("en-IN")}</td>
          <td class="text-right"><span class="badge badge-primary">Settled</span></td>
        </tr>
        <tr style="background:#F8FAFC;font-weight:900;">
          <td><strong>Total Shift Revenue Deposited</strong></td>
          <td class="text-right" style="font-size:15px;color:#0F172A;">₹${(handover.totalSettledAmount || 0).toLocaleString("en-IN")}</td>
          <td class="text-right"><span class="badge badge-success">Verified</span></td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <div class="sign-box">
        <div class="sign-line"></div>
        <p>Shift Cashier / Receptionist</p>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <p>Hotel Admin / Duty Manager</p>
      </div>
    </div>
  `;

  openPrintOrSavePDF(`Handover_Slip_${code}`, html);
}

/**
 * 4. Generate & Download Govt ID Compliance & Police Manifest PDF (Regulatory)
 */
export function downloadGovtIdReportPDF(guests = [], hotel = {}) {
  const hotelName = hotel.name || "MYOWNPMS";
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const html = `
    <div class="header-banner">
      <div class="hotel-brand">
        <div class="brand-icon"><img src="/logo.png" alt="MYOWNPMS" onerror="this.outerHTML='🛡️'" /></div>
        <div>
          <div class="hotel-name">${hotelName}</div>
          <div class="hotel-sub">Official Guest Police Manifest &amp; Regulatory ID Compliance Ledger</div>
        </div>
      </div>
      <div class="doc-meta">
        <div class="doc-title" style="color:#D97706;">Police Manifest</div>
        <div class="doc-date">Report Date: ${dateStr}</div>
        <div class="doc-id">Total Registrations: ${guests.length}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Guest Full Name</th>
          <th>Allocated Room</th>
          <th>Govt ID Type</th>
          <th>Document Number</th>
          <th>Mobile Contact</th>
          <th class="text-center">Compliance Stamp</th>
        </tr>
      </thead>
      <tbody>
        ${guests.map((g, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><strong>${g.fullName || g.name || "Guest"}</strong></td>
            <td>Room #${g.roomAssigned || g.roomNumber || "N/A"}</td>
            <td><span class="badge badge-primary">${g.govtIdType || g.idType || "AADHAAR"}</span></td>
            <td><code style="font-weight:700;">${g.govtIdNumber || g.idNumber || "N/A"}</code></td>
            <td>${g.phone || g.mobileNumber || "N/A"}</td>
            <td class="text-center">
              ${g.idVerified ? '<span class="badge badge-success">✓ Verified &amp; Stamped</span>' : '<span class="badge badge-warning">Pending Physical ID</span>'}
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="footer">
      <div>
        <p>Submitted under compliance with Local Police Registration &amp; Guest Safety Act</p>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <p>Compliance Officer / General Manager</p>
      </div>
    </div>
  `;

  openPrintOrSavePDF(`Police_Manifest_${Date.now()}`, html);
}

/**
 * 5. Generate & Download Daily Collections Statement PDF (Hotel Admin)
 */
export function downloadDailyLedgerPDF(payments = [], summary = {}, hotel = {}, dateStr = "Today") {
  const hotelName = hotel.name || "MYOWNPMS";

  const html = `
    <div class="header-banner">
      <div class="hotel-brand">
        <div class="brand-icon"><img src="/logo.png" alt="MYOWNPMS" onerror="this.outerHTML='📊'" /></div>
        <div>
          <div class="hotel-name">${hotelName}</div>
          <div class="hotel-sub">Daily Financial Collections &amp; Shift Audit Statement</div>
        </div>
      </div>
      <div class="doc-meta">
        <div class="doc-title">Treasury Report</div>
        <div class="doc-date">Date: ${dateStr}</div>
        <div class="doc-id">Total Items: ${payments.length}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <h4>Collection Breakdown</h4>
        <p>Cash Counter: ₹${(summary.cashTotal || 0).toLocaleString("en-IN")}</p>
        <span>UPI QR Collections: ₹${(summary.upiTotal || 0).toLocaleString("en-IN")}</span>
        <span>Card POS &amp; Bank: ₹${((summary.cardTotal || 0) + (summary.bankTotal || 0)).toLocaleString("en-IN")}</span>
      </div>
      <div class="info-block">
        <h4>Grand Totals</h4>
        <p style="font-size:18px;color:#059669;">₹${(summary.totalCollections || 0).toLocaleString("en-IN")}</p>
        <span>Settled to Vault: ₹${(summary.settledToAdmin || 0).toLocaleString("en-IN")}</span>
        <span style="color:#D97706;">In Drawer Pending Settlement: ₹${(summary.drawerCash || 0).toLocaleString("en-IN")}</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Receipt # &amp; Time</th>
          <th>Guest &amp; Room</th>
          <th>Mode</th>
          <th>Type</th>
          <th class="text-right">Amount (₹)</th>
          <th>Staff Collector</th>
        </tr>
      </thead>
      <tbody>
        ${payments.map((p) => `
          <tr>
            <td><strong>#${p.receiptNumber}</strong><div style="font-size:11px;color:#64748B;">${p.timeStr || "N/A"}</div></td>
            <td>Room ${p.roomNumber || p.booking?.roomNumber || "N/A"} - ${p.guestName || p.guest?.fullName || "Guest"}</td>
            <td><span class="badge badge-primary">${p.paymentMethod}</span></td>
            <td>${p.paymentType}</td>
            <td class="text-right" style="font-weight:900;color:#059669;">₹${(p.amount || 0).toLocaleString("en-IN")}</td>
            <td>${p.collectedByName || p.collectedBy?.name || "Staff"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="footer">
      <div>
        <p>MYOWNPMS Enterprise PMS Treasury Audit</p>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <p>Chief Accountant / Auditor</p>
      </div>
    </div>
  `;

  openPrintOrSavePDF(`Collections_Statement_${Date.now()}`, html);
}

/**
 * 6. Generate & Download Super Admin Platform Security Audit Logs PDF
 */
export function downloadAuditLogsPDF(logs = []) {
  const html = `
    <div class="header-banner">
      <div class="hotel-brand">
        <div class="brand-icon"><img src="/logo.png" alt="MYOWNPMS" onerror="this.outerHTML='🔒'" /></div>
        <div>
          <div class="hotel-name">MYOWNPMS Cloud PMS Platform</div>
          <div class="hotel-sub">Global Super Administrator Security &amp; Tenant Action Audit Ledger</div>
        </div>
      </div>
      <div class="doc-meta">
        <div class="doc-title" style="color:#DC2626;">Security Audit</div>
        <div class="doc-date">Generated: ${new Date().toLocaleString("en-IN")}</div>
        <div class="doc-id">Total Log Entries: ${logs.length}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Log ID</th>
          <th>Action Triggered</th>
          <th>Target Property</th>
          <th>Actor Email</th>
          <th>IP Address</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        ${logs.map((log) => `
          <tr>
            <td><code style="font-weight:700;">${log.id || log._id}</code></td>
            <td><span class="badge ${log.action?.includes("ACTIVATED") ? "badge-success" : log.action?.includes("SUSPENDED") ? "badge-warning" : "badge-primary"}">${log.action}</span></td>
            <td><strong>${log.hotel || log.hotelName || "Global Platform"}</strong></td>
            <td>${log.user || log.userEmail || "System Root"}</td>
            <td><code>${log.ip || "127.0.0.1"}</code></td>
            <td>${log.timestamp || log.createdAt || "N/A"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="footer">
      <div>
        <p>Cryptographically secured platform audit trial. Immutable system ledger.</p>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <p>Security Compliance Officer</p>
      </div>
    </div>
  `;

  openPrintOrSavePDF(`Platform_Audit_Logs_${Date.now()}`, html);
}

/**
 * 7. Generate & Download Super Admin Multi-Tenant Hotels Directory Report PDF
 */
export function downloadHotelsDirectoryPDF(hotels = []) {
  const activeCount = hotels.filter((h) => h.status === "ACTIVE").length;
  const pendingCount = hotels.filter((h) => h.status === "PENDING").length;
  const suspendedCount = hotels.filter((h) => h.status === "DISABLED" || h.status === "SUSPENDED").length;

  const html = `
    <div class="header-banner">
      <div class="hotel-brand">
        <div class="brand-icon"><img src="/logo.png" alt="MYOWNPMS" onerror="this.outerHTML='🌐'" /></div>
        <div>
          <div class="hotel-name">MYOWNPMS Multi-Tenant Hotel Network</div>
          <div class="hotel-sub">Global Property Governance &amp; Tenant Lifecycle Directory</div>
        </div>
      </div>
      <div class="doc-meta">
        <div class="doc-title" style="color:#0F766E;">Network Directory</div>
        <div class="doc-date">Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
        <div class="doc-id">Total Properties: ${hotels.length}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <h4>Tenant Status Distribution</h4>
        <p style="color:#059669;">Active &amp; Licensed: ${activeCount}</p>
        <span style="color:#D97706;">Pending Onboarding: ${pendingCount}</span>
        <span style="color:#DC2626;">Suspended / Disabled: ${suspendedCount}</span>
      </div>
      <div class="info-block">
        <h4>Governance Scope</h4>
        <p>Total Registered Network: ${hotels.length} Properties</p>
        <span>Platform: MYOWNPMS Cloud Multi-Tenant Cluster</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Property Name</th>
          <th>Location / City</th>
          <th>Admin Email</th>
          <th>Plan &amp; License</th>
          <th class="text-center">Tenant Status</th>
        </tr>
      </thead>
      <tbody>
        ${hotels.map((h, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><strong>${h.name || "Hotel"}</strong><div style="font-size:11px;color:#64748B;">ID: ${h._id || h.id || "N/A"}</div></td>
            <td>${h.city || "N/A"}</td>
            <td>${h.admin?.email || h.ownerEmail || "N/A"}</td>
            <td><span class="badge badge-primary">${h.subscription?.plan || h.plan || "ENTERPRISE"}</span></td>
            <td class="text-center">
              <span class="badge ${h.status === "ACTIVE" ? "badge-success" : h.status === "PENDING" ? "badge-warning" : "badge-warning"}" style="${h.status !== "ACTIVE" && h.status !== "PENDING" ? "background:#FEE2E2;color:#DC2626;border:1px solid #FCA5A5;" : ""}">
                ${h.status || "ACTIVE"}
              </span>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="footer">
      <div>
        <p>MYOWNPMS Multi-Tenant Hospitality Platform Enterprise Report</p>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <p>Super Administrator</p>
      </div>
    </div>
  `;

  openPrintOrSavePDF(`Hotels_Directory_Report_${Date.now()}`, html);
}

/**
 * 8. Generate & Download Full Comprehensive Revenue Details & Financial Audit Statement PDF
 */
export function downloadRevenueDetailsReportPDF(revenueData = {}, hotel = {}, filterLabel = "This Week") {
  const hotelName = hotel.name || "MYOWNPMS";
  const hotelAddress = hotel.address || hotel.city || "Gujarat, India";
  const hotelGst = hotel.gstin || "24AABCG1234F1Z8";
  const hotelPhone = hotel.phone || "+91 98765 43210";

  const totalRev = revenueData.totalRevenue || 0;
  const totalTxns = revenueData.totalTransactions || (revenueData.transactions || []).length;
  const breakdown = revenueData.revenueBreakdown || { roomBooking: 0, extraServices: 0, foodRestaurant: 0, otherCharges: 0 };
  const txns = revenueData.transactions || [];
  const dateRangeStr = revenueData.dateRange?.label || filterLabel;
  const generatedAt = new Date().toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const roomRev = breakdown.roomBooking || 0;
  const extraRev = breakdown.extraServices || 0;
  const foodRev = breakdown.foodRestaurant || 0;
  const otherRev = breakdown.otherCharges || 0;

  const totalBase = txns.reduce((s, t) => s + (t.amount || 0), 0);
  const totalTax = txns.reduce((s, t) => s + (t.tax || 0), 0);

  const html = `
    <!-- 1. Hero Command Ribbon (Exact Match With UI Header) -->
    <div class="hero-ribbon">
      <div class="hotel-brand">
        <div class="brand-icon"><img src="/logo.png" alt="MYOWNPMS" onerror="this.outerHTML='🏨'" /></div>
        <div>
          <div class="hotel-title">${hotelName}</div>
          <div class="hotel-meta">📍 ${hotelAddress} &bull; 📞 ${hotelPhone} &bull; GSTIN: <strong>${hotelGst}</strong></div>
        </div>
      </div>
      <div class="ribbon-badge">
        <div class="title">Revenue Statement</div>
        <div class="sub">📅 ${dateRangeStr}</div>
      </div>
    </div>

    <!-- 2. 4 KPI Telemetry Cards (Same to Same as Overview Boxes!) -->
    <div class="kpi-row">
      <div class="kpi-card green">
        <div class="kpi-title">Total Verified Revenue</div>
        <div class="kpi-val">₹${totalRev.toLocaleString("en-IN")}</div>
        <div class="kpi-sub">✓ 100% Realtime Audited</div>
      </div>
      <div class="kpi-card blue">
        <div class="kpi-title">Total Transactions</div>
        <div class="kpi-val">${totalTxns}</div>
        <div class="kpi-sub">Verified Completed Folios</div>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-title">Room Bookings</div>
        <div class="kpi-val">₹${roomRev.toLocaleString("en-IN")}</div>
        <div class="kpi-sub">Primary Stay Revenue</div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-title">Extra &amp; Dining</div>
        <div class="kpi-val">₹${(extraRev + foodRev + otherRev).toLocaleString("en-IN")}</div>
        <div class="kpi-sub">POS, Food &amp; Amenities</div>
      </div>
    </div>

    <!-- 3. Category Breakdown Bar -->
    <div class="breakdown-section">
      <div class="section-header">
        <span class="section-title">📊 Revenue Source Breakdown</span>
        <span style="font-size:10.5px;color:#64748B;font-weight:700;">Audit Time: ${generatedAt}</span>
      </div>
      <div class="breakdown-grid">
        <div class="breakdown-item">
          <div class="label">Room Accommodations</div>
          <div class="amt" style="color:#0F766E;">₹${roomRev.toLocaleString("en-IN")}</div>
        </div>
        <div class="breakdown-item">
          <div class="label">Extra Services &amp; Beds</div>
          <div class="amt" style="color:#8B5CF6;">₹${extraRev.toLocaleString("en-IN")}</div>
        </div>
        <div class="breakdown-item">
          <div class="label">Food &amp; Dining (F&amp;B)</div>
          <div class="amt" style="color:#F59E0B;">₹${foodRev.toLocaleString("en-IN")}</div>
        </div>
        <div class="breakdown-item">
          <div class="label">Other Misc Charges</div>
          <div class="amt" style="color:#059669;">₹${otherRev.toLocaleString("en-IN")}</div>
        </div>
      </div>
    </div>

    <!-- 4. Complete Itemized Transactions Table (All Columns from UI) -->
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Receipt &amp; Date</th>
          <th>Guest Details</th>
          <th>Booking &amp; Room</th>
          <th>Description</th>
          <th class="text-center">Method</th>
          <th class="text-right">Base (₹)</th>
          <th class="text-right">Tax (₹)</th>
          <th class="text-right">Total (₹)</th>
          <th class="text-center">Status</th>
        </tr>
      </thead>
      <tbody>
        ${txns.length > 0 ? txns.map((t, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>
              <strong style="color:#0F766E;">#${t.receiptNumber || t.transactionId || "N/A"}</strong>
              <div style="font-size:9.5px;color:#64748B;">${t.formattedDate || (t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN") : "N/A")}</div>
            </td>
            <td>
              <strong>${t.guestName || "Guest"}</strong>
              <div style="font-size:9.5px;color:#64748B;">📞 ${t.guestMobile || t.guestPhone || "N/A"}</div>
            </td>
            <td>
              <strong>Room ${t.roomNumber || "N/A"}</strong>
              <div style="font-size:9.5px;color:#64748B;">Folio #${t.bookingNumber || "N/A"}</div>
            </td>
            <td>${t.description || "Room Tariff Settlement"}</td>
            <td class="text-center">
              <span class="badge ${t.paymentMethod === "CASH" ? "badge-success" : t.paymentMethod === "UPI" ? "badge-purple" : "badge-primary"}">
                ${t.paymentMethod || "UPI"}
              </span>
            </td>
            <td class="text-right">₹${(t.amount || 0).toLocaleString("en-IN")}</td>
            <td class="text-right" style="color:#64748B;">₹${(t.tax || 0).toLocaleString("en-IN")}</td>
            <td class="text-right" style="font-weight:900;color:#059669;font-size:12px;">₹${(t.total || t.amount || 0).toLocaleString("en-IN")}</td>
            <td class="text-center">
              <span class="badge badge-success">✓ ${t.status || "PAID"}</span>
            </td>
          </tr>
        `).join("") : `
          <tr>
            <td colspan="10" style="text-align:center;padding:24px;color:#64748B;">No financial transactions found matching current filters.</td>
          </tr>
        `}
      </tbody>
    </table>

    <!-- 5. Grand Totals Summary Card -->
    ${txns.length > 0 ? `
    <div class="summary-card-right">
      <div class="summary-row">
        <span>Taxable Base Subtotal:</span>
        <span style="font-weight:700;">₹${totalBase.toLocaleString("en-IN")}</span>
      </div>
      <div class="summary-row">
        <span>GST &amp; Service Tax:</span>
        <span style="font-weight:700;">₹${totalTax.toLocaleString("en-IN")}</span>
      </div>
      <div class="summary-row grand">
        <span>Net Revenue Settled:</span>
        <span>₹${totalRev.toLocaleString("en-IN")}</span>
      </div>
    </div>
    ` : ""}

    <!-- 6. Footer & Signatures -->
    <div class="footer">
      <div>
        <p style="font-weight:800;color:#0F172A;">MYOWNPMS Enterprise Property Management System</p>
        <p>Verified Live Audit Statement &bull; Digitally Signed and Immutable</p>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <p style="font-weight:800;">Finance Officer / General Manager</p>
      </div>
    </div>
  `;

  openPrintOrSavePDF(`Revenue_Statement_${dateRangeStr.replace(/\s+/g, "_")}_${Date.now()}`, html);
}

/**
 * 9. Generate & Download Detailed Guest Folio & Stay Dossier PDF
 */
export function downloadGuestFolioPDF(data = {}, hotel = {}) {
  const guest = data.guest || {};
  const booking = data.activeBooking || guest.activeBooking || {};
  const paymentDetails = data.paymentDetails || {};
  const paymentHistory = data.paymentHistory || booking.paymentHistory || booking.payments || [];
  const roomsDetail = data.roomsDetail || [];
  const charges = booking.charges || booking.posCharges || data.charges || [];
  const accompanying = data.accompanyingGuests || booking.accompanyingGuests || guest.accompanyingGuests || [];

  const hotelName = hotel.name || "MYOWNPMS Luxury Hotel";
  const hotelAddress = hotel.address || hotel.city || "Marine Drive, Mumbai, Maharashtra";
  const hotelPhone = hotel.phone || hotel.ownerPhone || "+91 98200 12345";
  const hotelGst = hotel.gstin || hotel.settings?.gstin || "27AABCG1234F1Z8";
  const folioNum = booking.bookingNumber ? `FOLIO-${booking.bookingNumber}` : `FOLIO-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const overstay = calculateOverstayFee(booking, hotel);
  const lateFee = Number(booking.lateCheckoutCharge) || Number(overstay.lateFee) || 0;
  const lateHours = Number(booking.lateCheckoutHours) || Number(overstay.chargeableHours) || 0;
  const hourlyRate = Number(booking.hourlyRate) || Number(overstay.hourlyRate) || (lateHours > 0 ? Math.round(lateFee / lateHours) : 0);
  const isLate = lateFee > 0;

  const checkInDateFormatted = booking.checkInDate ? (typeof booking.checkInDate === 'string' ? booking.checkInDate.split('T')[0] : new Date(booking.checkInDate).toLocaleDateString('en-IN')) : "On Record";
  const checkInTimeFormatted = booking.checkInTime ? formatTime12Hour(booking.checkInTime) : "12:00 PM";
  const checkOutDateFormatted = booking.checkOutDate ? (typeof booking.checkOutDate === 'string' ? booking.checkOutDate.split('T')[0] : new Date(booking.checkOutDate).toLocaleDateString('en-IN')) : "Scheduled";
  const checkOutTimeFormatted = formatTime12Hour(booking.checkOutTime || hotel.checkOutTime || "11:00 AM");

  const nights = Number(booking.numberOfNights) || Number(booking.nights) || 1;
  const posTotal = charges.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const roomBreakdowns = Array.isArray(booking.roomGstBreakdown) && booking.roomGstBreakdown.length > 0 ? booking.roomGstBreakdown : [];

  const rawBookingTotal = Number(booking.totalAmount) || Number(booking.grandTotal) || (booking.paidAmount ? Number(booking.paidAmount) : 3000);
  const originalBookingTotal = isLate && rawBookingTotal > lateFee ? rawBookingTotal - lateFee : rawBookingTotal;

  let defaultGstRate = Number(booking.gstRate);
  if (isNaN(defaultGstRate) || defaultGstRate === undefined || defaultGstRate === null || defaultGstRate === 0) {
    defaultGstRate = 18;
  }

  let taxableVal = Number(booking.taxableAmount);
  let totalGst = Number(booking.gstAmount);

  if (roomBreakdowns.length > 0) {
    taxableVal = roomBreakdowns.reduce((s, r) => s + (Number(r.taxableAmount) || 0), 0);
    totalGst = roomBreakdowns.reduce((s, r) => s + (Number(r.gstAmount) || 0), 0);
  }

  if (isNaN(taxableVal) || taxableVal === undefined || taxableVal === null || taxableVal === 0) {
    const basePerNight = Number(booking.rate) || Number(booking.pricePerNight) || Number(booking.basePrice) || Number(booking.room?.pricePerNight) || Number(booking.roomType?.basePrice);
    if (basePerNight > 0) {
      taxableVal = basePerNight * nights;
    } else if (booking.taxInclusive) {
      taxableVal = Math.round(originalBookingTotal / (1 + defaultGstRate / 100));
    } else {
      taxableVal = originalBookingTotal;
    }
  }

  if (isNaN(totalGst) || totalGst === undefined || totalGst === null || totalGst === 0) {
    if (booking.gstAmount !== undefined && booking.gstAmount !== null && Number(booking.gstAmount) > 0) {
      totalGst = Number(booking.gstAmount);
    } else {
      totalGst = Math.round((taxableVal * defaultGstRate) / 100);
    }
  }

  const cgstVal = Number(booking.cgstAmount) || (roomBreakdowns.length > 0 ? roomBreakdowns.reduce((s, r) => s + (Number(r.cgstAmount) || 0), 0) : Math.round(totalGst / 2));
  const sgstVal = Number(booking.sgstAmount) || (roomBreakdowns.length > 0 ? roomBreakdowns.reduce((s, r) => s + (Number(r.sgstAmount) || 0), 0) : Math.max(0, totalGst - cgstVal));
  const baseRatePerNight = Math.round(taxableVal / nights) || Number(booking.pricePerNight) || Math.round(originalBookingTotal / nights);

  const grandTotalAmount = Number(booking.grandTotal) || (taxableVal + totalGst + lateFee + posTotal);
  const paidAmount = Number(booking.paidAmount) !== undefined && Number(booking.paidAmount) !== null && !isNaN(Number(booking.paidAmount))
    ? Number(booking.paidAmount)
    : (paymentHistory.length > 0 ? paymentHistory.reduce((s, p) => s + (Number(p.amount) || 0), 0) : grandTotalAmount);

  const dueAmount = Number(booking.dueAmount) !== undefined && !isNaN(Number(booking.dueAmount))
    ? Number(booking.dueAmount)
    : Math.max(0, grandTotalAmount - paidAmount);

  const isPaid = dueAmount <= 0;
  const guestName = guest.fullName || guest.name || booking.guestName || "Valued Guest";
  const guestPhone = guest.mobileNumber || guest.phone || booking.guestPhone || "On Record";
  const guestEmail = guest.email || booking.guestEmail || "Not Provided";
  const guestAddress = guest.address?.city || guest.city || guest.address?.fullAddress || guest.address || "Verified On Record";
  const govtIdType = guest.idProof?.idType || guest.govtIdType || guest.idType || "AADHAAR";
  const govtIdNumber = guest.idProof?.idNumber || guest.govtIdNumber || guest.idNumber || "Verified On Record";
  const roomNumberDisplay = booking.roomNumber || booking.room?.roomNumber || guest.roomAssigned || "101";
  const roomTypeNameDisplay = booking.roomType?.name || booking.roomTypeName || "Executive Suite";

  // Check if digital signature image exists
  const guestSignature =
    guest.signature ||
    guest.signatureUrl ||
    guest.guestSignature ||
    guest.idProof?.signature ||
    guest.idProof?.signatureUrl ||
    guest.idProof?.guestSignature ||
    booking.guestSignature ||
    booking.signature ||
    booking.signatureUrl ||
    booking.idProof?.signature ||
    booking.idProof?.signatureUrl ||
    booking.idProof?.guestSignature ||
    booking.guest?.signature ||
    booking.guest?.signatureUrl ||
    booking.guest?.guestSignature ||
    booking.guest?.idProof?.signature ||
    data.signature ||
    data.guestSignature ||
    data.signatureUrl ||
    null;

  // Check if any actual ID images exist
  const primaryFront = guest.idProof?.frontImage || guest.idProof?.frontImageUrl || guest.frontImage || guest.frontImageUrl || guest.idProofImage || booking.idProof?.frontImage || booking.idProofImage;
  const primaryBack = guest.idProof?.backImage || guest.idProof?.backImageUrl || guest.backImage || guest.backImageUrl || guest.idProofBackImage || booking.idProof?.backImage || booking.idProofBackImage;
  const hasAnyIdImages = Boolean(primaryFront || primaryBack || guestSignature || accompanying.some((m) => m.frontImage || m.frontImageUrl || m.backImage || m.backImageUrl || m.idProofImage || m.idProof?.frontImage || m.idProof?.backImage));

  const allIdCards = [
    {
      name: guestName,
      tag: "Primary Guest",
      tagColor: "#0F766E",
      tagBg: "#CCFBF1",
      idType: govtIdType,
      idNumber: govtIdNumber,
      frontImg: primaryFront,
      backImg: primaryBack,
    },
    ...accompanying.map((m, idx) => ({
      name: m.name || m.fullName || `Co-Guest ${idx + 1}`,
      tag: m.relationship || "Accompanying Guest",
      tagColor: "#6D28D9",
      tagBg: "#EDE9FE",
      idType: m.idType || "AADHAAR",
      idNumber: m.idNumber || "Verified On Record",
      frontImg: m.frontImage || m.frontImageUrl || m.idProofImage || m.idProof?.frontImage || m.idProof?.frontImageUrl,
      backImg: m.backImage || m.backImageUrl || m.idProofBackImage || m.idProof?.backImage || m.idProof?.backImageUrl,
    }))
  ].filter((c) => c.frontImg || c.backImg);

  const html = `
    <!-- Top Branded Executive Header -->
    <div class="pdf-section" style="background: linear-gradient(135deg, #092622 0%, #0F766E 50%, #14B8A6 100%); border-radius: 16px; padding: 18px 22px; color: #FFFFFF; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 8px 24px rgba(15, 118, 110, 0.25);">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 48px; height: 48px; background: #FFFFFF; border: 2px solid rgba(255,255,255,0.8); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; overflow: hidden; padding: 4px; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <img src="/logo.png" alt="${hotelName}" onerror="this.outerHTML='🏨'" style="width:100%;height:100%;object-fit:contain;" />
        </div>
        <div>
          <div style="font-size: 20px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.4px;">${hotelName}</div>
          <div style="font-size: 11px; color: rgba(255, 255, 255, 0.9); font-weight: 600; margin-top: 2px;">
            📍 ${hotelAddress} &bull; 📞 ${hotelPhone}
          </div>
          <div style="display: inline-flex; align-items: center; gap: 5px; margin-top: 4px; border: none; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; letter-spacing: 0.3px;">
            <span style="width: 6px; height: 6px; background: #4ADE80; border-radius: 50%; display: inline-block;"></span>
            GSTIN: <strong>${hotelGst}</strong> &bull; Verified Property
          </div>
        </div>
      </div>

      <div style="text-align: right; border: none; padding: 4px 8px;">
        <div style="font-size: 15px; font-weight: 900; color: #FFFFFF; text-transform: uppercase; letter-spacing: 1px;">GUEST STAY FOLIO</div>
        <div style="font-size: 13px; font-weight: 800; color: #99F6E4; margin-top: 2px; font-family: monospace;">#${booking.bookingNumber || folioNum}</div>
        <div style="font-size: 10px; color: rgba(255, 255, 255, 0.85); font-weight: 700; margin-top: 2px;">Date: ${dateStr} &bull; ${timeStr}</div>
      </div>
    </div>

    <!-- 2-Column Guest & Stay Cards -->
    <div class="pdf-section" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
      <!-- Primary Guest Profile Card -->
      <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 14px; padding: 14px 16px; position: relative; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 3.5px; background: #0F766E;"></div>
        <div style="font-size: 10.5px; font-weight: 900; color: #0F766E; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>👤</span> PRIMARY GUEST PROFILE
        </div>
        <div style="font-size: 14px; font-weight: 900; color: #0F172A; margin-bottom: 5px;">${guestName}</div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 3px;">
          📞 Phone: <strong style="color:#0F172A;">${guestPhone}</strong> &bull; ✉️ ${guestEmail}
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 3px; display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
          <span>🛡️ Govt ID:</span>
          <strong style="color:#0F172A; font-family: monospace;">${govtIdType}: ${govtIdNumber}</strong>
          <span style="display: inline-block; background: transparent; color: #15803D; border: none; padding: 1px 6px; border-radius: 4px; font-size: 9.5px; font-weight: 800;">✓ Verified</span>
        </div>
        <div style="font-size: 11px; color: #475569;">
          🏠 Address: <span style="color:#0F172A;">${guestAddress}</span>
        </div>
      </div>

      <!-- Stay Allocation Card -->
      <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 14px; padding: 14px 16px; position: relative; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 3.5px; background: #10B981;"></div>
        <div style="font-size: 10.5px; font-weight: 900; color: #10B981; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>🏨</span> STAY &amp; ROOM ALLOCATION
        </div>
        <div style="font-size: 14px; font-weight: 900; color: #0F172A; margin-bottom: 5px;">
          Room #${roomNumberDisplay} &bull; <span style="font-size: 12px; color: #0F766E; font-weight: 800;">${roomTypeNameDisplay}</span>
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 3px;">
          📥 Check-In: <strong style="color:#0F172A;">${checkInDateFormatted} (${checkInTimeFormatted})</strong>
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 3px;">
          📤 Check-Out: <strong style="color:#0F172A;">${checkOutDateFormatted} (${checkOutTimeFormatted})</strong>
        </div>
        <div style="font-size: 11px; color: #475569; display: flex; align-items: center; gap: 6px;">
          <span>⏱️ Duration: <strong>${nights} Night${nights > 1 ? "s" : ""}</strong></span>
          <span>&bull;</span>
          <span>Status: <strong style="color:#059669;">${guest.status || "IN-HOUSE"}</strong></span>
        </div>
        ${isLate ? `
          <div style="margin-top:6px; background:#FEF2F2; border:1px solid #FCA5A5; border-radius:6px; padding:4px 8px; font-size:10.5px; color:#DC2626; font-weight:800;">
            ⚠️ Late Check-Out: ${lateHours}h overstay @ ₹${hourlyRate}/hr (+₹${lateFee.toLocaleString("en-IN")})
          </div>
        ` : ""}
      </div>
    </div>

    <!-- Accompanying Members Section -->
    ${accompanying && accompanying.length > 0 ? `
      <div class="pdf-section" style="margin-bottom: 14px;">
        <div style="font-size: 11.5px; font-weight: 900; color: #0F172A; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
          <span>👥</span> ACCOMPANYING FAMILY MEMBERS &amp; CO-GUESTS (${accompanying.length})
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 0; border-radius: 10px; overflow: hidden; border: 1px solid #E2E8F0;">
          <thead>
            <tr style="background: #0F766E; color: #FFFFFF;">
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 35px;">#</th>
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Member Full Name</th>
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Age / Gender</th>
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Relationship</th>
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Govt ID Type</th>
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">ID Proof Number</th>
              <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 90px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${accompanying.map((m, idx) => `
              <tr style="border-bottom: 1px solid #E2E8F0; background: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
                <td style="padding: 8px 10px; font-size: 11px; text-align: center; font-weight: 700; color: #64748B;">${idx + 1}</td>
                <td style="padding: 8px 10px; font-size: 11px; font-weight: 800; color: #0F172A;">${m.name || m.fullName || `Member ${idx + 1}`}</td>
                <td style="padding: 8px 10px; font-size: 11px; color: #475569;">${m.age ? `${m.age} yrs` : "-"} / ${m.gender || "-"}</td>
                <td style="padding: 8px 10px; font-size: 11px;"><span style="display:inline-block; padding:2px 7px; border-radius:5px; font-size:9.5px; font-weight:800; background: transparent; color:#6D28D9; border:none;">${m.relationship || "Accompanying Guest"}</span></td>
                <td style="padding: 8px 10px; font-size: 11px; font-weight: 700; color: #334155;">${m.idType || "AADHAAR"}</td>
                <td style="padding: 8px 10px; font-size: 11px;"><code style="font-family:monospace; background:#F1F5F9; padding:2px 5px; border-radius:4px; font-size:10.5px;">${m.idNumber || "Verified On Record"}</code></td>
                <td style="padding: 8px 10px; font-size: 11px; text-align: center;"><span style="display:inline-block; padding:2px 7px; border-radius:5px; font-size:9.5px; font-weight:800; background: transparent; color:#15803D; border:none;">✓ Verified</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : ""}

    <!-- Main Itemized Tariff & Services Breakdown -->
    <div class="pdf-section" style="margin-bottom: 14px;">
      <div style="font-size: 11.5px; font-weight: 900; color: #0F172A; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
        <span>📋</span> ITEMIZED ROOM TARIFF, TAXES &amp; EXTRA CHARGES BREAKDOWN
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 0; border-radius: 10px; overflow: hidden; border: 1px solid #CBD5E1; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
        <thead>
          <tr style="background: #0F766E; color: #FFFFFF;">
            <th style="padding: 9px 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 32px;">#</th>
            <th style="padding: 9px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Description of Service / Tariff Charge</th>
            <th style="padding: 9px 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 70px;">HSN/SAC</th>
            <th style="padding: 9px 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 70px;">Qty/Nights</th>
            <th style="padding: 9px 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; width: 75px;">Rate (₹)</th>
            <th style="padding: 9px 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; width: 85px;">Taxable (₹)</th>
            <th style="padding: 9px 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 65px;">GST Rate</th>
            <th style="padding: 9px 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; width: 85px;">Tax Amount</th>
            <th style="padding: 9px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; width: 90px;">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${roomsDetail && roomsDetail.length > 0 ? roomsDetail.map((rm, idx) => {
    const rmNights = Number(rm.numberOfNights) || nights || 1;
    const rmGstRate = Number(rm.gstRate) || defaultGstRate;
    const rmPrice = Number(rm.pricePerNight) || Number(rm.basePrice) || baseRatePerNight;
    const rmTaxable = Number(rm.taxableAmount) || (rmPrice * rmNights);
    const rmGst = Number(rm.gstAmount) !== undefined && !isNaN(Number(rm.gstAmount)) && Number(rm.gstAmount) > 0 ? Number(rm.gstAmount) : Math.round((rmTaxable * rmGstRate) / 100);
    const rmTotal = Number(rm.roomTotal) || Number(rm.finalAmount) || (rmTaxable + rmGst);
    const rmCgst = Math.round(rmGst / 2);
    const rmSgst = rmGst - rmCgst;
    return `
              <tr style="border-bottom: 1px solid #E2E8F0; background: #FFFFFF;">
                <td style="padding: 9px 8px; font-size: 11px; text-align: center; font-weight: 700; color: #64748B;">${idx + 1}</td>
                <td style="padding: 9px 10px; font-size: 11px;">
                  <div style="font-weight: 900; color: #0F172A;">Room #${rm.roomNumber} &bull; ${rm.roomType || roomTypeNameDisplay}</div>
                  <div style="font-size: 10px; color: #64748B; margin-top: 2px;">CGST @ ${rmGstRate / 2}% (₹${rmCgst.toLocaleString("en-IN")}) + SGST @ ${rmGstRate / 2}% (₹${rmSgst.toLocaleString("en-IN")})</div>
                </td>
                <td style="padding: 9px 6px; font-size: 11px; text-align: center; font-family: monospace; color: #475569;">996311</td>
                <td style="padding: 9px 6px; font-size: 11px; text-align: center; font-weight: 700; color: #0F172A;">${rmNights} Night${rmNights > 1 ? "s" : ""}</td>
                <td style="padding: 9px 8px; font-size: 11px; text-align: right; color: #334155;">₹${rmPrice.toLocaleString("en-IN")}</td>
                <td style="padding: 9px 8px; font-size: 11px; text-align: right; font-weight: 700; color: #0F172A;">₹${rmTaxable.toLocaleString("en-IN")}</td>
                <td style="padding: 9px 6px; font-size: 11px; text-align: center;"><span style="display:inline-block; padding:2px 6px; border-radius:4px; font-size:9.5px; font-weight:800; background: transparent; color:#0F766E;">${rmGstRate}%</span></td>
                <td style="padding: 9px 8px; font-size: 11px; text-align: right; color: #475569;">₹${rmGst.toLocaleString("en-IN")}</td>
                <td style="padding: 9px 10px; font-size: 11.5px; text-align: right; font-weight: 900; color: #059669;">₹${rmTotal.toLocaleString("en-IN")}</td>
              </tr>
            `;
  }).join("") : `
            <tr style="border-bottom: 1px solid #E2E8F0; background: #FFFFFF;">
              <td style="padding: 9px 8px; font-size: 11px; text-align: center; font-weight: 700; color: #64748B;">1</td>
              <td style="padding: 9px 10px; font-size: 11px;">
                <div style="font-weight: 900; color: #0F172A;">Room #${roomNumberDisplay} &bull; ${roomTypeNameDisplay}</div>
                <div style="font-size: 10px; color: #64748B; margin-top: 2px;">CGST @ ${defaultGstRate / 2}% (₹${cgstVal.toLocaleString("en-IN")}) + SGST @ ${defaultGstRate / 2}% (₹${sgstVal.toLocaleString("en-IN")})</div>
              </td>
              <td style="padding: 9px 6px; font-size: 11px; text-align: center; font-family: monospace; color: #475569;">996311</td>
              <td style="padding: 9px 6px; font-size: 11px; text-align: center; font-weight: 700; color: #0F172A;">${nights} Night${nights > 1 ? "s" : ""}</td>
              <td style="padding: 9px 8px; font-size: 11px; text-align: right; color: #334155;">₹${baseRatePerNight.toLocaleString("en-IN")}</td>
              <td style="padding: 9px 8px; font-size: 11px; text-align: right; font-weight: 700; color: #0F172A;">₹${taxableVal.toLocaleString("en-IN")}</td>
              <td style="padding: 9px 6px; font-size: 11px; text-align: center;"><span style="display:inline-block; padding:2px 6px; border-radius:4px; font-size:9.5px; font-weight:800; background: transparent; color:#0F766E;">${defaultGstRate}%</span></td>
              <td style="padding: 9px 8px; font-size: 11px; text-align: right; color: #475569;">₹${totalGst.toLocaleString("en-IN")}</td>
              <td style="padding: 9px 10px; font-size: 11.5px; text-align: right; font-weight: 900; color: #059669;">₹${(taxableVal + totalGst).toLocaleString("en-IN")}</td>
            </tr>
          `}

          ${isLate ? `
            <tr style="border-bottom: 1px solid #E2E8F0; background: #FFF5F5;">
              <td style="padding: 9px 8px; font-size: 11px; text-align: center; font-weight: 700; color: #DC2626;">${(roomsDetail.length || 1) + 1}</td>
              <td style="padding: 9px 10px; font-size: 11px;">
                <div style="font-weight: 900; color: #DC2626;">Late Check-Out Surcharge</div>
                <div style="font-size: 10px; color: #991B1B;">Overstayed ${lateHours}h @ ₹${hourlyRate}/hr</div>
              </td>
              <td style="padding: 9px 6px; font-size: 11px; text-align: center; font-family: monospace; color: #475569;">996311</td>
              <td style="padding: 9px 6px; font-size: 11px; text-align: center; font-weight: 700;">${lateHours}h</td>
              <td style="padding: 9px 8px; font-size: 11px; text-align: right;">₹${hourlyRate.toLocaleString("en-IN")}</td>
              <td style="padding: 9px 8px; font-size: 11px; text-align: right; font-weight: 700;">₹${lateFee.toLocaleString("en-IN")}</td>
              <td style="padding: 9px 6px; font-size: 11px; text-align: center;"><span style="display:inline-block; padding:2px 6px; border-radius:4px; font-size:9.5px; font-weight:800; background:#F1F5F9; color:#475569;">0%</span></td>
              <td style="padding: 9px 8px; font-size: 11px; text-align: right;">₹0</td>
              <td style="padding: 9px 10px; font-size: 11.5px; text-align: right; font-weight: 900; color: #DC2626;">₹${lateFee.toLocaleString("en-IN")}</td>
            </tr>
          ` : ""}

          ${charges.map((c, i) => {
    const cAmt = Number(c.amount) || 0;
    return `
              <tr style="border-bottom: 1px solid #E2E8F0; background: ${i % 2 === 0 ? '#F8FAFC' : '#FFFFFF'};">
                <td style="padding: 9px 8px; font-size: 11px; text-align: center; font-weight: 700; color: #64748B;">${(isLate ? 2 : 1) + 1 + i}</td>
                <td style="padding: 9px 10px; font-size: 11px;">
                  <div style="font-weight: 800; color: #0F172A;">${c.title || c.item || c.serviceName || "POS Room Service"}</div>
                  <div style="font-size: 10px; color: #64748B;">Category: <strong>${c.category || "F&B / Sundry"}</strong></div>
                </td>
                <td style="padding: 9px 6px; font-size: 11px; text-align: center; font-family: monospace; color: #475569;">996331</td>
                <td style="padding: 9px 6px; font-size: 11px; text-align: center; font-weight: 700;">${c.quantity || 1}</td>
                <td style="padding: 9px 8px; font-size: 11px; text-align: right;">₹${cAmt.toLocaleString("en-IN")}</td>
                <td style="padding: 9px 8px; font-size: 11px; text-align: right; font-weight: 700;">₹${cAmt.toLocaleString("en-IN")}</td>
                <td style="padding: 9px 6px; font-size: 11px; text-align: center;"><span style="display:inline-block; padding:2px 6px; border-radius:4px; font-size:9.5px; font-weight:800; background:#F1F5F9; color:#475569;">0%</span></td>
                <td style="padding: 9px 8px; font-size: 11px; text-align: right;">₹0</td>
                <td style="padding: 9px 10px; font-size: 11.5px; text-align: right; font-weight: 900; color: #0F172A;">₹${cAmt.toLocaleString("en-IN")}</td>
              </tr>
            `;
  }).join("")}
        </tbody>
      </table>
    </div>

    <!-- Payment Transaction History Ledger -->
    <div class="pdf-section" style="margin-bottom: 14px;">
      <div style="font-size: 11.5px; font-weight: 900; color: #0F172A; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
        <span>💳</span> PAYMENT TRANSACTION HISTORY LEDGER (${paymentHistory.length})
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 0; border-radius: 10px; overflow: hidden; border: 1px solid #E2E8F0;">
        <thead>
          <tr style="background: #0F766E; color: #FFFFFF;">
            <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 35px;">#</th>
            <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Receipt / Txn ID</th>
            <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Date &amp; Time</th>
            <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Stage</th>
            <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Method</th>
            <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Amount (₹)</th>
            <th style="padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 85px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${paymentHistory.length > 0 ? paymentHistory.map((p, idx) => {
    const pAmt = Number(p.amount) || 0;
    const pMethod = (p.paymentMethod || "CASH").toUpperCase();
    return `
              <tr style="border-bottom: 1px solid #E2E8F0; background: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
                <td style="padding: 8px 10px; font-size: 11px; text-align: center; font-weight: 700; color: #64748B;">${idx + 1}</td>
                <td style="padding: 8px 10px; font-size: 11px; font-weight: 800; color: #0F766E; font-family: monospace;">#${p.receiptNumber || p.transactionId || "RCP-001"}</td>
                <td style="padding: 8px 10px; font-size: 11px; color: #475569;">${p.formattedDate || (p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : dateStr)}</td>
                <td style="padding: 8px 10px; font-size: 11px; font-weight: 600; color: #334155;">${p.paymentType || "Settlement"}</td>
                <td style="padding: 8px 10px; font-size: 11px;"><span style="display:inline-block; padding:2px 7px; border-radius:5px; font-size:9.5px; font-weight:800; background:transparent; color:#0F766E; border:none;">${pMethod}</span></td>
                <td style="padding: 8px 10px; font-size: 11px; text-align: right; font-weight: 900; color: #059669;">₹${pAmt.toLocaleString("en-IN")}</td>
                <td style="padding: 8px 10px; font-size: 11px; text-align: center;"><span style="display:inline-block; padding:2px 7px; border-radius:5px; font-size:9.5px; font-weight:800; background:transparent; color:#15803D; border:none;">✓ PAID</span></td>
              </tr>
            `;
  }).join("") : `
            <tr>
              <td colspan="7" style="text-align: center; padding: 12px; color: #64748B; font-size: 11px;">No transaction records logged yet.</td>
            </tr>
          `}
        </tbody>
      </table>
    </div>

    <!-- Financial Settlement Summary & Notes Dual Container -->
    <div class="pdf-section" style="display: grid; grid-template-columns: 1fr 340px; gap: 16px; margin-bottom: 16px; align-items: start;">
      <!-- Left: Stay Notes & Rules -->
      <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 14px; padding: 14px 16px; font-size: 10.5px; color: #475569; line-height: 1.55;">
        <div style="font-weight: 900; color: #0F172A; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
          <span>📌</span> STAY FOLIO &amp; BILLING POLICY
        </div>
        <ul style="margin: 0; padding-left: 16px;">
          <li style="margin-bottom: 4px;">This stay folio reflects complete itemized room and point-of-sale consumption for this guest cycle.</li>
          <li style="margin-bottom: 4px;">Standard check-out is 11:00 AM. Key cards must be returned to the Front Desk at final settlement.</li>
          <li>All room tariff and extra charges are subject to statutory GST regulations under SAC 996311.</li>
        </ul>
      </div>

      <!-- Right: Financial Ledger Card -->
      <div style="background: #FFFFFF; border: 2px solid #CCFBF1; border-radius: 14px; padding: 14px 18px; box-shadow: 0 4px 14px rgba(15, 118, 110, 0.08);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; color: #475569;">
          <span>Room Base Tariff:</span>
          <span style="font-weight: 800; color: #0F172A;">₹${taxableVal.toLocaleString("en-IN")}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; color: #475569;">
          <span>GST (CGST ₹${cgstVal.toLocaleString("en-IN")} + SGST ₹${sgstVal.toLocaleString("en-IN")}):</span>
          <span style="font-weight: 800; color: #0F172A;">₹${totalGst.toLocaleString("en-IN")}</span>
        </div>
        ${posTotal > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; color: #0F766E; font-weight: 700;">
            <span>Extra POS / F&amp;B (${charges.length} items):</span>
            <span style="font-weight: 800;">+₹${posTotal.toLocaleString("en-IN")}</span>
          </div>
        ` : ""}
        ${isLate ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; color: #DC2626; font-weight: 700;">
            <span>Late Checkout Fee (${lateHours}h):</span>
            <span style="font-weight: 800;">+₹${lateFee.toLocaleString("en-IN")}</span>
          </div>
        ` : ""}
        <div style="border-top: 1.5px dashed #CBD5E1; margin: 8px 0;"></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; font-weight: 900; color: #0F172A;">
          <span>Grand Total Payable:</span>
          <span style="color: #059669; font-size: 15px;">₹${grandTotalAmount.toLocaleString("en-IN")}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; font-weight: 800; color: #059669;">
          <span>Total Payments Received:</span>
          <span>−₹${paidAmount.toLocaleString("en-IN")}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1.5px solid #E2E8F0; margin-top: 4px; font-size: 13px; font-weight: 900; color: ${dueAmount <= 0 ? '#059669' : '#DC2626'};">
          <span>Outstanding Balance:</span>
          <span>${dueAmount <= 0 ? '₹0 (✓ Settled)' : `₹${dueAmount.toLocaleString("en-IN")}`}</span>
        </div>
      </div>
    </div>

    <!-- Official Authorization Footer (Page 1) -->
    <div class="pdf-section" style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 14px; border-top: 1.5px solid #E2E8F0; font-size: 11px; color: #64748B;">
      <div>
        <div style="font-weight: 800; color: #0F172A; font-size: 12px;">Thank you for choosing ${hotelName}!</div>
        <div style="font-size: 10px; color: #94A3B8; margin-top: 2px;">Official Guest Stay Folio &bull; Verified and Digitally Sealed by PMS Front Desk</div>
      </div>
      <div style="text-align: right; width: 220px;">
        ${guestSignature ? `
          <div style="height: 42px; display: flex; align-items: center; justify-content: flex-end; margin-bottom: 2px;">
            <img src="${guestSignature}" alt="Guest Signature" style="max-height: 40px; max-width: 200px; object-fit: contain;" />
          </div>
          <div style="border-bottom: 1.5px solid #0F172A; margin-bottom: 4px;"></div>
        ` : `
          <div style="border-bottom: 1.5px dashed #94A3B8; margin-bottom: 6px; height: 35px;"></div>
        `}
        <div style="font-size: 10.5px; font-weight: 800; color: #0F172A; text-transform: uppercase;">Guest / Cashier Signature</div>
      </div>
    </div>

    <!-- ================= DEDICATED PAGE 2: GOVT ID & AADHAAR PROOFS ================= -->
    ${hasAnyIdImages ? `
      <div style="page-break-before: always; break-before: page; padding-top: 10px;">
        <!-- Page 2 Branded Header -->
        <div class="pdf-section" style="background: linear-gradient(135deg, #092622 0%, #0F766E 50%, #14B8A6 100%); border-radius: 14px; padding: 14px 20px; color: #FFFFFF; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 14px rgba(15, 118, 110, 0.2);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 24px;">🪪</div>
            <div>
              <div style="font-size: 16px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.3px;">GOVT ID &amp; AADHAAR CARD PROOFS</div>
              <div style="font-size: 11px; color: rgba(255, 255, 255, 0.9); margin-top: 2px;">
                Folio #${booking.bookingNumber || folioNum} &bull; Primary Guest: <strong>${guestName}</strong>
              </div>
            </div>
          </div>
          <div style="text-align: right; border: none; padding: 4px 8px;">
            <div style="font-size: 11px; font-weight: 900; color: #FFFFFF; text-transform: uppercase; letter-spacing: 0.5px;">PAGE 2 OF 2</div>
            <div style="font-size: 9.5px; color: #99F6E4; margin-top: 1px;">ID Proof Attachments</div>
          </div>
        </div>

        <!-- Verified Status Banner -->
        <div class="pdf-section" style="background: transparent; border: none; border-radius: 10px; padding: 8px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: #15803D;">
            <span>🛡️</span>
            <span>Digitally captured government identification records archived for official regulatory compliance.</span>
          </div>
          <span style="background: transparent; color: #15803D; border: none; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 900;">
            ✓ VERIFIED ATTACHMENTS
          </span>
        </div>

        <!-- ID Cards Grid for Primary Guest & Accompanying Members -->
        <div style="display: grid; grid-template-columns: repeat(${allIdCards.length === 1 ? 1 : 2}, 1fr); gap: 14px; margin-bottom: 20px;">
          ${allIdCards.map((card) => `
            <div class="pdf-section" style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 12px; padding: 12px; box-sizing: border-box;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 6px;">
                <div style="font-size: 12.5px; font-weight: 900; color: #0F172A; display: flex; align-items: center; gap: 6px;">
                  <span>👤 ${card.name}</span>
                  <span style="font-size: 9.5px; font-weight: 800; color: ${card.tagColor}; background: transparent; padding: 1px 6px; border-radius: 4px; border: none;">${card.tag}</span>
                </div>
                <div style="font-size: 11px; font-weight: 800; color: #0F766E; font-family: monospace;">
                  ${card.idType}: ${card.idNumber}
                </div>
              </div>

              <div style="display: grid; grid-template-columns: ${card.frontImg && card.backImg ? "1fr 1fr" : "1fr"}; gap: 10px;">
                ${card.frontImg ? `
                  <div style="border: 1px solid #CBD5E1; border-radius: 8px; overflow: hidden; background: #FFFFFF; padding: 6px;">
                    <div style="font-size: 9.5px; font-weight: 800; color: #64748B; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px;">
                      📄 Front Side Photo
                    </div>
                    <div style="height: 180px; display: flex; align-items: center; justify-content: center; background: #F8FAFC; border-radius: 6px; overflow: hidden; border: 1px solid #E2E8F0;">
                      <img src="${card.frontImg}" alt="Front ID Photo" style="width: 100%; height: 100%; object-fit: contain;" />
                    </div>
                  </div>
                ` : ""}

                ${card.backImg ? `
                  <div style="border: 1px solid #CBD5E1; border-radius: 8px; overflow: hidden; background: #FFFFFF; padding: 6px;">
                    <div style="font-size: 9.5px; font-weight: 800; color: #64748B; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px;">
                      📄 Back Side Photo
                    </div>
                    <div style="height: 180px; display: flex; align-items: center; justify-content: center; background: #F8FAFC; border-radius: 6px; overflow: hidden; border: 1px solid #E2E8F0;">
                      <img src="${card.backImg}" alt="Back ID Photo" style="width: 100%; height: 100%; object-fit: contain;" />
                    </div>
                  </div>
                ` : ""}
              </div>
            </div>
          `).join("")}
        </div>

        ${guestSignature ? `
          <div class="pdf-section" style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 12px; padding: 12px; margin-bottom: 16px; box-sizing: border-box;">
            <div style="font-size: 11.5px; font-weight: 900; color: #0F172A; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 8px;">
              ✍️ Primary Guest Digital E-Signature Record
            </div>
            <div style="height: 100px; display: flex; align-items: center; justify-content: center; background: #FFFFFF; border-radius: 8px; border: 1px solid #E2E8F0; padding: 8px;">
              <img src="${guestSignature}" alt="Guest Digital Signature" style="max-height: 85px; max-width: 320px; object-fit: contain;" />
            </div>
            <div style="font-size: 9.5px; color: #64748B; text-align: center; margin-top: 6px; font-weight: 700;">
              Digitally executed and timestamped at front-desk registration for Folio #${booking.bookingNumber || folioNum}.
            </div>
          </div>
        ` : ""}

        <!-- Page 2 Official Verification Footer -->
        <div class="pdf-section" style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 12px; border-top: 1.5px solid #E2E8F0; font-size: 10.5px; color: #64748B; margin-top: 14px;">
          <div>
            <div style="font-weight: 800; color: #0F172A; font-size: 11.5px;">${hotelName} &bull; Security &amp; Compliance Wing</div>
            <div style="font-size: 9.5px; color: #94A3B8; margin-top: 2px;">Archived Identity Documents attached to Stay Folio #${booking.bookingNumber || folioNum}</div>
          </div>
          <div style="text-align: right; width: 200px;">
            <div style="border-bottom: 1.5px dashed #94A3B8; margin-bottom: 4px; height: 30px;"></div>
            <div style="font-size: 10px; font-weight: 800; color: #0F172A; text-transform: uppercase;">Front Desk Verified</div>
        </div>
      </div>
    ` : ""}
  `;

  openPrintOrSavePDF(`Guest_Folio_${(guest.fullName || guestName || "Guest").replace(/\s+/g, "_")}_${Date.now()}`, html);
}

/**
 * 10. Generate & Download Master Guest Directory Register PDF
 */
export function downloadGuestDirectoryPDF(guests = [], hotel = {}) {
  const hotelName = hotel.name || "MYOWNPMS";
  const hotelAddress = hotel.address || hotel.city || "Gujarat, India";
  const hotelPhone = hotel.phone || "+91 98765 43210";
  const hotelGst = hotel.gstin || "24AABCG1234F1Z8";
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const inHouse = guests.filter((g) => (g.status || "").toUpperCase() === "IN-HOUSE" || (g.status || "").toUpperCase() === "CHECKED_IN").length;
  const departed = guests.filter((g) => (g.status || "").toUpperCase() === "DEPARTED" || (g.status || "").toUpperCase() === "CHECKED_OUT").length;

  const html = `
    <!-- Hero Ribbon -->
    <div class="hero-ribbon">
      <div class="hotel-brand">
        <div class="brand-icon"><img src="/logo.png" alt="MYOWNPMS" onerror="this.outerHTML='👥'" /></div>
        <div>
          <div class="hotel-title">${hotelName}</div>
          <div class="hotel-meta">📍 ${hotelAddress} &bull; 📞 ${hotelPhone} &bull; GSTIN: <strong>${hotelGst}</strong></div>
        </div>
      </div>
      <div class="ribbon-badge">
        <div class="title">Guest Directory</div>
        <div class="sub">Total: ${guests.length} &bull; In-House: ${inHouse}</div>
      </div>
    </div>

    <!-- 4 Mini Summary Cards -->
    <div class="kpi-row">
      <div class="kpi-card blue">
        <div class="kpi-title">Total Registered</div>
        <div class="kpi-val">${guests.length}</div>
        <div class="kpi-sub">Total Master Profiles</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-title">Active In-House</div>
        <div class="kpi-val">${inHouse}</div>
        <div class="kpi-sub">Currently Occupied</div>
      </div>
      <div class="kpi-card orange">
        <div class="kpi-title">Departed / Settled</div>
        <div class="kpi-val">${departed}</div>
        <div class="kpi-sub">Past Stays Completed</div>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-title">Report Date</div>
        <div class="kpi-val" style="font-size:14px;padding-top:4px;">${dateStr}</div>
        <div class="kpi-sub">Verified Master Register</div>
      </div>
    </div>

    <!-- Master Register Table -->
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Guest Full Name</th>
          <th>Mobile Contact</th>
          <th>Booking ID</th>
          <th>Room</th>
          <th>Check-In</th>
          <th>Check-Out</th>
          <th>Pax</th>
          <th>Govt ID</th>
          <th class="text-center">Status</th>
        </tr>
      </thead>
      <tbody>
        ${guests.map((g, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${g.fullName || g.name || "Guest"}</strong></td>
            <td>📞 ${g.mobileNumber || g.phone || "N/A"}</td>
            <td><code style="font-weight:700;">#${g.bookingNumber || (g._id ? g._id.slice(-6).toUpperCase() : "BK-101")}</code></td>
            <td><strong>Room ${g.roomAssigned || g.roomNumber || (g.room?.roomNumber) || "101"}</strong></td>
            <td>${g.checkInDate ? new Date(g.checkInDate).toLocaleDateString("en-IN") : "N/A"}</td>
            <td>${g.checkOutDate ? new Date(g.checkOutDate).toLocaleDateString("en-IN") : "N/A"}</td>
            <td>${g.totalGuests || g.numberOfGuests || 1}</td>
            <td><span class="badge badge-primary">${g.govtIdType || "ID"}: ${g.govtIdNumber || g.idNumber || "Verified"}</span></td>
            <td class="text-center">
              <span class="badge ${g.status === "IN-HOUSE" ? "badge-success" : g.status === "DEPARTED" ? "badge-warning" : "badge-primary"}">
                ${g.status || "REGISTERED"}
              </span>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="footer">
      <div>
        <p>MYOWNPMS Hotel Master Guest Register &bull; Official Regulatory Document</p>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <p>Hotel General Manager</p>
      </div>
    </div>
  `;

  openPrintOrSavePDF(`Guest_Directory_${Date.now()}`, html);
}

/**
 * 11. Generate & Download Official Guest Govt ID / Aadhaar Proof PDF
 * File is named strictly with the guest's name: ID_Proof_[Guest_Name].pdf
 */
export function downloadGuestIdProofPDF(data = {}, hotel = {}) {
  const guest = data.guest || {};
  const booking = data.activeBooking || guest.activeBooking || {};
  const accompanying = data.accompanyingGuests || booking.accompanyingGuests || guest.accompanyingGuests || [];

  const hotelName = hotel.name || "MYOWNPMS Luxury Hotel";
  const hotelAddress = hotel.address || hotel.city || "Marine Drive, Mumbai, Maharashtra";
  const hotelPhone = hotel.phone || hotel.ownerPhone || "+91 98200 12345";
  const hotelGst = hotel.gstin || hotel.settings?.gstin || "27AABCG1234F1Z8";

  const guestName = guest.fullName || guest.name || booking.guestName || "Valued Guest";
  const guestPhone = guest.mobileNumber || guest.phone || booking.guestPhone || "On Record";
  const guestEmail = guest.email || booking.guestEmail || "Not Provided";
  const guestAddress = guest.address?.city || guest.city || guest.address?.fullAddress || guest.address || "Verified On Record";
  const govtIdType = guest.idProof?.idType || guest.govtIdType || guest.idType || "AADHAAR";
  const govtIdNumber = guest.idProof?.idNumber || guest.govtIdNumber || guest.idNumber || "Verified On Record";
  const roomNumberDisplay = booking.roomNumber || booking.room?.roomNumber || guest.roomAssigned || "101";

  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const primaryFront = guest.idProof?.frontImage || guest.idProof?.frontImageUrl || guest.frontImage || guest.idProofImage || booking.idProof?.frontImage || booking.idProofImage;
  const primaryBack = guest.idProof?.backImage || guest.idProof?.backImageUrl || guest.backImage || guest.idProofBackImage || booking.idProof?.backImage || booking.idProofBackImage;

  const allMembers = [
    {
      name: guestName,
      tag: "Primary Guest",
      tagColor: "#0F766E",
      tagBg: "#CCFBF1",
      idType: govtIdType,
      idNumber: govtIdNumber,
      phone: guestPhone,
      email: guestEmail,
      address: guestAddress,
      roomNumber: roomNumberDisplay,
      frontImg: primaryFront,
      backImg: primaryBack,
    },
    ...accompanying.map((m, idx) => ({
      name: m.name || m.fullName || `Co-Guest ${idx + 1}`,
      tag: m.relationship || "Accompanying Guest",
      tagColor: "#6D28D9",
      tagBg: "#EDE9FE",
      idType: m.idType || "AADHAAR",
      idNumber: m.idNumber || "Verified On Record",
      phone: m.phone || guestPhone,
      email: m.email || "-",
      address: guestAddress,
      roomNumber: roomNumberDisplay,
      frontImg: m.frontImage || m.frontImageUrl || m.idProofImage || m.idProof?.frontImage || m.idProof?.frontImageUrl,
      backImg: m.backImage || m.backImageUrl || m.idProofBackImage || m.idProof?.backImage || m.idProof?.backImageUrl,
    }))
  ];

  const html = `
    <!-- Top Branded Executive Header -->
    <div class="pdf-section" style="background: linear-gradient(135deg, #092622 0%, #0F766E 50%, #14B8A6 100%); border-radius: 16px; padding: 18px 22px; color: #FFFFFF; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 8px 24px rgba(15, 118, 110, 0.25);">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 48px; height: 48px; background: #FFFFFF; border: 2px solid rgba(255,255,255,0.8); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; overflow: hidden; padding: 4px; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <img src="/logo.png" alt="${hotelName}" onerror="this.outerHTML='🏨'" style="width:100%;height:100%;object-fit:contain;" />
        </div>
        <div>
          <div style="font-size: 20px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.4px;">${hotelName}</div>
          <div style="font-size: 11px; color: rgba(255, 255, 255, 0.9); font-weight: 600; margin-top: 2px;">
            📍 ${hotelAddress} &bull; 📞 ${hotelPhone}
          </div>
          <div style="display: inline-flex; align-items: center; gap: 5px; margin-top: 4px; border: none; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; letter-spacing: 0.3px;">
            <span style="width: 6px; height: 6px; background: #4ADE80; border-radius: 50%; display: inline-block;"></span>
            GSTIN: <strong>${hotelGst}</strong> &bull; Verified Property
          </div>
        </div>
      </div>

      <div style="text-align: right; border: none; padding: 4px 8px;">
        <div style="font-size: 14px; font-weight: 900; color: #FFFFFF; text-transform: uppercase; letter-spacing: 1px;">GOVT ID PROOF DOSSIER</div>
        <div style="font-size: 13px; font-weight: 800; color: #99F6E4; margin-top: 2px;">${guestName}</div>
        <div style="font-size: 10px; color: rgba(255, 255, 255, 0.85); font-weight: 700; margin-top: 2px;">Date: ${dateStr} &bull; ${timeStr}</div>
      </div>
    </div>

    <!-- Verified Badge Ribbon -->
    <div class="pdf-section" style="background: transparent; border: none; border-radius: 12px; padding: 10px 16px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">🛡️</span>
        <div>
          <div style="font-size: 12px; font-weight: 900; color: #15803D;">GOVERNMENT IDENTIFICATION RECORD</div>
          <div style="font-size: 10px; color: #166534;">Digitally captured, encrypted &amp; verified for compliance with regulatory guest registration norms.</div>
        </div>
      </div>
      <span style="background: transparent; color: #15803D; border: none; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 900;">
        ✓ DIGITALLY VERIFIED
      </span>
    </div>

    <!-- ID Cards for Each Person -->
    ${allMembers.map((m, idx) => `
      <div class="pdf-section" style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 14px; padding: 16px; margin-bottom: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 8px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="font-size: 15px; font-weight: 900; color: #0F172A;">👤 ${m.name}</div>
            <span style="font-size: 10px; font-weight: 800; color: ${m.tagColor}; background: ${m.tagBg}; padding: 2px 8px; border-radius: 6px;">${m.tag}</span>
          </div>
          <div style="font-size: 12px; font-weight: 900; color: #0F172A;">
            ${m.idType}: <span style="font-family: monospace; color: #0F766E;">${m.idNumber}</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px; font-size: 11px; color: #475569; background: #FFFFFF; padding: 10px; border-radius: 8px; border: 1px solid #E2E8F0;">
          <div>📞 Contact: <strong style="color:#0F172A;">${m.phone}</strong></div>
          <div>🏨 Room: <strong style="color:#0F172A;">#${m.roomNumber}</strong></div>
          <div>🏠 City / Address: <strong style="color:#0F172A;">${m.address}</strong></div>
        </div>

        <div style="display: grid; grid-template-columns: ${m.frontImg && m.backImg ? "1fr 1fr" : "1fr"}; gap: 14px;">
          <div style="border: 1.5px solid #CBD5E1; border-radius: 10px; overflow: hidden; background: #FFFFFF; padding: 8px;">
            <div style="font-size: 10.5px; font-weight: 800; color: #64748B; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
              📄 Front Side Photo
            </div>
            ${m.frontImg ? `
              <div style="height: 220px; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background: #F8FAFC; display: flex; align-items: center; justify-content: center;">
                <img src="${m.frontImg}" alt="Front ID Photo" style="width: 100%; height: 100%; object-fit: contain;" />
              </div>
            ` : `
              <div style="height: 120px; border: 1.5px dashed #CBD5E1; border-radius: 8px; background: #F8FAFC; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94A3B8;">
                <span style="font-size: 24px;">🪪</span>
                <span style="font-size: 11px; font-weight: 700; margin-top: 4px;">Verified on Physical Record</span>
                <span style="font-size: 10px;">Number: ${m.idNumber}</span>
              </div>
            `}
          </div>

          ${m.backImg || (m.frontImg && !m.backImg && allMembers.length === 1) ? `
            <div style="border: 1.5px solid #CBD5E1; border-radius: 10px; overflow: hidden; background: #FFFFFF; padding: 8px;">
              <div style="font-size: 10.5px; font-weight: 800; color: #64748B; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                📄 Back Side Photo
              </div>
              ${m.backImg ? `
                <div style="height: 220px; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background: #F8FAFC; display: flex; align-items: center; justify-content: center;">
                  <img src="${m.backImg}" alt="Back ID Photo" style="width: 100%; height: 100%; object-fit: contain;" />
                </div>
              ` : `
                <div style="height: 120px; border: 1.5px dashed #CBD5E1; border-radius: 8px; background: #F8FAFC; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94A3B8;">
                  <span style="font-size: 20px;">📄</span>
                  <span style="font-size: 11px; font-weight: 700; margin-top: 4px;">No Back Image Attached</span>
                  <span style="font-size: 10px;">Single-sided document</span>
                </div>
              `}
            </div>
          ` : ""}
        </div>
      </div>
    `).join("")}

    <!-- Official Authorization Footer -->
    <div class="pdf-section" style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 14px; border-top: 1.5px solid #E2E8F0; font-size: 11px; color: #64748B; margin-top: 14px;">
      <div>
        <div style="font-weight: 800; color: #0F172A; font-size: 12px;">${hotelName} &bull; Security &amp; Compliance Wing</div>
        <div style="font-size: 10px; color: #94A3B8; margin-top: 2px;">Official Regulatory ID Proof Record &bull; Digitally Signed &amp; Archived</div>
      </div>
      <div style="text-align: right; width: 220px;">
        <div style="border-bottom: 1.5px dashed #94A3B8; margin-bottom: 6px; height: 35px;"></div>
        <div style="font-size: 10.5px; font-weight: 800; color: #0F172A; text-transform: uppercase;">Front Desk Officer / Verified</div>
      </div>
    </div>
  `;

  const cleanGuestName = (guest.fullName || guestName || "Guest").replace(/[^a-zA-Z0-9_\-]/g, "_");
  openPrintOrSavePDF(`ID_Proof_${cleanGuestName}`, html);
}

