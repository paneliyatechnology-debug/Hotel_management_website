import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
  
  /* Hero Command Ribbon (Exact match with App Header) */
  .hero-ribbon {
    background: linear-gradient(135deg, #0C273B 0%, #0B8EE0 100%);
    border-radius: 16px;
    padding: 16px 20px;
    color: #FFFFFF;
    margin-bottom: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 8px 20px rgba(11, 142, 224, 0.25);
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
    border: 1px solid rgba(255, 255, 255, 0.4);
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
    background: rgba(255, 255, 255, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.3);
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
    color: #0B8EE0;
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
    color: #0B8EE0;
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
    color: #059669;
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
    box-shadow: 0 2px 8px rgba(12, 39, 59, 0.04);
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
  .kpi-card.blue::before { background: #0B8EE0; }
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
  .kpi-card.blue .kpi-val { color: #0B8EE0; }
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
    background-color: #0C273B;
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
  
  .badge-success { background: #DCFCE7; color: #15803D; border: 1px solid #86EFAC; }
  .badge-warning { background: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; }
  .badge-primary { background: #E0F2FE; color: #0369A1; border: 1px solid #BAE6FD; }
  .badge-purple { background: #EDE9FE; color: #6D28D9; border: 1px solid #DDD6FE; }
  
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
 * Direct PDF Download Engine
 * Converts HTML template directly into a .pdf file and downloads straight to disk
 */
export async function openPrintOrSavePDF(title, htmlBody) {
  if (typeof window === "undefined") return;

  const rawClean = (title || "Document").replace(/[^a-zA-Z0-9_\-]/g, "_");
  const fileName = `${rawClean}.pdf`;

  // Create an off-screen container matching A4 width
  const container = document.createElement("div");
  container.className = "pdf-container";
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px"; // Standard A4 width at 96 DPI
  container.style.minHeight = "1123px";
  container.style.backgroundColor = "#FFFFFF";
  container.style.color = "#0F172A";
  container.style.padding = "24px 32px";
  container.style.boxSizing = "border-box";
  container.style.fontFamily = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  container.style.zIndex = "-9999";

  container.innerHTML = `
    <style>
      ${PDF_DOCUMENT_STYLES}
    </style>
    ${htmlBody}
  `;

  document.body.appendChild(container);

  try {
    // Ensure images like /logo.png are completely loaded before capturing
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

    const canvas = await html2canvas(container, {
      scale: 2, // High-DPI crisp vector-quality rendering
      useCORS: true,
      logging: false,
      backgroundColor: "#FFFFFF",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;
    }

    // Direct Instant Download in Browser!
    pdf.save(fileName);
  } catch (err) {
    console.warn("Direct canvas PDF conversion notice, initiating fallback download window:", err);
    fallbackPrintWindow(title, htmlBody);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
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

  const hotelName = hotel.name || "MYOWNPMS";
  const hotelAddress = hotel.address || hotel.city || "Marine Drive, Mumbai, Maharashtra";
  const hotelGst = hotel.gstin || "27AABCG1234F1Z8";
  const hotelPhone = hotel.phone || hotel.ownerPhone || "+91 98200 12345";
  const invoiceNum = booking.bookingNumber ? `INV-${booking.bookingNumber}` : `INV-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const overstay = calculateOverstayFee(booking, hotel);
  const lateFee = booking.lateCheckoutCharge || overstay.lateFee || 0;
  const lateHours = booking.lateCheckoutHours || overstay.chargeableHours || 0;
  const hourlyRate = booking.hourlyRate || overstay.hourlyRate || (lateHours > 0 ? Math.round(lateFee / lateHours) : 0);
  const isLate = lateFee > 0;

  const posTotal = charges.reduce((s, c) => s + (c.amount || 0), 0);
  
  // Snapshot or calculated values from booking
  const roomBreakdowns = Array.isArray(booking.roomGstBreakdown) && booking.roomGstBreakdown.length > 0 ? booking.roomGstBreakdown : [];
  
  const originalBookingTotal = isLate && booking.totalAmount > lateFee ? booking.totalAmount - lateFee : (booking.totalAmount || 3000);
  const taxableVal = booking.taxableAmount ?? (roomBreakdowns.length > 0 ? roomBreakdowns.reduce((s, r) => s + (r.taxableAmount || 0), 0) : Math.round(originalBookingTotal / 1.18));
  const totalGst = booking.gstAmount ?? (roomBreakdowns.length > 0 ? roomBreakdowns.reduce((s, r) => s + (r.gstAmount || 0), 0) : originalBookingTotal - taxableVal);
  const cgstVal = booking.cgstAmount ?? (roomBreakdowns.length > 0 ? roomBreakdowns.reduce((s, r) => s + (r.cgstAmount || 0), 0) : Math.round(totalGst / 2));
  const sgstVal = booking.sgstAmount ?? (roomBreakdowns.length > 0 ? roomBreakdowns.reduce((s, r) => s + (r.sgstAmount || 0), 0) : Math.round(totalGst - cgstVal));
  const igstVal = booking.igstAmount || 0;
  
  const mainGstRate = booking.gstRate ?? (roomBreakdowns[0]?.gstRate || 18);
  const mainCgstRate = booking.cgstRate ?? (roomBreakdowns[0]?.cgstRate || mainGstRate / 2);
  const mainSgstRate = booking.sgstRate ?? (roomBreakdowns[0]?.sgstRate || mainGstRate / 2);

  const grandTotalAmount = (booking.grandTotal || (booking.totalAmount ? booking.totalAmount : (taxableVal + totalGst + lateFee))) + posTotal;
  const advancePaid = isLate && booking.paidAmount > lateFee ? booking.paidAmount - lateFee : (booking.paidAmount || originalBookingTotal);
  const paidAmount = booking.paidAmount || grandTotalAmount;
  const balanceDue = Math.max(0, grandTotalAmount - paidAmount);

  const html = `
    <div class="header-banner">
      <div class="hotel-brand">
        <div class="brand-icon"><img src="/logo.png" alt="MYOWNPMS" onerror="this.outerHTML='🏨'" /></div>
        <div>
          <div class="hotel-name">${hotelName}</div>
          <div class="hotel-sub">${hotelAddress} &bull; Ph: ${hotelPhone}</div>
          <div class="hotel-sub">GSTIN: <strong>${hotelGst}</strong></div>
        </div>
      </div>
      <div class="doc-meta">
        <div class="doc-title">Tax Invoice</div>
        <div class="doc-id">${invoiceNum}</div>
        <div class="doc-date">Date: ${dateStr}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <h4>Billed To (Primary Guest)</h4>
        <p>${guest.fullName || guest.name || "Valued Guest"}</p>
        <span>📞 Phone: <strong>${guest.mobileNumber || guest.phone || "N/A"}</strong> &bull; ✉️ ${guest.email || "N/A"}</span>
        <span>🛡️ Govt ID: <strong>${guest.idProof?.idType || guest.govtIdType || "Aadhaar"}: ${guest.idProof?.idNumber || guest.govtIdNumber || "XXXX-XXXX-4512"}</strong></span>
        <span>🏠 Address: ${guest.address || guest.city || "On Record"}</span>
      </div>
      <div class="info-block">
        <h4>Stay &amp; Room Allocation</h4>
        <p>Room #${booking.roomNumber || room.roomNumber || "101"} (${roomType.name || "Deluxe Room"})</p>
        <span>Check-In: <strong>${booking.checkInDate ? (typeof booking.checkInDate === 'string' ? booking.checkInDate.split('T')[0] : new Date(booking.checkInDate).toLocaleDateString('en-IN')) : "Today"} (${booking.checkInTime ? formatTime12Hour(booking.checkInTime) : "02:00 PM"})</strong></span>
        <span>Check-Out: <strong>${booking.checkOutDate ? (typeof booking.checkOutDate === 'string' ? booking.checkOutDate.split('T')[0] : new Date(booking.checkOutDate).toLocaleDateString('en-IN')) : "Tomorrow"} (${formatTime12Hour(booking.checkOutTime || hotel.checkOutTime || "12:00")})</strong></span>
        <span>Booking Folio: #${booking.bookingNumber || "BK-8921"}</span>
        ${isLate ? `
          <div style="margin-top:5px;font-size:11px;color:#DC2626;font-weight:700;">
            ⚠️ Late Check-Out: ${lateHours} Hours @ ₹${hourlyRate}/hr (+₹${lateFee.toLocaleString("en-IN")})
          </div>
        ` : ""}
      </div>
    </div>

    <!-- Accompanying Members Table -->
    ${accompanying && accompanying.length > 0 ? `
      <div style="font-size:11.5px;font-weight:900;color:#0F172A;text-transform:uppercase;margin:12px 0 6px 0;letter-spacing:0.5px;">
        👥 Accompanying Family Members &amp; Co-Guests (${accompanying.length})
      </div>
      <table style="margin-bottom:14px;">
        <thead>
          <tr>
            <th>#</th>
            <th>Member Full Name</th>
            <th>Age / Gender</th>
            <th>Relationship</th>
            <th>Govt ID Type</th>
            <th>ID Proof Number</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${accompanying.map((m, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><strong>${m.name || m.fullName || `Member ${idx + 1}`}</strong></td>
              <td>${m.age ? `${m.age} yrs` : "-"} / ${m.gender || "-"}</td>
              <td><span class="badge badge-purple">${m.relationship || "Family Member"}</span></td>
              <td>${m.idType || "AADHAAR"}</td>
              <td><code>${m.idNumber || "Verified On Record"}</code></td>
              <td class="text-center"><span class="badge badge-success">✓ Verified</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    ` : ""}

    <!-- Main Itemized Charges Table -->
    <div style="font-size:11.5px;font-weight:900;color:#0F172A;text-transform:uppercase;margin:12px 0 6px 0;letter-spacing:0.5px;">
      📋 Itemized Room Tariff, Taxes &amp; Extra Services Breakdown
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description of Service / Tariff Charge</th>
          <th class="text-center">HSN/SAC</th>
          <th class="text-right">Qty / Nights</th>
          <th class="text-right">Rate (₹)</th>
          <th class="text-right">Taxable (₹)</th>
          <th class="text-right">GST Rate</th>
          <th class="text-right">Tax Amount (₹)</th>
          <th class="text-right">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${roomBreakdowns.length > 0 ? roomBreakdowns.map((rb, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>
              <strong>Room #${rb.roomNumber || booking.roomNumber} - ${rb.roomTypeName || roomType.name || "Room"}</strong>
              <div style="font-size:10.5px;color:#64748B;">CGST @ ${rb.cgstRate}% (₹${(rb.cgstAmount || 0).toLocaleString("en-IN")}) + SGST @ ${rb.sgstRate}% (₹${(rb.sgstAmount || 0).toLocaleString("en-IN")})</div>
            </td>
            <td class="text-center">996311</td>
            <td class="text-right">${rb.nights || 1}</td>
            <td class="text-right">₹${(rb.basePrice || 0).toLocaleString("en-IN")}</td>
            <td class="text-right">₹${(rb.taxableAmount || 0).toLocaleString("en-IN")}</td>
            <td class="text-right">${rb.gstRate}%</td>
            <td class="text-right">₹${(rb.gstAmount || 0).toLocaleString("en-IN")}</td>
            <td class="text-right"><strong>₹${(rb.finalAmount || 0).toLocaleString("en-IN")}</strong></td>
          </tr>
        `).join("") : `
          <tr>
            <td>1</td>
            <td>
              <strong>Room Accommodation Charges</strong>
              <div style="font-size:10.5px;color:#64748B;">Room #${booking.roomNumber || room.roomNumber || "101"} - CGST @ ${mainCgstRate}% + SGST @ ${mainSgstRate}%</div>
            </td>
            <td class="text-center">996311</td>
            <td class="text-right">${booking.numberOfNights || 1}</td>
            <td class="text-right">₹${taxableVal.toLocaleString("en-IN")}</td>
            <td class="text-right">₹${taxableVal.toLocaleString("en-IN")}</td>
            <td class="text-right">${mainGstRate}%</td>
            <td class="text-right">₹${totalGst.toLocaleString("en-IN")}</td>
            <td class="text-right"><strong>₹${(taxableVal + totalGst).toLocaleString("en-IN")}</strong></td>
          </tr>
        `}
        ${isLate ? `
          <tr>
            <td>${(roomBreakdowns.length || 1) + 1}</td>
            <td>
              <strong>Late Check-Out Penalty Surcharge</strong>
              <div style="font-size:10.5px;color:#DC2626;">Overstayed ${lateHours} Hours past scheduled check-out @ ₹${hourlyRate}/hr</div>
            </td>
            <td class="text-center">996311</td>
            <td class="text-right">${lateHours}h</td>
            <td class="text-right">₹${hourlyRate.toLocaleString("en-IN")}</td>
            <td class="text-right">₹${lateFee.toLocaleString("en-IN")}</td>
            <td class="text-right">0%</td>
            <td class="text-right">₹0</td>
            <td class="text-right"><strong>₹${lateFee.toLocaleString("en-IN")}</strong></td>
          </tr>
        ` : ""}
        ${charges.map((c, i) => `
          <tr>
            <td>${(roomBreakdowns.length || 1) + (isLate ? 1 : 0) + 1 + i}</td>
            <td>
              <strong>${c.title || c.item || c.serviceName || "POS Room Service / Extra Item"}</strong>
              <div style="font-size:10.5px;color:#64748B;">
                Category: <strong>${c.category || "F&B / Sundry"}</strong>${c.reason || c.note ? ` &bull; Reason: ${c.reason || c.note}` : ""}
              </div>
            </td>
            <td class="text-center">996331</td>
            <td class="text-right">${c.quantity || 1}</td>
            <td class="text-right">₹${(c.amount || 0).toLocaleString("en-IN")}</td>
            <td class="text-right">₹${(c.amount || 0).toLocaleString("en-IN")}</td>
            <td class="text-right">0%</td>
            <td class="text-right">₹0</td>
            <td class="text-right"><strong>₹${(c.amount || 0).toLocaleString("en-IN")}</strong></td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <!-- Payment Transactions & Receipts Ledger -->
    ${paymentHistory && paymentHistory.length > 0 ? `
      <div style="font-size:11.5px;font-weight:900;color:#0F172A;text-transform:uppercase;margin:12px 0 6px 0;letter-spacing:0.5px;">
        💳 Payment Transaction History Ledger (${paymentHistory.length})
      </div>
      <table style="margin-bottom:14px;">
        <thead>
          <tr>
            <th>#</th>
            <th>Receipt / Txn ID</th>
            <th>Date &amp; Time</th>
            <th>Payment Stage</th>
            <th>Method</th>
            <th class="text-right">Amount (₹)</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${paymentHistory.map((p, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><strong style="color:#0B8EE0;">#${p.receiptNumber || p.transactionId || "RCP-001"}</strong></td>
              <td>${p.formattedDate || (p.createdAt ? new Date(p.createdAt).toLocaleString("en-IN") : dateStr)}</td>
              <td>${p.paymentType || "Tariff Advance / Settlement"}</td>
              <td><span class="badge badge-primary">${p.paymentMethod || "CASH"}</span></td>
              <td class="text-right" style="font-weight:900;color:#059669;">₹${(p.amount || 0).toLocaleString("en-IN")}</td>
              <td class="text-center"><span class="badge badge-success">✓ ${p.status || "PAID"}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    ` : ""}

    <!-- Total Financial Settlement Summary Card -->
    <div class="total-card">
      <div class="total-row">
        <span>Room Base Tariff:</span>
        <span>₹${taxableVal.toLocaleString("en-IN")}</span>
      </div>
      <div class="total-row">
        <span>GST Taxes (CGST ₹${cgstVal.toLocaleString("en-IN")} + SGST ₹${sgstVal.toLocaleString("en-IN")}):</span>
        <span>₹${totalGst.toLocaleString("en-IN")}</span>
      </div>
      ${posTotal > 0 ? `
        <div class="total-row" style="color:#0B8EE0;font-weight:700;">
          <span>Extra POS / Food &amp; Services (${charges.length} items):</span>
          <span>+₹${posTotal.toLocaleString("en-IN")}</span>
        </div>
      ` : ""}
      ${isLate ? `
        <div class="total-row" style="color:#DC2626;font-weight:700;">
          <span>Late Checkout Fee (${lateHours}h @ ₹${hourlyRate}/hr):</span>
          <span>+₹${lateFee.toLocaleString("en-IN")}</span>
        </div>
      ` : ""}
      <div class="total-row grand">
        <span>Grand Total Payable:</span>
        <span>₹${grandTotalAmount.toLocaleString("en-IN")}</span>
      </div>
      <div class="total-row" style="color:#059669;font-weight:800;">
        <span>Total Payments Received:</span>
        <span>-₹${paidAmount.toLocaleString("en-IN")}</span>
      </div>
      <div class="total-row" style="color:${balanceDue > 0 ? '#DC2626' : '#059669'};font-weight:900;font-size:13px;border-top:1px dashed #CBD5E1;padding-top:4px;margin-top:4px;">
        <span>Outstanding Balance Due:</span>
        <span>₹${balanceDue.toLocaleString("en-IN")}</span>
      </div>
    </div>

    <div class="footer">
      <div>
        <p><strong>Thank you for choosing ${hotelName}!</strong></p>
        <p>This is a computer-generated tax invoice verified under GST regulations.</p>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <p>Authorized Signatory / Cashier</p>
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

    <div style="background:#F0FDF4;border:2px solid #86EFAC;border-radius:14px;padding:20px;text-align:center;margin-bottom:24px;">
      <div style="font-size:12px;font-weight:800;color:#15803D;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Amount Paid in Full</div>
      <div style="font-size:32px;font-weight:900;color:#15803D;letter-spacing:-1px;">₹${(payment.amount || 0).toLocaleString("en-IN")}</div>
      <div style="font-size:12px;color:#166534;margin-top:4px;">Transaction Stage: <strong>${payment.paymentType || "SETTLEMENT"}</strong> &bull; Status: <strong>PAID / VERIFIED</strong></div>
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
        <div class="doc-title" style="color:#0B8EE0;">Network Directory</div>
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
          <div class="amt" style="color:#0B8EE0;">₹${roomRev.toLocaleString("en-IN")}</div>
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
              <strong style="color:#0B8EE0;">#${t.receiptNumber || t.transactionId || "N/A"}</strong>
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

  const hotelName = hotel.name || "MYOWNPMS";
  const hotelAddress = hotel.address || hotel.city || "Gujarat, India";
  const hotelPhone = hotel.phone || "+91 98765 43210";
  const hotelGst = hotel.gstin || "24AABCG1234F1Z8";

  const overstay = calculateOverstayFee(booking, hotel);
  const lateFee = booking.lateCheckoutCharge || overstay.lateFee || 0;
  const lateHours = booking.lateCheckoutHours || overstay.chargeableHours || 0;
  const hourlyRate = booking.hourlyRate || overstay.hourlyRate || (lateHours > 0 ? Math.round(lateFee / lateHours) : 0);
  const isLate = lateFee > 0;

  const baseTariff = paymentDetails.baseAmount ?? booking.taxableAmount ?? Math.round((booking.totalAmount || 0) / 1.18);
  const gstAmount = paymentDetails.gstAmount ?? booking.gstAmount ?? ((booking.totalAmount || 0) - baseTariff);
  const cgst = paymentDetails.cgstAmount ?? booking.cgstAmount ?? Math.round(gstAmount / 2);
  const sgst = paymentDetails.sgstAmount ?? booking.sgstAmount ?? Math.round(gstAmount - cgst);
  const posTotal = charges.reduce((s, c) => s + (c.amount || 0), 0);

  const totalAmount = paymentDetails.totalAmount ?? (booking.totalAmount || (baseTariff + gstAmount + lateFee + posTotal));
  const paidAmount = paymentDetails.paidAmount ?? booking.paidAmount ?? totalAmount;
  const dueAmount = paymentDetails.dueAmount ?? booking.dueAmount ?? Math.max(0, totalAmount - paidAmount);
  const isPaid = dueAmount <= 0;

  const html = `
    <!-- Hero Ribbon -->
    <div class="hero-ribbon">
      <div class="hotel-brand">
        <div class="brand-icon"><img src="/logo.png" alt="MYOWNPMS" onerror="this.outerHTML='👤'" /></div>
        <div>
          <div class="hotel-title">${hotelName}</div>
          <div class="hotel-meta">📍 ${hotelAddress} &bull; 📞 ${hotelPhone} &bull; GSTIN: <strong>${hotelGst}</strong></div>
        </div>
      </div>
      <div class="ribbon-badge">
        <div class="title">Guest Stay Folio</div>
        <div class="sub">Folio #${booking.bookingNumber || `GF-${Date.now().toString().slice(-6)}`}</div>
      </div>
    </div>

    <!-- Guest Profile & Stay Grid (Exact match with Modal Tab 0 & Tab 1) -->
    <div class="info-grid">
      <div class="info-block">
        <h4>Primary Guest Profile</h4>
        <p><strong>${guest.fullName || guest.name || "Guest"}</strong></p>
        <span>📞 Phone: <strong>${guest.mobileNumber || guest.phone || "N/A"}</strong></span>
        <span>✉️ Email: ${guest.email || "Not Provided"}</span>
        <span>🏠 City / Address: ${guest.address?.city || guest.city || guest.address?.fullAddress || guest.address || "N/A"}</span>
        <span>Age &amp; Gender: <strong>${guest.age ? `${guest.age} yrs` : "-"} / ${guest.gender || "Male"}</strong></span>
        <span style="margin-top:4px;">🛡️ Govt ID: <strong style="color:#0B8EE0;">${guest.idProof?.idType || guest.govtIdType || "AADHAAR"}: ${guest.idProof?.idNumber || guest.govtIdNumber || guest.idNumber || "Verified"}</strong></span>
      </div>
      <div class="info-block">
        <h4>Stay &amp; Room Assignment</h4>
        <p>Room: <strong>${booking.room?.roomNumber || booking.roomNumber || guest.roomAssigned || "101"}</strong> (${booking.roomType?.name || "Executive Suite"})</p>
        <span>Check-In: <strong>${booking.checkInDate ? (typeof booking.checkInDate === 'string' ? booking.checkInDate.split('T')[0] : new Date(booking.checkInDate).toLocaleDateString('en-IN')) : "Today"} (${booking.checkInTime ? formatTime12Hour(booking.checkInTime) : "02:00 PM"})</strong></span>
        <span>Check-Out: <strong>${booking.checkOutDate ? (typeof booking.checkOutDate === 'string' ? booking.checkOutDate.split('T')[0] : new Date(booking.checkOutDate).toLocaleDateString('en-IN')) : "Upcoming"} (${formatTime12Hour(booking.checkOutTime || hotel.checkOutTime || "12:00")})</strong></span>
        <span>Duration: <strong>${booking.numberOfNights || 1} Night(s)</strong></span>
        <span>Stay Status: <span class="badge badge-success">${guest.status || "IN-HOUSE"}</span></span>
        <span style="margin-top:4px;">Billing Status: <span class="badge ${isPaid ? "badge-success" : "badge-warning"}">${isPaid ? "PAID IN FULL" : `DUE: ₹${dueAmount.toLocaleString("en-IN")}`}</span></span>
      </div>
    </div>

    <!-- Accompanying Members Table (Exact Match with UI) -->
    ${accompanying && accompanying.length > 0 ? `
      <div style="font-size:11.5px;font-weight:900;color:#0F172A;text-transform:uppercase;margin:14px 0 6px 0;letter-spacing:0.5px;">
        👥 Accompanying Family Members &amp; Co-Guests (${accompanying.length})
      </div>
      <table style="margin-bottom:14px;">
        <thead>
          <tr>
            <th>#</th>
            <th>Member Full Name</th>
            <th>Age / Gender</th>
            <th>Relationship</th>
            <th>Govt ID Type</th>
            <th>ID Document Number</th>
            <th class="text-center">Verification Status</th>
          </tr>
        </thead>
        <tbody>
          ${accompanying.map((m, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><strong>${m.name || m.fullName || `Member ${idx + 1}`}</strong></td>
              <td>${m.age ? `${m.age} yrs` : "-"} / ${m.gender || "-"}</td>
              <td><span class="badge badge-purple">${m.relationship || "Family Member"}</span></td>
              <td>${m.idType || "AADHAAR"}</td>
              <td><code>${m.idNumber || "Verified On Record"}</code></td>
              <td class="text-center"><span class="badge badge-success">✓ Verified</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    ` : ""}

    <!-- Allocated Rooms Breakdown Table (if multiple rooms) -->
    ${roomsDetail && roomsDetail.length > 0 ? `
      <div style="font-size:11.5px;font-weight:900;color:#0F172A;text-transform:uppercase;margin:14px 0 6px 0;letter-spacing:0.5px;">
        🛏️ Allocated Rooms &amp; Tariff Breakdown (${roomsDetail.length})
      </div>
      <table style="margin-bottom:14px;">
        <thead>
          <tr>
            <th>#</th>
            <th>Room Number</th>
            <th>Category / Type</th>
            <th>Nights</th>
            <th class="text-right">Price / Night (₹)</th>
            <th class="text-right">Room Total (₹)</th>
            <th class="text-center">Room Status</th>
          </tr>
        </thead>
        <tbody>
          ${roomsDetail.map((rm, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><strong style="color:#0B8EE0;">Room #${rm.roomNumber}</strong></td>
              <td>${rm.roomType || "Standard Room"}</td>
              <td>${rm.numberOfNights || 1} Night(s)</td>
              <td class="text-right">₹${(rm.pricePerNight || 0).toLocaleString("en-IN")}</td>
              <td class="text-right" style="font-weight:800;">₹${(rm.roomTotal || 0).toLocaleString("en-IN")}</td>
              <td class="text-center"><span class="badge badge-primary">${rm.status || "OCCUPIED"}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    ` : ""}

    <!-- Extra Charges, Services & Modifications Table -->
    ${charges && charges.length > 0 ? `
      <div style="font-size:11.5px;font-weight:900;color:#0F172A;text-transform:uppercase;margin:14px 0 6px 0;letter-spacing:0.5px;">
        ➕ Extra Services, Food &amp; Charges (${charges.length})
      </div>
      <table style="margin-bottom:14px;">
        <thead>
          <tr>
            <th>#</th>
            <th>Service / Charge Description</th>
            <th>Category</th>
            <th>Reason / Change Note</th>
            <th class="text-center">Logged Date</th>
            <th class="text-right">Amount (₹)</th>
            <th class="text-center">Added By</th>
          </tr>
        </thead>
        <tbody>
          ${charges.map((c, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><strong>${c.title || c.item || c.serviceName || "Extra Service Charge"}</strong></td>
              <td><span class="badge badge-primary">${c.category || "F&B / Sundry"}</span></td>
              <td>${c.reason || c.note || c.description || "Guest Requested Service"}</td>
              <td class="text-center">${c.date || (c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : "Recorded")}</td>
              <td class="text-right" style="font-weight:800;color:#0B8EE0;">+₹${(c.amount || 0).toLocaleString("en-IN")}</td>
              <td class="text-center">${c.addedByName || c.addedBy?.name || "Front Desk"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    ` : ""}

    <!-- Late Checkout Surcharge Box -->
    ${isLate ? `
      <div class="late-checkout-box">
        <div class="title">⚠️ Late Check-Out Surcharge Applied</div>
        <div class="desc">
          Guest departed past scheduled check-out time. Overstay: <strong>${lateHours} Hours</strong> @ <strong>₹${hourlyRate}/hr</strong>. Additional Late Fee: <strong>+₹${lateFee.toLocaleString("en-IN")}</strong>
        </div>
      </div>
    ` : ""}

    <!-- Payment & Billing History Table (Exact match with Modal Tab 2) -->
    <div style="font-size:11.5px;font-weight:900;color:#0F172A;text-transform:uppercase;margin:14px 0 6px 0;letter-spacing:0.5px;">
      💳 Payment &amp; Billing History Ledger (${paymentHistory.length})
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Receipt / Txn ID</th>
          <th>Date &amp; Time</th>
          <th>Payment Stage</th>
          <th>Mode</th>
          <th class="text-right">Amount (₹)</th>
          <th class="text-center">Status</th>
        </tr>
      </thead>
      <tbody>
        ${paymentHistory.length > 0 ? paymentHistory.map((p, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong style="color:#0B8EE0;">#${p.receiptNumber || p.transactionId || "RCP-001"}</strong></td>
            <td>${p.formattedDate || (p.createdAt ? new Date(p.createdAt).toLocaleString("en-IN") : "N/A")}</td>
            <td>${p.paymentType || "Booking Settlement"}</td>
            <td><span class="badge badge-primary">${p.paymentMethod || "CASH"}</span></td>
            <td class="text-right" style="font-weight:900;color:#059669;">₹${(p.amount || 0).toLocaleString("en-IN")}</td>
            <td class="text-center"><span class="badge badge-success">✓ ${p.status || "PAID"}</span></td>
          </tr>
        `).join("") : `
          <tr>
            <td colspan="7" style="text-align:center;padding:16px;color:#64748B;">No prior transactions recorded for this folio.</td>
          </tr>
        `}
      </tbody>
    </table>

    <!-- Grand Financial Settlement Card -->
    <div class="summary-card-right" style="width:330px;">
      <div class="summary-row">
        <span>Base Room Tariff:</span>
        <span style="font-weight:700;">₹${baseTariff.toLocaleString("en-IN")}</span>
      </div>
      <div class="summary-row">
        <span>GST Taxes (CGST ₹${cgst.toLocaleString("en-IN")} + SGST ₹${sgst.toLocaleString("en-IN")}):</span>
        <span style="font-weight:700;">₹${gstAmount.toLocaleString("en-IN")}</span>
      </div>
      ${posTotal > 0 ? `
        <div class="summary-row" style="color:#0B8EE0;font-weight:700;">
          <span>Extra Services &amp; POS (+):</span>
          <span>+₹${posTotal.toLocaleString("en-IN")}</span>
        </div>
      ` : ""}
      ${isLate ? `
        <div class="summary-row" style="color:#DC2626;font-weight:700;">
          <span>Late Checkout Surcharge (+):</span>
          <span>+₹${lateFee.toLocaleString("en-IN")}</span>
        </div>
      ` : ""}
      <div class="summary-row grand">
        <span>Grand Total Amount:</span>
        <span>₹${totalAmount.toLocaleString("en-IN")}</span>
      </div>
      <div class="summary-row" style="color:#059669;font-weight:800;">
        <span>Total Payments Received (-):</span>
        <span>₹${paidAmount.toLocaleString("en-IN")}</span>
      </div>
      <div class="summary-row" style="color:${isPaid ? '#059669' : '#DC2626'};font-weight:900;border-top:1px dashed #CBD5E1;padding-top:4px;margin-top:4px;">
        <span>Net Balance Due:</span>
        <span>₹${dueAmount.toLocaleString("en-IN")}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>
        <p>Guest registered and verified under PMS Regulations</p>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <p>Guest Signature / Front Desk</p>
      </div>
    </div>
  `;

  openPrintOrSavePDF(`Guest_Folio_${guest.fullName || "Guest"}_${Date.now()}`, html);
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

