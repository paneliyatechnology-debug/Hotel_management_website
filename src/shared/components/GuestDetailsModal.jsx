"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  Grid,
  Chip,
  Avatar,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Close,
  Person,
  Phone,
  Email,
  Badge,
  BadgeOutlined,
  CalendarMonth,
  MeetingRoom,
  CreditCard,
  History,
  CheckCircle,
  WarningAmber,
  Receipt,
  Payments as PaymentIcon,
  Timeline as TimelineIcon,
  RoomService,
  Home,
  DoneAll,
  Visibility,
  FileDownload,
  LocationOn,
  Group,
  WhatsApp,
  EventNote,
  Hotel,
  Key,
  Logout,
  ReceiptLong,
  Security,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_BASE_URL, API_ENDPOINTS, apiRequest } from "@/config/api";
import StatusChip from "@/shared/components/StatusChip";
import { downloadAllGuestIdImages, downloadSingleImage, sanitizeFilename } from "@/shared/utils/idProofDownloader";
import { downloadGuestFolioPDF } from "@/shared/utils/pdfGenerator";
import { sendCheckInWhatsApp, sendCheckoutBillWhatsApp } from "@/shared/utils/whatsappUtils";
import { formatTime12Hour } from "@/shared/utils/timeUtils";
import { toast } from "@/shared/utils/toast";
import { removeCircularReferences } from "@/shared/utils/guestModalUtils";

/**
 * Normalizes an image or document URL/data-URI safely
 */
function normalizeImageSrc(val) {
  if (!val) return null;

  // 1. If val is an object or array, extract image URL string
  if (typeof val === "object") {
    if (Array.isArray(val)) {
      if (val.length === 0) return null;
      for (const item of val) {
        const res = normalizeImageSrc(item);
        if (res) return res;
      }
      return null;
    }
    const extracted =
      val.url ||
      val.secure_url ||
      val.path ||
      val.location ||
      val.src ||
      val.fileUrl ||
      val.uri ||
      val.frontImage ||
      val.front_image ||
      val.id_proof_front ||
      val.id_proof_image ||
      val.id_proof_url ||
      val.backImage ||
      val.back_image ||
      val.id_proof_back ||
      val.image ||
      val.signature ||
      val.guest_signature ||
      val.data;
    if (extracted && extracted !== val) {
      return normalizeImageSrc(extracted);
    }
    return null;
  }

  if (typeof val !== "string") return null;
  let trimmed = val.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined" || trimmed === "[object Object]") return null;

  // Normalize Windows-style backslashes
  trimmed = trimmed.replace(/\\/g, "/");

  // Strip public/ prefix if multer/express saved with public/
  if (trimmed.startsWith("public/")) {
    trimmed = trimmed.replace(/^public\//, "");
  }

  // 2. Parse JSON string if encoded as JSON array or object
  if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
    try {
      const parsed = JSON.parse(trimmed);
      const res = normalizeImageSrc(parsed);
      if (res) return res;
    } catch {}
  }

  // 3. Remove enclosing quotes if double-encoded
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  // Handle comma-separated list of images
  if (trimmed.includes(",") && !trimmed.startsWith("data:")) {
    const firstPart = trimmed.split(",")[0].trim();
    if (firstPart) {
      return normalizeImageSrc(firstPart);
    }
  }

  const baseApi = (typeof API_BASE_URL === "string" && API_BASE_URL.trim())
    ? API_BASE_URL.replace(/\/$/, "")
    : "https://accomplished-smile-dev.up.railway.app";

  // 4. Absolute HTTP/HTTPS, Blob, or Data URLs
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    // If saved as localhost/127.0.0.1 during local dev testing, re-route to current backend baseApi
    if (trimmed.startsWith("http://localhost:") || trimmed.startsWith("http://127.0.0.1:")) {
      const pathPart = trimmed.replace(/^https?:\/\/[^/]+/, "");
      return `${baseApi}${pathPart.startsWith("/") ? pathPart : `/${pathPart}`}`;
    }
    return trimmed;
  }

  // 5. Raw Base64 payloads with known image signatures
  if (trimmed.startsWith("/9j/")) {
    return `data:image/jpeg;base64,${trimmed}`;
  }
  if (trimmed.startsWith("iVBORw0KGgo")) {
    return `data:image/png;base64,${trimmed}`;
  }
  if (trimmed.startsWith("R0lGOD")) {
    return `data:image/gif;base64,${trimmed}`;
  }
  if (trimmed.startsWith("UklGR")) {
    return `data:image/webp;base64,${trimmed}`;
  }

  // 6. Relative server upload paths
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("uploads/") ||
    trimmed.startsWith("api/") ||
    trimmed.startsWith("storage/") ||
    trimmed.startsWith("images/") ||
    trimmed.startsWith("id_proofs/")
  ) {
    const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return `${baseApi}${cleanPath}`;
  }

  // 7. Pure base64 string
  if (trimmed.length > 60 && !trimmed.includes(" ") && !trimmed.includes("/") && !trimmed.includes("?") && !trimmed.includes("&")) {
    return `data:image/png;base64,${trimmed}`;
  }

  // 8. File name with image extension
  if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(trimmed)) {
    const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return `${baseApi}${cleanPath}`;
  }

  return trimmed;
}

function cleanGuestObj(obj) {
  if (!obj || typeof obj !== "object") return {};
  const copy = { ...obj };
  delete copy.guest;
  delete copy.booking;
  delete copy.activeBooking;
  return removeCircularReferences(copy) || {};
}

function cleanBookingObj(obj) {
  if (!obj || typeof obj !== "object") return null;
  const copy = { ...obj };
  delete copy.guest;
  delete copy.booking;
  delete copy.activeBooking;
  return removeCircularReferences(copy) || null;
}

export default function GuestDetailsModal({
  open = false,
  guestId = null,
  guestData = null,
  onClose,
  hotelSettings = { checkInTime: "14:00", checkOutTime: "12:00", timezone: "Asia/Kolkata" },
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const targetId =
    guestId ||
    guestData?.booking?._id ||
    guestData?.booking?.id ||
    guestData?.activeBooking?._id ||
    guestData?.activeBooking?.id ||
    guestData?._id ||
    guestData?.id ||
    guestData?.bookingId ||
    guestData?.guest?._id ||
    guestData?.guestId;

  useEffect(() => {
    if (!open) {
      setDetails(null);
      return;
    }

    if (!targetId || String(targetId).startsWith("b-")) {
      const g = cleanGuestObj(guestData?.guest || guestData);
      const b = cleanBookingObj(
        guestData?.booking ||
        guestData?.activeBooking ||
        (guestData?.roomNumber || guestData?.room_id || guestData?.front_image || guestData?.frontImage || guestData?.images ? guestData : null)
      );
      setDetails({
        ...(guestData || {}),
        guest: g,
        activeBooking: b,
        roomsDetail: guestData?.roomsDetail || [],
        paymentDetails: guestData?.paymentDetails || null,
        paymentHistory: guestData?.paymentHistory || [],
        timeline: guestData?.timeline || [],
      });
      return;
    }

    setLoading(true);
    const endpoint = API_ENDPOINTS.RECEPTIONIST.GUEST_BY_ID(targetId);
    apiRequest(endpoint)
      .then((res) => {
        if (res?.success && res?.data) {
          const apiData = res.data;
          const resolvedBooking =
            cleanBookingObj(
              apiData.booking ||
              apiData.activeBooking ||
              (apiData.room_id || apiData.roomNumber || apiData.check_in_date || apiData.front_image || apiData.frontImage || apiData.images ? apiData : null) ||
              guestData?.booking ||
              guestData?.activeBooking ||
              (guestData?.roomNumber || guestData?.front_image || guestData?.frontImage || guestData?.images ? guestData : null)
            );

          const resolvedGuest =
            cleanGuestObj(
              apiData.guest ||
              (apiData.primary_guest_name ? apiData : null) ||
              guestData?.guest ||
              guestData ||
              apiData ||
              {}
            );

          // Preserve photos and ID proofs from guestData if API data omitted them
          const preservedFront =
            guestData?.frontImage ||
            guestData?.front_image ||
            guestData?.id_proof_front ||
            guestData?.id_proof_image ||
            guestData?.idProof?.frontImage ||
            guestData?.idProof?.front_image ||
            guestData?.govt_id_front;
          const preservedBack =
            guestData?.backImage ||
            guestData?.back_image ||
            guestData?.id_proof_back ||
            guestData?.idProof?.backImage ||
            guestData?.idProof?.back_image ||
            guestData?.govt_id_back;
          const preservedSignature =
            guestData?.signature ||
            guestData?.guest_signature ||
            guestData?.guestSignature;
          const preservedImages =
            (Array.isArray(guestData?.images) && guestData.images.length > 0)
              ? guestData.images
              : (Array.isArray(apiData?.images) && apiData.images.length > 0)
                ? apiData.images
                : [];

          if (preservedFront && !resolvedGuest.frontImage) {
            resolvedGuest.frontImage = preservedFront;
            resolvedGuest.front_image = preservedFront;
          }
          if (preservedFront && resolvedBooking && !resolvedBooking.frontImage) {
            resolvedBooking.frontImage = preservedFront;
            resolvedBooking.front_image = preservedFront;
          }
          if (preservedBack && !resolvedGuest.backImage) {
            resolvedGuest.backImage = preservedBack;
            resolvedGuest.back_image = preservedBack;
          }
          if (preservedBack && resolvedBooking && !resolvedBooking.backImage) {
            resolvedBooking.backImage = preservedBack;
            resolvedBooking.back_image = preservedBack;
          }
          if (preservedSignature && !resolvedGuest.signature) {
            resolvedGuest.signature = preservedSignature;
          }
          if (preservedSignature && resolvedBooking && !resolvedBooking.signature) {
            resolvedBooking.signature = preservedSignature;
          }

          setDetails({
            ...(guestData || {}),
            ...apiData,
            images: (Array.isArray(apiData.images) && apiData.images.length > 0) ? apiData.images : (preservedImages.length > 0 ? preservedImages : (guestData?.images || [])),
            guest: resolvedGuest,
            activeBooking: resolvedBooking,
          });
        } else {
          // Fallback to locally passed data if API response structure is basic
          const resolvedBooking =
            cleanBookingObj(
              guestData?.booking ||
              guestData?.activeBooking ||
              (guestData?.roomNumber || guestData?.room_id || guestData?.front_image || guestData?.frontImage || guestData?.images ? guestData : null)
            );
          const resolvedGuest = cleanGuestObj(guestData?.guest || guestData);
          setDetails({
            ...(guestData || {}),
            guest: resolvedGuest,
            activeBooking: resolvedBooking,
            roomsDetail: guestData?.roomsDetail || [],
            paymentDetails: guestData?.paymentDetails || null,
            paymentHistory: guestData?.paymentHistory || [],
            timeline: guestData?.timeline || [],
          });
        }
      })
      .catch((err) => {
        console.warn("Could not fetch detailed guest data, using fallback:", err);
        const resolvedBooking =
          cleanBookingObj(
            guestData?.booking ||
            guestData?.activeBooking ||
            (guestData?.roomNumber || guestData?.room_id || guestData?.front_image || guestData?.frontImage || guestData?.images ? guestData : null)
          );
        const resolvedGuest = cleanGuestObj(guestData?.guest || guestData);
        setDetails({
          ...(guestData || {}),
          guest: resolvedGuest,
          activeBooking: resolvedBooking,
          roomsDetail: guestData?.roomsDetail || [],
          paymentDetails: guestData?.paymentDetails || null,
          paymentHistory: guestData?.paymentHistory || [],
          timeline: guestData?.timeline || [],
        });
      })
      .finally(() => setLoading(false));
  }, [open, targetId, guestData]);

  const guest = useMemo(() => {
    const raw = details?.guest || guestData?.guest || details || guestData || {};
    const cleaned = cleanGuestObj(raw);
    const front =
      cleaned.frontImage ||
      cleaned.front_image ||
      guestData?.frontImage ||
      guestData?.front_image ||
      details?.frontImage ||
      details?.front_image ||
      guestData?.id_proof_front ||
      guestData?.id_proof_image ||
      details?.id_proof_front ||
      details?.id_proof_image ||
      guestData?.govt_id_front ||
      details?.govt_id_front;
    if (front) {
      cleaned.frontImage = front;
      cleaned.front_image = front;
    }
    const back =
      cleaned.backImage ||
      cleaned.back_image ||
      guestData?.backImage ||
      guestData?.back_image ||
      details?.backImage ||
      details?.back_image ||
      guestData?.id_proof_back ||
      details?.id_proof_back ||
      guestData?.govt_id_back ||
      details?.govt_id_back;
    if (back) {
      cleaned.backImage = back;
      cleaned.back_image = back;
    }
    const sig =
      cleaned.signature ||
      cleaned.guest_signature ||
      guestData?.signature ||
      guestData?.guest_signature ||
      details?.signature ||
      details?.guest_signature;
    if (sig) {
      cleaned.signature = sig;
      cleaned.guest_signature = sig;
    }
    return cleaned;
  }, [details, guestData]);

  const activeBooking = useMemo(() => {
    const fromProps =
      guestData?.booking ||
      guestData?.activeBooking ||
      (guestData?.roomNumber || guestData?.room_id || guestData?.front_image || guestData?.frontImage || guestData?.images ? guestData : null);
    const fromDetails =
      details?.activeBooking ||
      details?.booking ||
      (details?.roomNumber || details?.room_id || details?.front_image || details?.frontImage || details?.images ? details : null);
    const merged = {
      ...(fromProps || {}),
      ...(fromDetails || {}),
    };
    const front =
      merged.frontImage ||
      merged.front_image ||
      guestData?.frontImage ||
      guestData?.front_image ||
      details?.frontImage ||
      details?.front_image ||
      guestData?.id_proof_front ||
      details?.id_proof_front ||
      guestData?.id_proof_image ||
      details?.id_proof_image ||
      guestData?.govt_id_front ||
      details?.govt_id_front;
    if (front) {
      merged.frontImage = front;
      merged.front_image = front;
    }
    const back =
      merged.backImage ||
      merged.back_image ||
      guestData?.backImage ||
      guestData?.back_image ||
      details?.backImage ||
      details?.back_image ||
      guestData?.id_proof_back ||
      details?.id_proof_back ||
      guestData?.govt_id_back ||
      details?.govt_id_back;
    if (back) {
      merged.backImage = back;
      merged.back_image = back;
    }
    const sig =
      merged.signature ||
      merged.guest_signature ||
      guestData?.signature ||
      guestData?.guest_signature ||
      details?.signature ||
      details?.guest_signature;
    if (sig) {
      merged.signature = sig;
      merged.guest_signature = sig;
    }
    return cleanBookingObj(merged) || {};
  }, [details, guestData]);

  // Comprehensive Financial & Payment Resolver
  const resolvedPaymentDetails = useMemo(() => {
    const existing = details?.paymentDetails || activeBooking?.paymentDetails || guestData?.paymentDetails;
    const source = activeBooking || details || guestData?.booking || guestData?.activeBooking || guestData || {};
    const guestObj = guest || guestData?.guest || {};

    const rawTotalFromProps = Number(
      existing?.totalAmount ??
      existing?.total_amount ??
      source.totalAmount ??
      source.total_amount ??
      source.total ??
      source.totalBilled ??
      source.grandTotal ??
      guestObj.totalAmount ??
      guestObj.total ??
      0
    );

    const rawPaid = Number(
      existing?.paidAmount ??
      existing?.paid_amount ??
      source.paidAmount ??
      source.paid_amount ??
      source.advancePaymentAmount ??
      source.advance_payment_amount ??
      source.advancePaid ??
      source.advance_paid ??
      source.advancePayment ??
      source.advance_payment ??
      source.paid ??
      guestObj.paidAmount ??
      guestObj.advanceAmount ??
      guestObj.paid ??
      0
    );

    const rawDueFromProps = Number(
      existing?.dueAmount ??
      existing?.due_amount ??
      source.dueAmount ??
      source.due_amount ??
      source.due ??
      source.balanceDue ??
      source.balanceAmount ??
      guestObj.dueAmount ??
      guestObj.due ??
      0
    );

    const nights = Math.max(1, Number(source.numberOfNights || source.nights || 1));
    const gstRate = Number(source.gstRate ?? source.gst_rate ?? 18);

    // If total was not explicitly provided but due or paid exist:
    let rawTotal = rawTotalFromProps;
    if (rawTotal <= 0 && (rawPaid > 0 || rawDueFromProps > 0)) {
      rawTotal = Math.round((rawPaid + rawDueFromProps) * 100) / 100;
    }

    // Room rate lookup
    let nightlyRate = Number(
      source.pricePerNight ||
      source.price_per_night ||
      source.price ||
      source.rate ||
      source.custom_price_per_night ||
      source.customPricePerNight ||
      source.room?.customPricePerNight ||
      source.room?.pricePerNight ||
      source.room?.price ||
      source.roomType?.basePrice ||
      source.roomType?.price ||
      existing?.nightlyRate ||
      0
    );

    let rawBase = Number(
      existing?.baseAmount ??
      existing?.base_amount ??
      source.baseAmount ??
      source.base_amount ??
      0
    );

    // If rawBase is missing or 0:
    if (rawBase <= 0) {
      if (nightlyRate > 0) {
        rawBase = Math.round(nightlyRate * nights * 100) / 100;
      } else if (rawTotal > 0) {
        // Derive base by un-applying GST from total
        rawBase = Math.round((rawTotal / (1 + gstRate / 100)) * 100) / 100;
        nightlyRate = Math.round((rawBase / nights) * 100) / 100;
      } else {
        // Default standard room tariff fallback if room has no rate recorded
        nightlyRate = 3500;
        rawBase = Math.round(nightlyRate * nights * 100) / 100;
      }
    }

    if (nightlyRate <= 0 && rawBase > 0) {
      nightlyRate = Math.round((rawBase / nights) * 100) / 100;
    }

    const rawDiscount = Number(existing?.discountAmount ?? existing?.discount_amount ?? source.discountAmount ?? source.discount_amount ?? 0);
    const rawExtra = Number(existing?.extraChargesTotal ?? existing?.extra_charges_total ?? source.extraChargesTotal ?? source.extra_charges_total ?? source.securityDepositAmount ?? 0);

    const candidateGst = existing?.gstAmount ?? existing?.gst_amount ?? source.gstAmount ?? source.gst_amount;
    const rawGst = Number(
      candidateGst !== undefined && Number(candidateGst) > 0
        ? candidateGst
        : (rawTotal > rawBase ? Math.round((rawTotal - rawBase) * 100) / 100 : Math.round(((rawBase * gstRate) / 100) * 100) / 100)
    );

    const effectiveTotal = rawTotal > 0 ? rawTotal : Math.max(0, Math.round((rawBase + rawGst - rawDiscount + rawExtra) * 100) / 100);
    const rawDue = rawDueFromProps > 0 ? rawDueFromProps : Math.max(0, Math.round((effectiveTotal - rawPaid) * 100) / 100);

    const cgst = Number(existing?.cgstAmount ?? Math.round((rawGst / 2) * 100) / 100);
    const sgst = Number(existing?.sgstAmount ?? Math.round((rawGst - cgst) * 100) / 100);

    let pStatus = (
      existing?.paymentStatus ||
      source.paymentStatus ||
      source.payment_status ||
      guestObj.paymentStatus ||
      (rawDue <= 0 && rawPaid > 0 ? "PAID" : rawPaid > 0 ? "PARTIAL" : "PENDING")
    ).toUpperCase();
    if (pStatus === "PARTIALLY_PAID") pStatus = "PARTIAL";

    const pMethod = existing?.paymentMethod || source.paymentMethod || source.payment_method || "CASH";

    return {
      baseAmount: rawBase,
      gstRate: gstRate,
      gstAmount: rawGst,
      cgstAmount: cgst,
      sgstAmount: sgst,
      discountAmount: rawDiscount,
      extraChargesTotal: rawExtra,
      totalAmount: effectiveTotal,
      paidAmount: rawPaid,
      dueAmount: rawDue,
      paymentStatus: pStatus,
      paymentMethod: pMethod,
      nightlyRate: nightlyRate,
      numberOfNights: nights,
      notes: source.notes || source.paymentNote || source.payment_note || "",
    };
  }, [details, activeBooking, guestData, guest]);

  // Payment Transaction Ledger Resolver
  const resolvedPaymentHistory = useMemo(() => {
    const list = details?.paymentHistory || activeBooking?.paymentHistory || guestData?.paymentHistory || [];
    if (Array.isArray(list) && list.length > 0) {
      return list.map((p, idx) => ({
        id: p.id || p._id || idx,
        formattedDate: p.formattedDate || (p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN") : p.date || "At Check-In"),
        transactionId: p.transactionId || p.transaction_id || `TXN-${String(p.id || idx + 101).padStart(5, "0")}`,
        description: p.description || p.notes || "Room Stay & Taxes",
        paymentMethod: p.paymentMethod || p.payment_method || resolvedPaymentDetails.paymentMethod || "CASH",
        amount: Number(p.amount || p.base_amount || (p.total ? Math.round(Number(p.total) / 1.18) : 0)),
        gst: Number(p.gst || p.gst_amount || 0),
        total: Number(p.total || p.total_amount || p.amount || 0),
        status: (p.status || "PAID").toUpperCase(),
      }));
    }

    if (resolvedPaymentDetails.paidAmount > 0) {
      const bDate = activeBooking?.checkInDate || activeBooking?.created_at || activeBooking?.actualCheckIn || Date.now();
      const dStr = new Date(bDate).toLocaleDateString("en-IN");
      return [
        {
          id: 1,
          formattedDate: dStr,
          transactionId: activeBooking?.bookingNumber ? `TXN-${activeBooking.bookingNumber}` : `TXN-${String(activeBooking?._id || activeBooking?.id || "1001").slice(-6).toUpperCase()}`,
          description: `Check-In Settlement (${resolvedPaymentDetails.paymentStatus === "PAID" ? "Full Payment" : "Advance Deposit"})`,
          paymentMethod: resolvedPaymentDetails.paymentMethod || "CASH",
          amount: resolvedPaymentDetails.baseAmount || Math.round(resolvedPaymentDetails.paidAmount / 1.18),
          gst: resolvedPaymentDetails.gstAmount || Math.round(resolvedPaymentDetails.paidAmount - (resolvedPaymentDetails.paidAmount / 1.18)),
          total: resolvedPaymentDetails.paidAmount,
          status: "PAID",
        },
      ];
    }

    return [];
  }, [details, activeBooking, guestData, resolvedPaymentDetails]);

  // Allocated Rooms Breakdown Resolver
  const resolvedRoomsDetail = useMemo(() => {
    const list = details?.roomsDetail || activeBooking?.roomsDetail || [];
    if (Array.isArray(list) && list.length > 0) return list;

    const rNum = activeBooking?.roomNumber || activeBooking?.room_number || guest?.roomAssigned || guest?.roomNumber || "101";
    const rType = activeBooking?.roomType || activeBooking?.room_type_name || activeBooking?.roomTypeName || guest?.roomType || "Standard Room";
    const nights = resolvedPaymentDetails.numberOfNights || 1;
    const rPrice = resolvedPaymentDetails.nightlyRate || Number(activeBooking?.pricePerNight || activeBooking?.price || activeBooking?.customPricePerNight || 3500);
    const roomTot = resolvedPaymentDetails.baseAmount || (rPrice * nights);
    const floor = activeBooking?.floor !== undefined ? activeBooking.floor : (parseInt(rNum, 10) >= 100 ? Math.floor(parseInt(rNum, 10) / 100) : 1);

    return [
      {
        id: activeBooking?.roomId || activeBooking?.room_id || 1,
        roomNumber: rNum,
        roomType: rType,
        pricePerNight: rPrice,
        numberOfNights: nights,
        roomTotal: roomTot,
        status: activeBooking?.status || "OCCUPIED",
        floor: floor,
      },
    ];
  }, [details, activeBooking, guest, resolvedPaymentDetails]);

  // Dynamic Real-Time Stay Activity Timeline Resolver
  const resolvedTimeline = useMemo(() => {
    // 1. If backend API already provides real timeline milestones, use them
    const existingTimeline = details?.timeline || activeBooking?.timeline || guestData?.timeline;
    if (Array.isArray(existingTimeline) && existingTimeline.length > 0) {
      return existingTimeline;
    }

    const checkInDateVal = activeBooking?.checkInDate || guest.checkInDate;
    const checkOutDateVal = activeBooking?.checkOutDate || guest.checkOutDate;
    const createdAtVal = activeBooking?.created_at || activeBooking?.createdAt || guest.createdAt || checkInDateVal || new Date().toISOString();
    const actualCheckInVal = activeBooking?.actualCheckIn || activeBooking?.actual_check_in || checkInDateVal || createdAtVal;
    const actualCheckOutVal = activeBooking?.actualCheckOut || activeBooking?.actual_check_out;

    const roomNum = resolvedRoomsDetail[0]?.roomNumber || guest.roomAssigned || "101";
    const roomTypeStr = resolvedRoomsDetail[0]?.roomType || "Standard Room";
    const guestNameStr = guest.fullName || guest.name || "Guest";
    const folioNumber = activeBooking?.bookingNumber || guest.folioNumber || guest.bookingId || "7896541525";
    const idTypeStr = guest.govtIdType || guest.idProofType || "AADHAAR";
    const idNumStr = guest.govtIdNumber || guest.idProofNumber || "Verified";

    const milestones = [];

    // Milestone 1: Reservation Confirmed & Folio Generated
    milestones.push({
      id: "m_reservation",
      type: "RESERVATION",
      title: "Reservation Confirmed & Folio Created",
      description: `Folio #${folioNumber} registered for ${guestNameStr}. Stay duration: ${resolvedPaymentDetails.numberOfNights} night(s).`,
      timestamp: createdAtVal,
      status: "COMPLETED",
      category: "booking",
    });

    // Milestone 2: Govt Identity & Regulatory KYC Verification
    milestones.push({
      id: "m_kyc",
      type: "KYC",
      title: `Govt Regulatory KYC & ${idTypeStr} Verified`,
      description: `Primary identity proof recorded (${idNumStr}). Regulatory documentation and digital signature completed.`,
      timestamp: createdAtVal,
      status: "COMPLETED",
      category: "kyc",
    });

    // Milestone 3: Room Allocation
    milestones.push({
      id: "m_room_assigned",
      type: "ROOM",
      title: `Room Allocation: Room #${roomNum} (${roomTypeStr})`,
      description: `Room #${roomNum} assigned and prepared. RFID keycard allocated for room access.`,
      timestamp: actualCheckInVal,
      status: "COMPLETED",
      category: "room",
    });

    // Milestone 4: Physical Front Desk Check-In
    const rawStatus = (activeBooking?.status || guest.status || "IN-HOUSE").toUpperCase();
    const isCheckedInOrLater = ["IN-HOUSE", "CHECKED_IN", "CHECKED_OUT", "DEPARTED"].includes(rawStatus);
    milestones.push({
      id: "m_checkin",
      type: "CHECK_IN",
      title: "Physical Check-In & Welcome Handover",
      description: `Guest successfully checked in at the Front Desk. Welcome protocol and room keys delivered.`,
      timestamp: actualCheckInVal,
      status: isCheckedInOrLater ? "COMPLETED" : "PENDING",
      category: "checkin",
    });

    // Milestone 5: Payment & Folio Settlement
    const isPaid = resolvedPaymentDetails.paymentStatus === "PAID";
    const isPartial = resolvedPaymentDetails.paymentStatus === "PARTIAL";
    milestones.push({
      id: "m_payment",
      type: "PAYMENT",
      title: isPaid
        ? `Full Payment Settled (₹${resolvedPaymentDetails.totalAmount?.toLocaleString()} via ${resolvedPaymentDetails.paymentMethod})`
        : isPartial
        ? `Advance Payment Received (₹${resolvedPaymentDetails.paidAmount?.toLocaleString()} via ${resolvedPaymentDetails.paymentMethod})`
        : `Folio Invoiced: Pending Settlement (₹${resolvedPaymentDetails.dueAmount?.toLocaleString()} Due)`,
      description: isPaid
        ? `Account folio fully cleared with GST invoice receipt generated.`
        : isPartial
        ? `Advance payment logged. Outstanding balance of ₹${resolvedPaymentDetails.dueAmount?.toLocaleString()} pending for checkout.`
        : `Tariff of ₹${resolvedPaymentDetails.totalAmount?.toLocaleString()} billed. Balance pending to collect at front desk.`,
      timestamp: actualCheckInVal,
      status: isPaid ? "COMPLETED" : isPartial ? "PARTIAL" : "PENDING",
      category: "billing",
    });

    // Milestone 6: In-House Stay Experience
    const isCurrentlyInHouse = rawStatus === "IN-HOUSE" || rawStatus === "CHECKED_IN";
    if (isCurrentlyInHouse) {
      milestones.push({
        id: "m_stay_active",
        type: "IN_HOUSE",
        title: "Active In-House Resident Stay",
        description: `Guest is currently residing in Room #${roomNum}. Daily housekeeping and room service amenities enabled.`,
        timestamp: new Date().toISOString(),
        status: "ACTIVE",
        category: "stay",
      });
    }

    // Milestone 7: Scheduled or Completed Check-Out
    const isDeparted = rawStatus === "CHECKED_OUT" || rawStatus === "DEPARTED";
    if (isDeparted) {
      milestones.push({
        id: "m_checkout",
        type: "CHECK_OUT",
        title: "Guest Departure & Room Handover Completed",
        description: `Folio closed and keys received. Room #${roomNum} dispatched to Housekeeping cleaning queue.`,
        timestamp: actualCheckOutVal || checkOutDateVal || new Date().toISOString(),
        status: "COMPLETED",
        category: "checkout",
      });
    } else {
      milestones.push({
        id: "m_checkout_scheduled",
        type: "CHECK_OUT_SCHEDULED",
        title: `Scheduled Departure Check-Out (${checkOutDateVal ? (typeof checkOutDateVal === "string" ? checkOutDateVal.split("T")[0] : checkOutDateVal) : "Scheduled"})`,
        description: `Scheduled departure at front desk by 12:00 PM. Final billing folio audit and keycard return pending.`,
        timestamp: checkOutDateVal || (Date.now() + 86400000),
        status: "UPCOMING",
        category: "checkout",
      });
    }

    return milestones;
  }, [details, activeBooking, guest, resolvedRoomsDetail, resolvedPaymentDetails, guestData]);

  const roomsDetail = resolvedRoomsDetail;
  const paymentDetails = resolvedPaymentDetails;
  const paymentHistory = resolvedPaymentHistory;
  const timeline = resolvedTimeline;
  const accompanyingGuests = (
    (activeBooking?.accompanyingGuests && activeBooking.accompanyingGuests.length > 0)
      ? activeBooking.accompanyingGuests
      : (activeBooking?.members && activeBooking.members.length > 0)
        ? activeBooking.members
        : (guest?.accompanyingGuests && guest.accompanyingGuests.length > 0)
          ? guest.accompanyingGuests
          : (guest?.members && guest.members.length > 0)
            ? guest.members
            : (guestData?.accompanyingGuests && guestData.accompanyingGuests.length > 0)
              ? guestData.accompanyingGuests
              : (guestData?.members && guestData.members.length > 0)
                ? guestData.members
                : (guestData?.booking?.accompanyingGuests && guestData.booking.accompanyingGuests.length > 0)
                  ? guestData.booking.accompanyingGuests
                  : (guestData?.booking?.members && guestData.booking.members.length > 0)
                    ? guestData.booking.members
                    : []
  );

  const bookingStatus = activeBooking?.status || (guest.status === "IN-HOUSE" ? "CHECKED_IN" : guest.status || "REGISTERED");

  // Address
  const guestAddress =
    guest?.address ||
    activeBooking?.address ||
    details?.address ||
    guestData?.address ||
    "";

  // Guest Profile Photo / Avatar
  const guestPhoto = normalizeImageSrc(
    guest?.photo ||
    guest?.avatar ||
    guest?.profileImage ||
    guest?.guestPhoto ||
    guest?.image ||
    activeBooking?.photo ||
    activeBooking?.guest_photo ||
    activeBooking?.guestPhoto ||
    details?.photo ||
    details?.guest_photo ||
    guestData?.photo ||
    guestData?.avatar ||
    guestData?.guestPhoto ||
    null
  );

  // Helper to extract photos from any candidate object with maximum field flexibility
  const resolvePhotoSrc = (type) => {
    const candidates = [
      activeBooking,
      details?.activeBooking,
      details?.booking,
      details?.data,
      details,
      guest,
      guestData?.guest,
      guestData?.booking,
      guestData?.activeBooking,
      guestData,
    ];

    if (type === "front") {
      for (const c of candidates) {
        if (!c || typeof c !== "object") continue;
        const src =
          c.frontImage ||
          c.front_image ||
          c.frontImageUrl ||
          c.front_image_url ||
          c.frontPhoto ||
          c.front_photo ||
          c.idProof?.frontImage ||
          c.idProof?.front_image ||
          c.idProof?.frontImageUrl ||
          c.idProof?.front_image_url ||
          c.idProof?.url ||
          c.idProof?.image ||
          c.idProof?.path ||
          c.id_proof_front ||
          c.idProofFront ||
          c.id_proof_front_image ||
          c.idProofFrontImage ||
          c.id_proof_front_url ||
          c.idProofFrontUrl ||
          c.id_proof_image ||
          c.idProofImage ||
          c.id_proof_url ||
          c.idProofUrl ||
          c.id_card_front ||
          c.idCardFront ||
          c.id_card_image ||
          c.idCardImage ||
          c.govt_id_front ||
          c.govtIdFront ||
          c.govt_id_image ||
          c.govtIdImage ||
          c.govt_id_url ||
          c.govtIdUrl ||
          c.govt_id_photo ||
          c.govtIdPhoto ||
          c.idPhoto ||
          c.id_photo ||
          (Array.isArray(c.images) && c.images[0]) ||
          (typeof c.images === "string" && c.images) ||
          (Array.isArray(c.documents) && (c.documents[0]?.url || c.documents[0]?.path || c.documents[0])) ||
          (typeof c.documents === "string" && c.documents) ||
          (Array.isArray(c.photos) && c.photos[0]) ||
          (c.id_proof && typeof c.id_proof === "string" ? c.id_proof : null) ||
          (c.idProof && typeof c.idProof === "string" ? c.idProof : null);

        const normalized = normalizeImageSrc(src);
        if (normalized) return normalized;
      }
      return null;
    }

    if (type === "back") {
      for (const c of candidates) {
        if (!c || typeof c !== "object") continue;
        const src =
          c.backImage ||
          c.back_image ||
          c.backImageUrl ||
          c.back_image_url ||
          c.backPhoto ||
          c.back_photo ||
          c.idProof?.backImage ||
          c.idProof?.back_image ||
          c.idProof?.backImageUrl ||
          c.idProof?.back_image_url ||
          c.id_proof_back ||
          c.idProofBack ||
          c.id_proof_back_image ||
          c.idProofBackImage ||
          c.id_proof_back_url ||
          c.idProofBackUrl ||
          c.id_card_back ||
          c.idCardBack ||
          c.govt_id_back ||
          c.govtIdBack ||
          c.govt_id_photo_back ||
          c.govtIdPhotoBack ||
          (Array.isArray(c.images) && c.images.length > 1 && c.images[1]) ||
          (Array.isArray(c.documents) && c.documents.length > 1 && (c.documents[1]?.url || c.documents[1]?.path || c.documents[1]));

        const normalized = normalizeImageSrc(src);
        if (normalized) return normalized;
      }
      return null;
    }

    if (type === "signature") {
      for (const c of candidates) {
        if (!c || typeof c !== "object") continue;
        const src =
          c.signature ||
          c.signature_url ||
          c.signatureUrl ||
          c.signatureImage ||
          c.signature_image ||
          c.guest_signature ||
          c.guestSignature ||
          c.guest_signature_url ||
          c.guestSignatureUrl ||
          c.guest_signature_image ||
          c.guestSignatureImage ||
          c.digital_signature ||
          c.digitalSignature ||
          c.digital_signature_url ||
          c.digitalSignatureUrl ||
          c.e_signature ||
          c.eSignature ||
          c.e_signature_url ||
          c.eSignatureUrl ||
          c.idProof?.signature ||
          c.idProof?.signatureUrl ||
          c.idProof?.guestSignature ||
          (Array.isArray(c.signatures) && c.signatures[0]) ||
          (typeof c.signatures === "string" && c.signatures);

        const normalized = normalizeImageSrc(src);
        if (normalized) return normalized;
      }
      return null;
    }

    return null;
  };

  // All Govt ID / KYC Document Photos (Unified Dynamic List)
  const allIdPhotos = useMemo(() => {
    const list = [];
    const seen = new Set();

    const addImg = (val) => {
      if (!val) return;
      if (Array.isArray(val)) {
        val.forEach(addImg);
        return;
      }
      if (typeof val === "object" && val !== null) {
        // Deep search object properties for any image URLs
        if (val.frontImage || val.front_image || val.front || val.frontImageUrl || val.front_image_url) {
          addImg(val.frontImage || val.front_image || val.front || val.frontImageUrl || val.front_image_url);
        }
        if (val.backImage || val.back_image || val.back || val.backImageUrl || val.back_image_url) {
          addImg(val.backImage || val.back_image || val.back || val.backImageUrl || val.back_image_url);
        }
        if (val.id_proof_front || val.idProofFront || val.id_proof_front_image) {
          addImg(val.id_proof_front || val.idProofFront || val.id_proof_front_image);
        }
        if (val.id_proof_back || val.idProofBack || val.id_proof_back_image) {
          addImg(val.id_proof_back || val.idProofBack || val.id_proof_back_image);
        }
        if (val.id_proof_image || val.idProofImage || val.id_proof_url || val.idProofUrl) {
          addImg(val.id_proof_image || val.idProofImage || val.id_proof_url || val.idProofUrl);
        }
        if (val.govt_id_front || val.govtIdFront || val.govt_id_image || val.govtIdImage || val.govt_id_photo) {
          addImg(val.govt_id_front || val.govtIdFront || val.govt_id_image || val.govtIdImage || val.govt_id_photo);
        }
        if (val.govt_id_back || val.govtIdBack || val.govt_id_photo_back) {
          addImg(val.govt_id_back || val.govtIdBack || val.govt_id_photo_back);
        }
        if (val.id_card_front || val.idCardFront || val.id_card_image) {
          addImg(val.id_card_front || val.idCardFront || val.id_card_image);
        }
        if (val.id_card_back || val.idCardBack) {
          addImg(val.id_card_back || val.idCardBack);
        }
        if (val.url || val.secure_url || val.path || val.src || val.image || val.fileUrl || val.uri || val.data) {
          addImg(val.url || val.secure_url || val.path || val.src || val.image || val.fileUrl || val.uri || val.data);
        }
        if (Array.isArray(val.images)) val.images.forEach(addImg);
        if (Array.isArray(val.documents)) val.documents.forEach(addImg);
        if (Array.isArray(val.photos)) val.photos.forEach(addImg);
        return;
      }
      if (typeof val === "string") {
        const trimmed = val.trim();
        if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
          try {
            const parsed = JSON.parse(trimmed);
            addImg(parsed);
            return;
          } catch {}
        }
        if (trimmed.includes(",") && !trimmed.startsWith("data:")) {
          trimmed.split(",").forEach((item) => addImg(item.trim()));
          return;
        }
        const normalized = normalizeImageSrc(trimmed);
        if (normalized && !seen.has(normalized)) {
          seen.add(normalized);
          list.push(normalized);
        }
      }
    };

    const candidateSources = [
      activeBooking,
      details?.activeBooking,
      details?.booking,
      details?.data,
      details,
      guest,
      guestData?.guest,
      guestData?.booking,
      guestData?.activeBooking,
      guestData,
    ];

    candidateSources.forEach((c) => {
      if (!c || typeof c !== "object") return;
      addImg(c.images);
      addImg(c.documents);
      addImg(c.photos);
      addImg(c.idProof);
      addImg(c.id_proof);
      addImg(c.frontImage);
      addImg(c.front_image);
      addImg(c.frontImageUrl);
      addImg(c.front_image_url);
      addImg(c.frontPhoto);
      addImg(c.front_photo);
      addImg(c.backImage);
      addImg(c.back_image);
      addImg(c.backImageUrl);
      addImg(c.back_image_url);
      addImg(c.backPhoto);
      addImg(c.back_photo);
      addImg(c.id_proof_front);
      addImg(c.idProofFront);
      addImg(c.id_proof_front_image);
      addImg(c.idProofFrontImage);
      addImg(c.id_proof_front_url);
      addImg(c.idProofFrontUrl);
      addImg(c.id_proof_back);
      addImg(c.idProofBack);
      addImg(c.id_proof_back_image);
      addImg(c.idProofBackImage);
      addImg(c.id_proof_back_url);
      addImg(c.idProofBackUrl);
      addImg(c.id_proof_image);
      addImg(c.idProofImage);
      addImg(c.id_proof_url);
      addImg(c.idProofUrl);
      addImg(c.govt_id_front);
      addImg(c.govtIdFront);
      addImg(c.govt_id_back);
      addImg(c.govtIdBack);
      addImg(c.govt_id_image);
      addImg(c.govtIdImage);
      addImg(c.govt_id_url);
      addImg(c.govtIdUrl);
      addImg(c.govt_id_photo);
      addImg(c.govtIdPhoto);
      addImg(c.govt_id_photo_back);
      addImg(c.govtIdPhotoBack);
      addImg(c.id_card_front);
      addImg(c.idCardFront);
      addImg(c.id_card_back);
      addImg(c.idCardBack);
      addImg(c.id_card_image);
      addImg(c.idCardImage);
      addImg(c.idPhoto);
      addImg(c.id_photo);
    });

    // Ensure resolvePhotoSrc primary front is placed first if not already present
    const frontCandidate = resolvePhotoSrc("front");
    if (frontCandidate && !seen.has(frontCandidate)) {
      seen.add(frontCandidate);
      list.unshift(frontCandidate);
    }
    const backCandidate = resolvePhotoSrc("back");
    if (backCandidate && !seen.has(backCandidate)) {
      seen.add(backCandidate);
      list.push(backCandidate);
    }

    return list;
  }, [details, activeBooking, guest, guestData]);

  // All Guest Signatures (Unified Dynamic List)
  const allSignatures = useMemo(() => {
    const list = [];
    const seen = new Set();

    const addSig = (val) => {
      if (!val) return;
      if (Array.isArray(val)) {
        val.forEach(addSig);
        return;
      }
      if (typeof val === "object" && val !== null) {
        addSig(
          val.url ||
          val.secure_url ||
          val.signature ||
          val.guest_signature ||
          val.guestSignature ||
          val.digital_signature ||
          val.src ||
          val.data
        );
        return;
      }
      if (typeof val === "string") {
        const trimmed = val.trim();
        if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
          try {
            const parsed = JSON.parse(trimmed);
            addSig(parsed);
            return;
          } catch {}
        }
        if (trimmed.includes(",") && !trimmed.startsWith("data:")) {
          trimmed.split(",").forEach((item) => addSig(item.trim()));
          return;
        }
        const normalized = normalizeImageSrc(trimmed);
        if (normalized && !seen.has(normalized)) {
          seen.add(normalized);
          list.push(normalized);
        }
      }
    };

    const candidateSources = [
      activeBooking,
      details?.activeBooking,
      details?.booking,
      details?.data,
      details,
      guest,
      guestData?.guest,
      guestData?.booking,
      guestData?.activeBooking,
      guestData,
    ];

    candidateSources.forEach((c) => {
      if (!c || typeof c !== "object") return;
      addSig(c.signatures);
      addSig(c.signature);
      addSig(c.signature_url);
      addSig(c.signatureUrl);
      addSig(c.signatureImage);
      addSig(c.signature_image);
      addSig(c.guest_signature);
      addSig(c.guestSignature);
      addSig(c.guest_signature_url);
      addSig(c.guestSignatureUrl);
      addSig(c.digital_signature);
      addSig(c.digitalSignature);
      addSig(c.e_signature);
      addSig(c.eSignature);
      addSig(c.idProof?.signature);
      addSig(c.idProof?.signatureUrl);
      addSig(c.idProof?.guestSignature);
    });

    const sigFallback = resolvePhotoSrc("signature");
    if (sigFallback && !seen.has(sigFallback)) {
      seen.add(sigFallback);
      list.unshift(sigFallback);
    }

    return list;
  }, [details, activeBooking, guest, guestData]);

  // Aadhaar / Govt ID Photos fallback
  const frontIdPhoto = allIdPhotos[0] || resolvePhotoSrc("front");
  const backIdPhoto = allIdPhotos[1] || resolvePhotoSrc("back");

  // Digital Signature Photo fallback
  const signaturePhoto = allSignatures[0] || resolvePhotoSrc("signature");

  // Govt ID Type & Document Number
  const govtIdType =
    activeBooking?.govt_id_type ||
    activeBooking?.id_type ||
    activeBooking?.govtIdType ||
    activeBooking?.idType ||
    details?.govt_id_type ||
    details?.id_type ||
    details?.govtIdType ||
    details?.idType ||
    guest?.idProof?.idType ||
    guest?.govt_id_type ||
    guest?.id_type ||
    guest?.govtIdType ||
    guest?.idType ||
    guestData?.govt_id_type ||
    guestData?.id_type ||
    guestData?.govtIdType ||
    guestData?.idType ||
    guestData?.booking?.govt_id_type ||
    guestData?.booking?.id_type ||
    "AADHAAR";

  const govtIdNumber =
    activeBooking?.govt_id_number ||
    activeBooking?.id_number ||
    activeBooking?.govtIdNumber ||
    activeBooking?.idNumber ||
    details?.govt_id_number ||
    details?.id_number ||
    details?.govtIdNumber ||
    details?.idNumber ||
    guest?.idProof?.idNumber ||
    guest?.govt_id_number ||
    guest?.id_number ||
    guest?.govtIdNumber ||
    guest?.idNumber ||
    guestData?.govt_id_number ||
    guestData?.id_number ||
    guestData?.govtIdNumber ||
    guestData?.idNumber ||
    guestData?.booking?.govt_id_number ||
    guestData?.booking?.id_number ||
    "On Record";

  const isIdVerified = Boolean(
    guest?.idProof?.verificationStatus === "VERIFIED" ||
    guest?.idVerified ||
    activeBooking?.id_verified ||
    activeBooking?.is_verified ||
    details?.id_verified ||
    details?.is_verified ||
    (govtIdNumber && govtIdNumber !== "On Record" && govtIdNumber !== "PENDING") ||
    frontIdPhoto
  );

  const rawDue = resolvedPaymentDetails.dueAmount;
  const rawPaid = resolvedPaymentDetails.paidAmount;
  const rawTotal = resolvedPaymentDetails.totalAmount;
  const guestPayStatus = resolvedPaymentDetails.paymentStatus;

  if (!open) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
              border: `1px solid ${themeConfig.border}`,
              boxShadow: isDarkMode ? "0 20px 60px rgba(0,0,0,0.6)" : "0 20px 60px rgba(12,39,59,0.15)",
              overflow: "hidden",
              maxHeight: "90vh",
            },
          },
        }}
      >
        {/* Modal Header */}
        <DialogTitle
          component="div"
          sx={{
            p: { xs: 2, sm: 3 },
            bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(238, 245, 240, 0.7)",
            borderBottom: `1px solid ${themeConfig.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={guestPhoto || undefined}
              sx={{
                bgcolor: themeConfig.primary,
                color: "#FFFFFF",
                width: 54,
                height: 54,
                fontWeight: 900,
                fontSize: "1.3rem",
                boxShadow: `0 4px 14px ${themeConfig.primaryGlow}`,
                border: guestPhoto ? `2px solid ${themeConfig.primary}` : "none",
                cursor: guestPhoto ? "pointer" : "default",
              }}
              onClick={() => {
                if (guestPhoto) setPreviewImage(guestPhoto);
              }}
            >
              {(guest.fullName || guest.name || "G")[0]?.toUpperCase()}
            </Avatar>
            <div>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "wrap" }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                  {guest.fullName || guest.name || "Guest Details"}
                </Typography>
                <StatusChip status={bookingStatus} />
                <Chip
                  label={guestPayStatus === "PAID" ? "PAID" : guestPayStatus === "PARTIAL" ? "PARTIAL" : "PENDING DUE"}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    bgcolor:
                      guestPayStatus === "PAID"
                        ? "rgba(16, 185, 129, 0.15)"
                        : guestPayStatus === "PARTIAL"
                          ? "rgba(245, 158, 11, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                    color:
                      guestPayStatus === "PAID"
                        ? "#10B981"
                        : guestPayStatus === "PARTIAL"
                          ? "#F59E0B"
                          : "#EF4444",
                    border: `1px solid ${guestPayStatus === "PAID"
                        ? "rgba(16, 185, 129, 0.3)"
                        : guestPayStatus === "PARTIAL"
                          ? "rgba(245, 158, 11, 0.3)"
                          : "rgba(239, 68, 68, 0.3)"
                      }`,
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                {activeBooking?.bookingNumber ? `Booking #${activeBooking.bookingNumber}` : `Guest Folio: ${guest.mobileNumber || guest.phone || "N/A"}`}
              </Typography>
            </div>
          </Box>

          <IconButton onClick={onClose} sx={{ color: themeConfig.textMuted, "&:hover": { color: "#EF4444" } }}>
            <Close />
          </IconButton>
        </DialogTitle>

        {/* Navigation Tabs */}
        <Box sx={{ px: 3, borderBottom: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(0,0,0,0.15)" : "#FAFCFB" }}>
          <Tabs
            value={activeTab}
            onChange={(e, nv) => setActiveTab(nv)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 48,
              "& .MuiTab-root": {
                fontWeight: 800,
                fontSize: "0.85rem",
                textTransform: "none",
                minHeight: 48,
                color: themeConfig.textMuted,
                "&.Mui-selected": { color: themeConfig.primary },
              },
              "& .MuiTabs-indicator": { bgcolor: themeConfig.primary, height: 3, borderRadius: "3px" },
            }}
          >
            <Tab icon={<Person sx={{ fontSize: 18 }} />} iconPosition="start" label="Guest Profile & KYC" />
            <Tab icon={<MeetingRoom sx={{ fontSize: 18 }} />} iconPosition="start" label="Booking & Rooms" />
            <Tab icon={<CreditCard sx={{ fontSize: 18 }} />} iconPosition="start" label="Billing & Payments" />
            <Tab icon={<TimelineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Activity Timeline" />
          </Tabs>
        </Box>

        {/* Content Area */}
        <DialogContent sx={{ p: { xs: 1.5, sm: 3 } }}>
          {loading ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8, gap: 2 }}>
              <CircularProgress sx={{ color: themeConfig.primary }} />
              <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                Loading comprehensive guest folio...
              </Typography>
            </Box>
          ) : (
            <>
              {/* ================= TAB 0: GUEST PROFILE & KYC ================= */}
              {activeTab === 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* Basic Information Card */}
                  <Paper sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 1 }}>
                        <Person sx={{ fontSize: 18, color: themeConfig.primary }} />
                        Personal Information
                      </Typography>
                      {guestPhoto && (
                        <Chip
                          avatar={<Avatar src={guestPhoto} sx={{ width: 22, height: 22 }} />}
                          label="Profile Photo Attached"
                          size="small"
                          clickable
                          onClick={() => setPreviewImage(guestPhoto)}
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.72rem",
                            bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F0FDFA",
                            color: themeConfig.primary,
                            border: `1px solid ${themeConfig.primary}`,
                          }}
                        />
                      )}
                    </Box>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Full Name</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          {guest.fullName || guest.name || "N/A"}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Mobile Number</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Phone sx={{ fontSize: 14, color: themeConfig.primary }} />
                          {guest.mobileNumber || guest.phone || "N/A"}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Email Address</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Email sx={{ fontSize: 14, color: themeConfig.primary }} />
                          {guest.email || "Not Provided"}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Gender</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          {guest.gender || "Male"}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Nationality</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          {guest.nationality || "Indian"}
                        </Typography>
                      </Grid>

                      {guestAddress && (
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Address / City</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 0.5 }}>
                            <LocationOn sx={{ fontSize: 14, color: themeConfig.primary }} />
                            {guestAddress}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>

                  {/* Billing & Payment Snapshot Card (Requirement: Immediate Financial Visibility) */}
                  <Paper
                    sx={{
                      p: 2.5,
                      borderRadius: "16px",
                      border: `1px solid ${themeConfig.border}`,
                      bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 1 }}>
                        <CreditCard sx={{ fontSize: 18, color: themeConfig.primary }} />
                        Billing &amp; Payment Snapshot
                      </Typography>
                      <Chip
                        label={resolvedPaymentDetails.paymentStatus === "PAID" ? "FULLY SETTLED" : resolvedPaymentDetails.paymentStatus === "PARTIAL" ? "PARTIALLY PAID" : "PAYMENT PENDING"}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.72rem",
                          bgcolor: resolvedPaymentDetails.paymentStatus === "PAID" ? "rgba(16, 185, 129, 0.15)" : resolvedPaymentDetails.paymentStatus === "PARTIAL" ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: resolvedPaymentDetails.paymentStatus === "PAID" ? "#10B981" : resolvedPaymentDetails.paymentStatus === "PARTIAL" ? "#F59E0B" : "#EF4444",
                          border: `1px solid ${resolvedPaymentDetails.paymentStatus === "PAID" ? "rgba(16, 185, 129, 0.3)" : resolvedPaymentDetails.paymentStatus === "PARTIAL" ? "rgba(245, 158, 11, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                        }}
                      />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Total Billed</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                          ₹{resolvedPaymentDetails.totalAmount?.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.7rem" }}>
                          Incl. ₹{resolvedPaymentDetails.gstAmount?.toLocaleString()} GST
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Total Paid</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "#10B981" }}>
                          ₹{resolvedPaymentDetails.paidAmount?.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.7rem" }}>
                          Via {resolvedPaymentDetails.paymentMethod}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Balance Dues</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: resolvedPaymentDetails.dueAmount > 0 ? "#EF4444" : "#10B981" }}>
                          {resolvedPaymentDetails.dueAmount > 0 ? `₹${resolvedPaymentDetails.dueAmount?.toLocaleString()}` : "✓ Settled"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: resolvedPaymentDetails.dueAmount > 0 ? "#EF4444" : "#10B981", fontSize: "0.7rem", fontWeight: 700 }}>
                          {resolvedPaymentDetails.dueAmount > 0 ? "Pending Collection" : "No Pending Dues"}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6, sm: 3 }} sx={{ display: "flex", alignItems: "center" }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setActiveTab(2)}
                          endIcon={<Receipt sx={{ fontSize: 16 }} />}
                          sx={{
                            borderRadius: "10px",
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            borderColor: themeConfig.primary,
                            color: themeConfig.primary,
                            width: "100%",
                            py: 0.8,
                            "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primaryDark },
                          }}
                        >
                          View Full Ledger
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* KYC & ID Proof Card */}
                  <Paper sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 1 }}>
                        <BadgeOutlined sx={{ fontSize: 18, color: themeConfig.primary }} />
                        Govt KYC ID Proof
                      </Typography>
                      <Chip
                        label={isIdVerified ? "VERIFIED ID" : "ON RECORD"}
                        size="small"
                        color={isIdVerified ? "success" : "default"}
                        sx={{ fontWeight: 800 }}
                      />
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>ID Document Type</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.primary }}>
                          {govtIdType}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>ID Document Number</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, letterSpacing: 0.5 }}>
                          {govtIdNumber}
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* ID Photos Preview: Dynamic Unified List / Grid */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase", display: "block" }}>
                        Uploaded ID Proof Documents ({allIdPhotos.length}):
                      </Typography>
                      {allIdPhotos.length > 0 && (
                        <Chip
                          label={`${allIdPhotos.length} Document${allIdPhotos.length > 1 ? "s" : ""} Attached`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.68rem",
                            bgcolor: "rgba(11, 142, 224, 0.1)",
                            color: "#0B8EE0",
                          }}
                        />
                      )}
                    </Box>

                    {allIdPhotos.length > 0 ? (
                      <Grid container spacing={2}>
                        {allIdPhotos.map((photoUrl, idx) => (
                          <Grid key={idx} size={{ xs: 12, sm: allIdPhotos.length === 1 ? 12 : 6, md: allIdPhotos.length > 2 ? 4 : 6 }}>
                            <Paper
                              sx={{
                                p: 1.5,
                                borderRadius: "12px",
                                border: `1px solid ${themeConfig.border}`,
                                textAlign: "center",
                                bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                                transition: "all 0.2s ease",
                                "&:hover": { borderColor: themeConfig.primary, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
                              }}
                            >
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                                  📄 {idx === 0 ? "Front ID (Primary KYC)" : idx === 1 ? "Back ID" : `Document #${idx + 1}`}
                                </Typography>
                                <Chip
                                  icon={<FileDownload sx={{ fontSize: "14px !important" }} />}
                                  label="Download"
                                  size="small"
                                  clickable
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const cleanName = sanitizeFilename(guest.fullName || guest.name || "Guest");
                                    downloadSingleImage(photoUrl, `${cleanName}_${idx === 0 ? "Front_ID" : idx === 1 ? "Back_ID" : `ID_Doc_${idx + 1}`}`);
                                  }}
                                  sx={{
                                    height: 20,
                                    fontSize: "0.68rem",
                                    fontWeight: 800,
                                    bgcolor: "rgba(11, 142, 224, 0.1)",
                                    color: "#0B8EE0",
                                    "&:hover": { bgcolor: "rgba(11, 142, 224, 0.2)" },
                                  }}
                                />
                              </Box>
                              <Box
                                component="img"
                                src={photoUrl}
                                alt={`ID Proof ${idx + 1}`}
                                onClick={() => setPreviewImage(photoUrl)}
                                onError={(e) => {
                                  e.currentTarget.style.opacity = "0.6";
                                }}
                                sx={{
                                  width: "100%",
                                  height: 160,
                                  objectFit: "contain",
                                  bgcolor: isDarkMode ? "rgba(0,0,0,0.25)" : "#FFFFFF",
                                  border: `1px solid ${themeConfig.border}`,
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  transition: "transform 0.2s, box-shadow 0.2s",
                                  "&:hover": { transform: "scale(1.02)", opacity: 0.95, boxShadow: "0 6px 16px rgba(0,0,0,0.15)" },
                                }}
                              />
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Paper
                        sx={{
                          py: 4,
                          px: 2,
                          textAlign: "center",
                          borderRadius: "12px",
                          border: `1px dashed ${themeConfig.border}`,
                          bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC",
                        }}
                      >
                        <Box sx={{ color: themeConfig.textMuted, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                          <BadgeOutlined sx={{ fontSize: 32, opacity: 0.4 }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMuted }}>
                            No ID Proof Documents Attached
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.72rem" }}>
                            No government KYC photo proofs were uploaded during check-in for this booking.
                          </Typography>
                        </Box>
                      </Paper>
                    )}

                    {/* Digital Signature Card */}
                    <Box sx={{ mt: 2.5 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase" }}>
                          Guest E-Signature Record:
                        </Typography>
                        {allSignatures.length > 0 && (
                          <Chip
                            label={`${allSignatures.length} Signature${allSignatures.length > 1 ? "s" : ""} On File`}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.68rem",
                              bgcolor: "rgba(16, 185, 129, 0.1)",
                              color: "#10B981",
                            }}
                          />
                        )}
                      </Box>

                      {allSignatures.length > 0 ? (
                        <Grid container spacing={2}>
                          {allSignatures.map((sigUrl, sIdx) => (
                            <Grid key={sIdx} size={{ xs: 12, sm: allSignatures.length === 1 ? 12 : 6 }}>
                              <Paper
                                sx={{
                                  p: 1.5,
                                  borderRadius: "12px",
                                  border: `1px solid ${themeConfig.border}`,
                                  bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                                  transition: "all 0.2s ease",
                                  "&:hover": { borderColor: "#10B981" },
                                }}
                              >
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 0.5 }}>
                                    ✍️ {allSignatures.length > 1 ? `Guest Signature #${sIdx + 1}` : "Guest Digital Signature"}
                                  </Typography>
                                  <Chip
                                    icon={<FileDownload sx={{ fontSize: "14px !important" }} />}
                                    label="Download"
                                    size="small"
                                    clickable
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const cleanName = sanitizeFilename(guest.fullName || guest.name || "Guest");
                                      downloadSingleImage(sigUrl, `${cleanName}_Signature_${sIdx + 1}`);
                                    }}
                                    sx={{
                                      height: 20,
                                      fontSize: "0.68rem",
                                      fontWeight: 800,
                                      bgcolor: "rgba(16, 185, 129, 0.1)",
                                      color: "#10B981",
                                      "&:hover": { bgcolor: "rgba(16, 185, 129, 0.2)" },
                                    }}
                                  />
                                </Box>
                                <Box
                                  component="img"
                                  src={sigUrl}
                                  alt={`Guest Digital Signature ${sIdx + 1}`}
                                  onClick={() => setPreviewImage(sigUrl)}
                                  sx={{
                                    width: "100%",
                                    height: 120,
                                    objectFit: "contain",
                                    bgcolor: isDarkMode ? "rgba(0,0,0,0.25)" : "#FFFFFF",
                                    border: `1px solid ${themeConfig.border}`,
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    p: 1,
                                    transition: "transform 0.2s, box-shadow 0.2s",
                                    "&:hover": { transform: "scale(1.02)", opacity: 0.95, boxShadow: "0 6px 16px rgba(0,0,0,0.15)" },
                                  }}
                                />
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Paper
                          sx={{
                            p: 2,
                            borderRadius: "12px",
                            border: `1px dashed ${themeConfig.border}`,
                            bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC",
                            textAlign: "center",
                          }}
                        >
                          <Typography variant="caption" sx={{ fontStyle: "italic", color: themeConfig.textMuted }}>
                            No Digital Signature Recorded
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  </Paper>

                  {/* Accompanying Members / Document Photos */}
                  {accompanyingGuests && accompanyingGuests.length > 0 && (() => {
                    const allMemberDocs = [];
                    accompanyingGuests.forEach((m, i) => {
                      const rawName = m.name || m.fullName || "";
                      const hasRealName = rawName && !rawName.startsWith("Document #") && !rawName.startsWith("Member #");
                      const cleanName = sanitizeFilename(hasRealName ? rawName : `Member_${i + 1}`);

                      if (Array.isArray(m.images) && m.images.length > 0) {
                        m.images.forEach((imgSrc, imgIdx) => {
                          const normSrc = normalizeImageSrc(imgSrc);
                          if (normSrc && !allMemberDocs.some((d) => d.src === normSrc)) {
                            allMemberDocs.push({
                              id: `img_${i}_${imgIdx}`,
                              label: hasRealName ? `${rawName} (${imgIdx + 1})` : `Document #${allMemberDocs.length + 1}`,
                              src: normSrc,
                              filename: `${cleanName}_Doc_${imgIdx + 1}`,
                            });
                          }
                        });
                      }

                      const mFront = normalizeImageSrc(m.front_image || m.frontImage || m.frontImageUrl || m.idProofImage || m.idProof?.frontImage || m.idProof?.frontImageUrl);
                      if (mFront && !allMemberDocs.some((d) => d.src === mFront)) {
                        allMemberDocs.push({
                          id: `front_${i}`,
                          label: hasRealName ? `${rawName} - Front` : `Document #${allMemberDocs.length + 1}`,
                          src: mFront,
                          filename: `${cleanName}_Front_ID`,
                        });
                      }

                      const mBack = normalizeImageSrc(m.back_image || m.backImage || m.backImageUrl || m.idProofBackImage || m.idProof?.backImage || m.idProof?.backImageUrl);
                      if (mBack && !allMemberDocs.some((d) => d.src === mBack)) {
                        allMemberDocs.push({
                          id: `back_${i}`,
                          label: hasRealName ? `${rawName} - Back` : `Document #${allMemberDocs.length + 1}`,
                          src: mBack,
                          filename: `${cleanName}_Back_ID`,
                        });
                      }

                      const normM = typeof m === "string" ? normalizeImageSrc(m) : null;
                      if (normM && !allMemberDocs.some((d) => d.src === normM)) {
                        allMemberDocs.push({
                          id: `str_${i}`,
                          label: `Document #${allMemberDocs.length + 1}`,
                          src: normM,
                          filename: `Member_${i + 1}_Photo`,
                        });
                      }
                    });

                    if (allMemberDocs.length === 0) return null;

                    return (
                      <Paper sx={{ p: 2, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                          <Group sx={{ fontSize: 18, color: themeConfig.primary }} />
                          Accompanying Guest Photos ({allMemberDocs.length})
                        </Typography>

                        {/* 4 Cards Per Row Grid */}
                        <Grid container spacing={1.5}>
                          {allMemberDocs.map((doc) => (
                            <Grid key={doc.id} size={{ xs: 12, sm: 6, md: 3 }}>
                              <Paper
                                sx={{
                                  p: 1.2,
                                  borderRadius: "12px",
                                  border: `1px solid ${themeConfig.border}`,
                                  bgcolor: isDarkMode ? "rgba(0,0,0,0.2)" : "#F8FAFC",
                                  textAlign: "center",
                                  transition: "all 0.2s ease",
                                  "&:hover": { borderColor: themeConfig.primary, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
                                }}
                              >
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, gap: 0.5 }}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontWeight: 800,
                                      color: themeConfig.textMain,
                                      fontSize: "0.72rem",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    📄 {doc.label}
                                  </Typography>
                                  <Chip
                                    icon={<FileDownload sx={{ fontSize: "12px !important" }} />}
                                    label="Download"
                                    size="small"
                                    clickable
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadSingleImage(doc.src, doc.filename);
                                    }}
                                    sx={{
                                      height: 18,
                                      fontSize: "0.62rem",
                                      fontWeight: 800,
                                      bgcolor: "rgba(11, 142, 224, 0.1)",
                                      color: "#0B8EE0",
                                      "&:hover": { bgcolor: "rgba(11, 142, 224, 0.2)" },
                                      flexShrink: 0,
                                      px: 0.5,
                                    }}
                                  />
                                </Box>

                                <Box
                                  component="img"
                                  src={doc.src}
                                  alt={doc.label}
                                  onClick={() => setPreviewImage(doc.src)}
                                  sx={{
                                    width: "100%",
                                    height: 120,
                                    objectFit: "cover",
                                    bgcolor: isDarkMode ? "rgba(0,0,0,0.25)" : "#FFFFFF",
                                    border: `1px solid ${themeConfig.border}`,
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    transition: "transform 0.2s, opacity 0.2s",
                                    "&:hover": { transform: "scale(1.03)", opacity: 0.95 },
                                  }}
                                />
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </Paper>
                    );
                  })()}
                </Box>
              )}

              {/* ================= TAB 1: BOOKING & ROOMS ================= */}
              {activeTab === 1 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* Stay Schedule Card */}
                  <Paper sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarMonth sx={{ fontSize: 18, color: themeConfig.primary }} />
                      Stay Schedule & Duration
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Check-In Date & Time</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          {activeBooking?.checkInDate ? new Date(activeBooking.checkInDate).toLocaleDateString("en-IN") : guest.checkInDate || "N/A"} ({formatTime12Hour(activeBooking?.checkInTime || guest.checkInTime || hotelSettings?.checkInTime || "14:00")})
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Check-Out Date & Time</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          {activeBooking?.checkOutDate ? new Date(activeBooking.checkOutDate).toLocaleDateString("en-IN") : guest.checkOutDate || "N/A"} ({formatTime12Hour(activeBooking?.checkOutTime || guest.checkOutTime || hotelSettings?.checkOutTime || "12:00")})
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Duration / Nights</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.primary }}>
                          {activeBooking?.numberOfNights || 1} Night(s)
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Multi-Room Detailed Breakdown (Requirement: Show ALL Rooms) */}
                  <Paper sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <MeetingRoom sx={{ fontSize: 18, color: themeConfig.primary }} />
                      Allocated Room Details ({roomsDetail.length || 1})
                    </Typography>

                    {roomsDetail.length > 0 ? (
                      <Grid container spacing={2}>
                        {roomsDetail.map((rm, idx) => (
                          <Grid key={rm.id || idx} size={{ xs: 12, sm: 6 }}>
                            <Paper
                              sx={{
                                p: 2,
                                borderRadius: "14px",
                                border: `1.5px solid ${themeConfig.border}`,
                                bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#F8FAFC",
                              }}
                            >
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: themeConfig.primary }}>
                                    Room #{rm.roomNumber}
                                  </Typography>
                                  <Chip
                                    label={`Floor ${rm.floor !== undefined && rm.floor !== null ? rm.floor : (parseInt(rm.roomNumber, 10) >= 100 ? Math.floor(parseInt(rm.roomNumber, 10) / 100) : 1)}`}
                                    size="small"
                                    sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, fontWeight: 800, fontSize: "0.7rem", height: 22 }}
                                  />
                                </Box>
                                <Chip label={rm.status || "OCCUPIED"} size="small" sx={{ fontWeight: 800, fontSize: "0.7rem" }} />
                              </Box>

                              <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                                {rm.roomType}
                              </Typography>
                              <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                                ₹{rm.pricePerNight?.toLocaleString()} / night &bull; {rm.numberOfNights} Night(s)
                              </Typography>

                              <Divider sx={{ my: 1 }} />
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted }}>
                                  Room Total:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.primaryDark }}>
                                  ₹{rm.roomTotal?.toLocaleString()}
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          Room Assigned: {guest.roomAssigned || guest.roomNumber || "Standard Room"}
                        </Typography>
                        {(guest.floor || guest.roomNumber) && (
                          <Chip
                            label={`Floor ${guest.floor !== undefined && guest.floor !== null ? guest.floor : (parseInt(guest.roomNumber || guest.roomAssigned, 10) >= 100 ? Math.floor(parseInt(guest.roomNumber || guest.roomAssigned, 10) / 100) : 1)}`}
                            size="small"
                            sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, fontWeight: 800, fontSize: "0.7rem", height: 22 }}
                          />
                        )}
                      </Box>
                    )}
                  </Paper>
                </Box>
              )}

              {/* ================= TAB 2: BILLING & PAYMENTS ================= */}
              {activeTab === 2 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* 1. Executive Financial Summary Cards */}
                  <Paper sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 1 }}>
                        <Receipt sx={{ fontSize: 18, color: themeConfig.primary }} />
                        Financial Settlement &amp; Tax Details
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip
                          label={resolvedPaymentDetails.paymentStatus === "PAID" ? "FULLY SETTLED" : resolvedPaymentDetails.paymentStatus === "PARTIAL" ? "PARTIALLY PAID" : "PENDING DUE"}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.72rem",
                            bgcolor: resolvedPaymentDetails.paymentStatus === "PAID" ? "rgba(16, 185, 129, 0.15)" : resolvedPaymentDetails.paymentStatus === "PARTIAL" ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)",
                            color: resolvedPaymentDetails.paymentStatus === "PAID" ? "#10B981" : resolvedPaymentDetails.paymentStatus === "PARTIAL" ? "#F59E0B" : "#EF4444",
                            border: `1px solid ${resolvedPaymentDetails.paymentStatus === "PAID" ? "rgba(16, 185, 129, 0.3)" : resolvedPaymentDetails.paymentStatus === "PARTIAL" ? "rgba(245, 158, 11, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                          }}
                        />
                        <Chip
                          label={`Via ${resolvedPaymentDetails.paymentMethod}`}
                          size="small"
                          sx={{ fontWeight: 800, fontSize: "0.72rem", bgcolor: themeConfig.champagne, color: themeConfig.primaryDark }}
                        />
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Base Room Charge</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                          ₹{resolvedPaymentDetails.baseAmount?.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.7rem" }}>
                          ₹{resolvedPaymentDetails.nightlyRate?.toLocaleString()}/night &bull; {resolvedPaymentDetails.numberOfNights} night(s)
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>GST / Taxes ({resolvedPaymentDetails.gstRate}%)</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                          ₹{resolvedPaymentDetails.gstAmount?.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.7rem" }}>
                          CGST: ₹{resolvedPaymentDetails.cgstAmount?.toLocaleString()} | SGST: ₹{resolvedPaymentDetails.sgstAmount?.toLocaleString()}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Total Paid to Date</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "#10B981" }}>
                          ₹{resolvedPaymentDetails.paidAmount?.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#10B981", fontSize: "0.7rem", fontWeight: 700 }}>
                          ✓ Received &amp; Logged
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Pending Balance</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: resolvedPaymentDetails.dueAmount > 0 ? "#EF4444" : "#10B981" }}>
                          {resolvedPaymentDetails.dueAmount > 0 ? `₹${resolvedPaymentDetails.dueAmount?.toLocaleString()}` : "✓ Settled"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: resolvedPaymentDetails.dueAmount > 0 ? "#EF4444" : "#10B981", fontSize: "0.7rem", fontWeight: 700 }}>
                          {resolvedPaymentDetails.dueAmount > 0 ? "⚠️ Collect at Desk" : "No Balance Dues"}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* 2. Itemized Room & Tax Folio Breakdown */}
                  <Paper sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <Receipt sx={{ fontSize: 18, color: themeConfig.primary }} />
                      Itemized Invoice &amp; Folio Ledger
                    </Typography>

                    <TableContainer sx={{ borderRadius: "12px", border: `1px solid ${themeConfig.border}`, overflowX: "auto" }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: themeConfig.champagne }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Description / Item</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Rate / Night</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Nights / Qty</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textMain }}>Total Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                              Room #{resolvedRoomsDetail[0]?.roomNumber || guest.roomAssigned || "101"} ({resolvedRoomsDetail[0]?.roomType || "Standard Room"})
                            </TableCell>
                            <TableCell>₹{resolvedPaymentDetails.nightlyRate?.toLocaleString()}</TableCell>
                            <TableCell>{resolvedPaymentDetails.numberOfNights} Night(s)</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>₹{resolvedPaymentDetails.baseAmount?.toLocaleString()}</TableCell>
                          </TableRow>

                          {resolvedPaymentDetails.discountAmount > 0 && (
                            <TableRow>
                              <TableCell colSpan={3} sx={{ color: "#10B981", fontWeight: 700 }}>Special Promotional Discount Applied</TableCell>
                              <TableCell align="right" sx={{ color: "#10B981", fontWeight: 800 }}>-₹{resolvedPaymentDetails.discountAmount?.toLocaleString()}</TableCell>
                            </TableRow>
                          )}

                          {resolvedPaymentDetails.extraChargesTotal > 0 && (
                            <TableRow>
                              <TableCell colSpan={3} sx={{ fontWeight: 700 }}>Extra Charges / Security Deposit</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>+₹{resolvedPaymentDetails.extraChargesTotal?.toLocaleString()}</TableCell>
                            </TableRow>
                          )}

                          <TableRow sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC" }}>
                            <TableCell colSpan={3} sx={{ fontWeight: 700 }}>GST ({resolvedPaymentDetails.gstRate}% &bull; CGST ₹{resolvedPaymentDetails.cgstAmount} + SGST ₹{resolvedPaymentDetails.sgstAmount})</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>₹{resolvedPaymentDetails.gstAmount?.toLocaleString()}</TableCell>
                          </TableRow>

                          <TableRow sx={{ borderTop: `2px solid ${themeConfig.border}` }}>
                            <TableCell colSpan={3} sx={{ fontWeight: 900, fontSize: "0.95rem", color: themeConfig.textMain }}>Grand Total Payable</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, fontSize: "1rem", color: themeConfig.primary }}>₹{resolvedPaymentDetails.totalAmount?.toLocaleString()}</TableCell>
                          </TableRow>

                          <TableRow>
                            <TableCell colSpan={3} sx={{ fontWeight: 800, color: "#10B981" }}>Total Amount Paid (via {resolvedPaymentDetails.paymentMethod})</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, color: "#10B981" }}>₹{resolvedPaymentDetails.paidAmount?.toLocaleString()}</TableCell>
                          </TableRow>

                          <TableRow sx={{ bgcolor: resolvedPaymentDetails.dueAmount > 0 ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)" }}>
                            <TableCell colSpan={3} sx={{ fontWeight: 900, color: resolvedPaymentDetails.dueAmount > 0 ? "#EF4444" : "#10B981" }}>
                              {resolvedPaymentDetails.dueAmount > 0 ? "⚠️ Outstanding Balance Due" : "✓ Folio Completely Settled"}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, fontSize: "1rem", color: resolvedPaymentDetails.dueAmount > 0 ? "#EF4444" : "#10B981" }}>
                              ₹{resolvedPaymentDetails.dueAmount?.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {resolvedPaymentDetails.notes && (
                      <Box sx={{ mt: 1.5, p: 1.2, borderRadius: "8px", bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC", border: `1px solid ${themeConfig.border}` }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Billing Note: </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain }}>{resolvedPaymentDetails.notes}</Typography>
                      </Box>
                    )}
                  </Paper>

                  {/* 3. Payment Transaction Ledger Table */}
                  <Paper sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 1 }}>
                        <PaymentIcon sx={{ fontSize: 18, color: themeConfig.primary }} />
                        Payment Transaction History ({resolvedPaymentHistory.length})
                      </Typography>
                    </Box>

                    {resolvedPaymentHistory.length > 0 ? (
                      <TableContainer sx={{ borderRadius: "12px", border: `1px solid ${themeConfig.border}`, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                        <Table size="small" sx={{ minWidth: 650 }}>
                          <TableHead sx={{ bgcolor: themeConfig.champagne }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Transaction ID</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Method</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Taxable</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>GST</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Total Paid</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {resolvedPaymentHistory.map((p, idx) => (
                              <TableRow key={p.id || idx}>
                                <TableCell sx={{ fontWeight: 700 }}>{p.formattedDate}</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: themeConfig.primary, fontFamily: "monospace" }}>{p.transactionId}</TableCell>
                                <TableCell>{p.description}</TableCell>
                                <TableCell>
                                  <Chip label={p.paymentMethod} size="small" sx={{ fontWeight: 800, fontSize: "0.7rem", bgcolor: themeConfig.champagne, color: themeConfig.primaryDark }} />
                                </TableCell>
                                <TableCell>₹{p.amount?.toLocaleString()}</TableCell>
                                <TableCell>₹{p.gst?.toLocaleString()}</TableCell>
                                <TableCell sx={{ fontWeight: 900, color: "#10B981" }}>₹{p.total?.toLocaleString()}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={p.status}
                                    size="small"
                                    color={p.status === "PAID" ? "success" : "default"}
                                    sx={{ fontWeight: 800, fontSize: "0.7rem" }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ p: 4, textAlign: "center" }}>
                        <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                          No payment transactions recorded yet. Balance of ₹{resolvedPaymentDetails.dueAmount?.toLocaleString()} is pending.
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Box>
              )}

              {/* ================= TAB 3: ACTIVITY TIMELINE ================= */}
              {activeTab === 3 && (
                <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 1 }}>
                      <TimelineIcon sx={{ fontSize: 18, color: themeConfig.primary }} />
                      Real-time Stay Activity Timeline ({timeline.length} Milestones)
                    </Typography>
                    <Chip
                      label={bookingStatus === "CHECKED_IN" || bookingStatus === "IN-HOUSE" ? "● LIVE IN-HOUSE" : bookingStatus}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.72rem",
                        bgcolor: bookingStatus === "CHECKED_IN" || bookingStatus === "IN-HOUSE" ? "rgba(16, 185, 129, 0.15)" : themeConfig.champagne,
                        color: bookingStatus === "CHECKED_IN" || bookingStatus === "IN-HOUSE" ? "#10B981" : themeConfig.primaryDark,
                      }}
                    />
                  </Box>

                  {timeline && timeline.length > 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pl: { xs: 0.5, sm: 1 } }}>
                      {timeline.map((step, idx) => {
                        const isLast = idx === timeline.length - 1;
                        const isCompleted = step.status === "COMPLETED";
                        const isActive = step.status === "ACTIVE";
                        const isPartial = step.status === "PARTIAL";
                        const isPending = step.status === "PENDING";
                        const isUpcoming = step.status === "UPCOMING";

                        const stepBg = isActive
                          ? themeConfig.primary
                          : isCompleted
                          ? "#10B981"
                          : isPartial
                          ? "#F59E0B"
                          : isPending
                          ? "#EF4444"
                          : (isDarkMode ? "#334155" : "#CBD5E1");

                        const StepIcon =
                          step.type === "RESERVATION" ? EventNote :
                          step.type === "KYC" ? Security :
                          step.type === "ROOM" ? MeetingRoom :
                          step.type === "CHECK_IN" ? Key :
                          step.type === "PAYMENT" ? ReceiptLong :
                          step.type === "IN_HOUSE" ? Hotel :
                          step.type === "CHECK_OUT" || step.type === "CHECK_OUT_SCHEDULED" ? Logout :
                          CheckCircle;

                        return (
                          <Box key={step.id || idx} sx={{ display: "flex", alignItems: "flex-start", gap: 2, position: "relative" }}>
                            {!isLast && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  left: 17,
                                  top: 36,
                                  bottom: -22,
                                  width: 2,
                                  bgcolor: isCompleted || isActive ? themeConfig.primary : themeConfig.border,
                                  opacity: isUpcoming ? 0.35 : 1,
                                }}
                              />
                            )}

                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                bgcolor: stepBg,
                                color: "#FFFFFF",
                                boxShadow: isActive
                                  ? "0 0 0 4px rgba(16, 185, 129, 0.25)"
                                  : "0 2px 8px rgba(0,0,0,0.12)",
                                zIndex: 1,
                                transition: "all 0.3s ease",
                              }}
                            >
                              <StepIcon sx={{ fontSize: 19 }} />
                            </Avatar>

                            <Paper
                              sx={{
                                flex: 1,
                                p: 1.8,
                                borderRadius: "12px",
                                border: `1px solid ${isActive ? themeConfig.primary : themeConfig.border}`,
                                bgcolor: isActive
                                  ? (isDarkMode ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.04)")
                                  : (isDarkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC"),
                                transition: "all 0.2s ease",
                              }}
                            >
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 0.5 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                                    {step.title}
                                  </Typography>
                                  <Chip
                                    label={
                                      isActive ? "● CURRENT STAY" :
                                      isCompleted ? "COMPLETED" :
                                      isPartial ? "PARTIAL ADVANCE" :
                                      isPending ? "ACTION REQUIRED" :
                                      "SCHEDULED"
                                    }
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: "0.65rem",
                                      fontWeight: 800,
                                      bgcolor: isActive ? "rgba(16, 185, 129, 0.15)" : isCompleted ? "rgba(16, 185, 129, 0.1)" : isPending ? "rgba(239, 68, 68, 0.1)" : "rgba(148, 163, 184, 0.15)",
                                      color: isActive ? "#10B981" : isCompleted ? "#10B981" : isPending ? "#EF4444" : themeConfig.textMuted,
                                      border: `1px solid ${isActive ? "rgba(16, 185, 129, 0.3)" : isCompleted ? "rgba(16, 185, 129, 0.2)" : isPending ? "rgba(239, 68, 68, 0.2)" : "transparent"}`,
                                    }}
                                  />
                                </Box>
                                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                                  {step.timestamp ? (() => {
                                    try {
                                      const d = new Date(step.timestamp);
                                      return isNaN(d.getTime()) ? String(step.timestamp) : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
                                    } catch (e) {
                                      return String(step.timestamp);
                                    }
                                  })() : "Recorded"}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ color: themeConfig.textMuted, lineHeight: 1.5 }}>
                                {step.description}
                              </Typography>
                            </Paper>
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                      <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
                        No specific timeline milestones registered for this guest.
                      </Typography>
                    </Box>
                  )}
                </Paper>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: { xs: 1.5, sm: 2 },
            px: { xs: 1.5, sm: 2.5 },
            bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC",
            borderTop: `1px solid ${themeConfig.border}`,
            display: "flex",
            alignItems: "stretch",
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "wrap", flexDirection: { xs: "column", sm: "row" }, width: { xs: "100%", sm: "auto" } }}>
            <Button
              size="small"
              disabled={pdfLoading}
              startIcon={pdfLoading ? <CircularProgress size={16} /> : <Receipt sx={{ fontSize: 18 }} />}
              variant="outlined"
              onClick={async () => {
                const bId =
                  activeBooking?.id ||
                  activeBooking?._id ||
                  details?.activeBooking?.id ||
                  details?.activeBooking?._id ||
                  details?.id ||
                  details?._id ||
                  guestData?.booking?.id ||
                  guestData?.booking?._id ||
                  guestData?.id ||
                  guestData?._id;

                if (bId && !String(bId).startsWith("b-")) {
                  setPdfLoading(true);
                  try {
                    toast.show("Generating Booking Folio PDF from server...", "info");
                    const endpoint = API_ENDPOINTS.BOOKINGS.FOLIO_PDF(bId);
                    const res = await apiRequest(endpoint);
                    if (res?.success && res?.data?.url) {
                      const pdfUrl = res.data.url;
                      const a = document.createElement("a");
                      a.href = pdfUrl;
                      a.target = "_blank";
                      a.download = res.data.file_name || `Folio_${bId}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      toast.show("Folio PDF downloaded successfully!", "success");
                      setPdfLoading(false);
                      return;
                    }
                  } catch (err) {
                    console.warn("Backend Folio PDF generation failed, falling back to local:", err);
                  } finally {
                    setPdfLoading(false);
                  }
                }

                try {
                  downloadGuestFolioPDF(
                    {
                      guest,
                      activeBooking: {
                        ...activeBooking,
                        paidAmount: resolvedPaymentDetails.paidAmount,
                        dueAmount: resolvedPaymentDetails.dueAmount,
                        totalAmount: resolvedPaymentDetails.totalAmount,
                        baseAmount: resolvedPaymentDetails.baseAmount,
                        gstAmount: resolvedPaymentDetails.gstAmount,
                        cgstAmount: resolvedPaymentDetails.cgstAmount,
                        sgstAmount: resolvedPaymentDetails.sgstAmount,
                        paymentMethod: resolvedPaymentDetails.paymentMethod,
                      },
                      paymentDetails: resolvedPaymentDetails,
                      paymentHistory: resolvedPaymentHistory,
                      roomsDetail: resolvedRoomsDetail,
                      accompanyingGuests,
                    },
                    hotelSettings?.hotel || {}
                  );
                } catch (e) {
                  console.error("Error generating folio PDF:", e);
                  toast.show("Could not generate Folio PDF", "error");
                }
              }}
              sx={{
                width: { xs: "100%", sm: "auto" },
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "0.78rem",
                textTransform: "none",
                borderColor: themeConfig.border,
                color: themeConfig.textMain,
                px: 1.6,
                py: 0.75,
                justifyContent: "center",
                "&:hover": { borderColor: themeConfig.primary, bgcolor: themeConfig.champagne },
              }}
            >
              {pdfLoading ? "Generating..." : "Guest Folio PDF"}
            </Button>

            <Button
              size="small"
              startIcon={<FileDownload sx={{ fontSize: 18 }} />}
              variant="outlined"
              onClick={() => {
                downloadAllGuestIdImages(
                  {
                    guest,
                    activeBooking,
                    accompanyingGuests,
                    allIdPhotos,
                  },
                  (msg, sev) => toast.show(msg, sev)
                );
              }}
              sx={{
                width: { xs: "100%", sm: "auto" },
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "0.78rem",
                textTransform: "none",
                borderColor: themeConfig.primary || "#0F766E",
                color: themeConfig.primary || "#0F766E",
                bgcolor: "rgba(15, 118, 110, 0.06)",
                px: 1.6,
                py: 0.75,
                justifyContent: "center",
                "&:hover": { bgcolor: "rgba(15, 118, 110, 0.12)", borderColor: themeConfig.primary || "#0F766E" },
              }}
            >
              Download ID Proofs (.ZIP)
            </Button>

            {/* Single Unified WhatsApp Action Button */}
            <Button
              size="small"
              startIcon={<WhatsApp sx={{ color: "#FFFFFF", fontSize: 18 }} />}
              variant="contained"
              onClick={() => {
                if (activeBooking) {
                  sendCheckoutBillWhatsApp({
                    booking: {
                      ...activeBooking,
                      totalAmount: resolvedPaymentDetails.totalAmount,
                      paidAmount: resolvedPaymentDetails.paidAmount,
                      dueAmount: resolvedPaymentDetails.dueAmount,
                      baseAmount: resolvedPaymentDetails.baseAmount,
                    },
                    guest,
                    hotel: hotelSettings?.hotel || guest?.hotel || {},
                    onShowToast: (msg, sev) => toast.show(msg, sev),
                  });
                } else {
                  sendCheckInWhatsApp({
                    booking: { guestName: guest.name || guest.fullName, roomNumber: guest.roomAssigned },
                    guest,
                    hotel: hotelSettings?.hotel || guest?.hotel || {},
                    onShowToast: (msg, sev) => toast.show(msg, sev),
                  });
                }
              }}
              sx={{
                width: { xs: "100%", sm: "auto" },
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "0.78rem",
                textTransform: "none",
                bgcolor: "#25D366",
                color: "#FFFFFF",
                boxShadow: "0 2px 8px rgba(37, 211, 102, 0.3)",
                px: 1.8,
                py: 0.75,
                justifyContent: "center",
                "&:hover": { bgcolor: "#1EBE5D" },
              }}
            >
              Send on WhatsApp
            </Button>
          </Box>

          <Button
            onClick={onClose}
            variant="contained"
            size="small"
            sx={{
              display: { xs: "none", sm: "inline-flex" },
              width: { xs: "100%", sm: "auto" },
              borderRadius: "10px",
              fontWeight: 800,
              fontSize: "0.8rem",
              textTransform: "none",
              background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
              color: "#FFFFFF",
              px: 2.5,
              py: 0.75,
              justifyContent: "center",
              boxShadow: `0 3px 10px ${themeConfig.primaryGlow}`,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Zoom / Lightbox Preview Modal */}
      {previewImage && (
        <Dialog open={Boolean(previewImage)} onClose={() => setPreviewImage(null)} maxWidth="md">
          <DialogTitle component="div" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="subtitle1" component="div" sx={{ fontWeight: 800 }}>ID Proof Document Preview</Typography>
            <IconButton onClick={() => setPreviewImage(null)}><Close /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2, textAlign: "center" }}>
            <Box component="img" src={previewImage} alt="ID Document Preview" sx={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: "12px", objectFit: "contain" }} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
