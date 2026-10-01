/**
 * Centralized Enterprise PDF & Print Document Engine for Grand Royale PMS
 * Generates pristine, print-ready, formatted PDF documents for all 3 panels:
 * 1. Receptionist (GST Tax Invoice, Payment Receipt, Police Manifest, Shift Statement)
 * 2. Hotel Admin (Daily Collections Ledger, Handover Slip, Guest Folio, Staff Roster)
 * 3. Super Admin (Hotels Directory Network Report, Platform Security Audit Logs)
 */

export function openPrintOrSavePDF(title, htmlBody) {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank", "width=850,height=900,menubar=no,toolbar=no,location=no,status=no");
  if (!printWindow) {
    alert("Please allow popups to generate and download the PDF document.");
    return;
  }

  const documentHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title || "Document"}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 12mm 15mm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      background-color: #FFFFFF;
      color: #0F172A;
      font-size: 13px;
      line-height: 1.5;
      padding: 20px;
    }
    
    .header-banner {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #E2E8F0;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    
    .hotel-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .brand-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #D97706 0%, #B45309 100%);
      color: #FFFFFF;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 900;
    }
    
    .hotel-name {
      font-size: 20px;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: -0.5px;
    }
    
    .hotel-sub {
      font-size: 11px;
      color: #64748B;
      font-weight: 600;
    }
    
    .doc-meta {
      text-align: right;
    }
    
    .doc-title {
      font-size: 18px;
      font-weight: 900;
      color: #0B8EE0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .doc-id {
      font-size: 13px;
      font-weight: 800;
      color: #334155;
      font-family: monospace;
    }
    
    .doc-date {
      font-size: 11px;
      color: #64748B;
      font-weight: 600;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 22px;
    }
    
    .info-block h4 {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748B;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    
    .info-block p {
      font-size: 13px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 3px;
    }
    
    .info-block span {
      font-size: 11px;
      color: #64748B;
      display: block;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 22px;
    }
    
    th {
      background-color: #F1F5F9;
      color: #334155;
      font-weight: 800;
      font-size: 11.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1.5px solid #CBD5E1;
    }
    
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #E2E8F0;
      font-size: 12.5px;
      color: #1E293B;
    }
    
    tr:nth-child(even) td {
      background-color: #FAFAFA;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    .total-card {
      margin-left: auto;
      width: 320px;
      background: #F8FAFC;
      border: 1.5px solid #E2E8F0;
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 24px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 12.5px;
    }
    
    .total-row.grand {
      border-top: 1.5px solid #CBD5E1;
      padding-top: 8px;
      margin-top: 8px;
      font-size: 15px;
      font-weight: 900;
      color: #0B8EE0;
    }
    
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
    }
    
    .badge-success { background: #DCFCE7; color: #15803D; border: 1px solid #86EFAC; }
    .badge-warning { background: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; }
    .badge-primary { background: #E0F2FE; color: #0369A1; border: 1px solid #BAE6FD; }
    
    .footer {
      border-top: 1.5px solid #E2E8F0;
      padding-top: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 30px;
      font-size: 11px;
      color: #64748B;
    }
    
    .sign-box {
      text-align: center;
      width: 180px;
    }
    
    .sign-line {
      border-bottom: 1.5px solid #94A3B8;
      height: 36px;
      margin-bottom: 6px;
    }
    
    .no-print-bar {
      background: #0F172A;
      color: #FFFFFF;
      padding: 10px 16px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .btn-print {
      background: #0B8EE0;
      color: #FFFFFF;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 800;
      cursor: pointer;
      font-size: 13px;
    }
    
    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <span>🖨️ Print Preview Mode &bull; Click Print or press Ctrl+P to Save as PDF</span>
    <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
  </div>
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

import { calculateOverstayFee, formatTime12Hour } from "./timeUtils";

/**
 * 1. Generate & Download Official GST Tax Invoice PDF (Receptionist / Front Desk)
 */
export function downloadTaxInvoicePDF(booking = {}, hotel = {}) {
  const guest = booking.guest || {};
  const room = booking.room || {};
  const roomType = booking.roomType || {};
  const charges = booking.posCharges || [];

  const hotelName = hotel.name || "Grand Royale Luxury Resort";
  const hotelAddress = hotel.address || hotel.city || "Marine Drive, Mumbai, Maharashtra";
  const hotelGst = hotel.gstin || "27AABCG1234F1Z8";
  const hotelPhone = hotel.phone || hotel.ownerPhone || "+91 98200 12345";
  const invoiceNum = booking.bookingNumber ? `INV-${booking.bookingNumber}` : `INV-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const overstay = calculateOverstayFee(booking, hotel);
  const posTotal = charges.reduce((s, c) => s + (c.amount || 0), 0);
  const roomTariff = (booking.totalAmount || 4500) > posTotal ? (booking.totalAmount - posTotal) : (booking.totalAmount || 4500);
  const subtotal = roomTariff + posTotal + (overstay.lateFee || 0);
  const paidAmount = booking.paidAmount || 0;
  const balanceDue = Math.max(0, subtotal - paidAmount);
  const gstRate = 12;
  const gstAmount = Math.round((subtotal * gstRate) / (100 + gstRate));
  const baseAmount = subtotal - gstAmount;

  const html = `
    <div class="header-banner">
      <div class="hotel-brand">
        <div class="brand-icon">🏨</div>
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
        <span>📞 ${guest.mobileNumber || guest.phone || "N/A"} &bull; ✉️ ${guest.email || "N/A"}</span>
        <span>Govt ID: ${guest.idProof?.idType || guest.govtIdType || "Aadhaar"}: ${guest.idProof?.idNumber || guest.govtIdNumber || "XXXX-XXXX-4512"}</span>
        ${booking.accompanyingGuests && booking.accompanyingGuests.length > 0 ? `
          <div style="margin-top:6px;font-size:11px;color:#334155;">
            <strong>Accompanying Guests (${booking.accompanyingGuests.length}):</strong><br/>
            ${booking.accompanyingGuests.map(m => `&bull; ${m.name} (${m.relationship || "Family"}${m.idNumber ? ` - ${m.idType}: ${m.idNumber}` : ""})`).join("<br/>")}
          </div>
        ` : ""}
      </div>
      <div class="info-block">
        <h4>Stay &amp; Room Allocation</h4>
        <p>Room #${booking.roomNumber || room.roomNumber || "101"} (${roomType.name || "Deluxe Suite"})</p>
        <span>Check-In: <strong>${booking.checkInDate || "Today"} (${booking.checkInTime ? formatTime12Hour(booking.checkInTime) : "02:00 PM"})</strong></span>
        <span>Check-Out: <strong>${booking.checkOutDate || "Tomorrow"} (${formatTime12Hour(booking.checkOutTime || hotel.checkOutTime || "12:00")})</strong></span>
        <span>Booking Folio: #${booking.bookingNumber || "BK-8921"}</span>
        ${overstay.isOverstay ? `
          <div style="margin-top:5px;font-size:11px;color:#DC2626;font-weight:700;">
            ⚠️ Late Check-Out: +${overstay.overdueHours} hrs past checkout (+₹${overstay.lateFee.toLocaleString("en-IN")} for ${overstay.extraDays} Extra Day)
          </div>
        ` : ""}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description of Service / Charge</th>
          <th class="text-center">HSN/SAC</th>
          <th class="text-right">Qty / Nights</th>
          <th class="text-right">Rate (₹)</th>
          <th class="text-right">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>
            <strong>Room Accommodation Charges</strong>
            <div style="font-size:11px;color:#64748B;">Room #${booking.roomNumber || "101"} - ${roomType.name || "Executive Suite"}</div>
          </td>
          <td class="text-center">996311</td>
          <td class="text-right">1</td>
          <td class="text-right">₹${roomTariff.toLocaleString("en-IN")}</td>
          <td class="text-right">₹${roomTariff.toLocaleString("en-IN")}</td>
        </tr>
        ${overstay.isOverstay ? `
          <tr>
            <td>2</td>
            <td>
              <strong>Late Check-Out / Overstay Tariff</strong>
              <div style="font-size:11px;color:#DC2626;">Stayed +${overstay.overdueHours}h past scheduled check-out (${overstay.extraDays} Extra Day Tariff)</div>
            </td>
            <td class="text-center">996311</td>
            <td class="text-right">${overstay.extraDays}</td>
            <td class="text-right">₹${overstay.dailyRate.toLocaleString("en-IN")}</td>
            <td class="text-right">₹${overstay.lateFee.toLocaleString("en-IN")}</td>
          </tr>
        ` : ""}
        ${charges.map((c, i) => `
          <tr>
            <td>${(overstay.isOverstay ? 3 : 2) + i}</td>
            <td>
              <strong>${c.title || c.item || "POS Room Service / Mini-bar"}</strong>
              <div style="font-size:11px;color:#64748B;">F&amp;B / Sundry Service</div>
            </td>
            <td class="text-center">996331</td>
            <td class="text-right">1</td>
            <td class="text-right">₹${(c.amount || 0).toLocaleString("en-IN")}</td>
            <td class="text-right">₹${(c.amount || 0).toLocaleString("en-IN")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="total-card">
      <div class="total-row">
        <span>Taxable Value:</span>
        <span>₹${baseAmount.toLocaleString("en-IN")}</span>
      </div>
      <div class="total-row">
        <span>CGST (6%):</span>
        <span>₹${Math.round(gstAmount / 2).toLocaleString("en-IN")}</span>
      </div>
      <div class="total-row">
        <span>SGST (6%):</span>
        <span>₹${Math.round(gstAmount / 2).toLocaleString("en-IN")}</span>
      </div>
      <div class="total-row grand">
        <span>Total Gross Bill:</span>
        <span>₹${subtotal.toLocaleString("en-IN")}</span>
      </div>
      <div class="total-row" style="color:#059669;font-weight:700;">
        <span>Amount Settled / Paid:</span>
        <span>₹${paidAmount.toLocaleString("en-IN")}</span>
      </div>
      <div class="total-row" style="color:${balanceDue > 0 ? '#DC2626' : '#059669'};font-weight:800;">
        <span>Balance Due:</span>
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
  const hotelName = hotel.name || "Grand Royale Luxury Resort";
  const receiptNum = payment.receiptNumber || `RCP-${Date.now().toString().slice(-6)}`;
  const dateStr = payment.dateStr || new Date().toLocaleDateString("en-IN");
  const timeStr = payment.timeStr || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const html = `
    <div class="header-banner">
      <div class="hotel-brand">
        <div class="brand-icon">💳</div>
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
  const hotelName = hotel.name || "Grand Royale Luxury Resort";
  const code = handover.handoverCode || `HO-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date(handover.createdAt || Date.now()).toLocaleString("en-IN");

  const html = `
    <div class="header-banner">
      <div class="hotel-brand">
        <div class="brand-icon">💼</div>
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
  const hotelName = hotel.name || "Grand Royale Luxury Resort";
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const html = `
    <div class="header-banner">
      <div class="hotel-brand">
        <div class="brand-icon">🛡️</div>
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
  const hotelName = hotel.name || "Grand Royale Luxury Resort";

  const html = `
    <div class="header-banner">
      <div class="hotel-brand">
        <div class="brand-icon">📊</div>
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
        <p>Grand Royale Enterprise PMS Treasury Audit</p>
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
        <div class="brand-icon">🔒</div>
        <div>
          <div class="hotel-name">Grand Royale Cloud PMS Platform</div>
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
        <div class="brand-icon">🌐</div>
        <div>
          <div class="hotel-name">Grand Royale Multi-Tenant Hotel Network</div>
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
        <span>Platform: Grand Royale Cloud Multi-Tenant Cluster</span>
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
        <p>Grand Royale Multi-Tenant Hospitality Platform Enterprise Report</p>
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <p>Super Administrator</p>
      </div>
    </div>
  `;

  openPrintOrSavePDF(`Hotels_Directory_Report_${Date.now()}`, html);
}
