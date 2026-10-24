"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Avatar,
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
} from "@mui/material";
import {
  Search,
  Print,
  WhatsApp,
  Logout,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { useSocket } from "@/shared/context/SocketContext";
import { mergeBookingEvent } from "@/shared/utils/liveSync";
import { toast } from "@/shared/utils/toast";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";
import GuestDetailsModal from "@/shared/components/GuestDetailsModal";
import { downloadBookingBill } from "@/shared/utils/bookingPdf";
import FolioPdfButton from "@/shared/components/FolioPdfButton";
import { TableCard, TableToolbar, TablePager, tableFieldSx, tableSearchSx } from "@/shared/components/DataTable";

function formatCurrency(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(val);
  }
}

function formatDateTime(val) {
  if (!val) return "—";
  try {
    const raw = String(val);
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "—";
    const dateOnly = /T00:00:00(\.000)?Z$/.test(raw);
    if (dateOnly) {
      return d.toLocaleDateString("en-IN", {
        timeZone: "UTC",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function num(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function staySources(record) {
  if (!record || typeof record !== "object") return [];
  return [record, record.booking, record.guest, record.stay, record.folio, record.billing, record.invoice].filter(
    (item) => item && typeof item === "object" && !Array.isArray(item)
  );
}

function firstValue(sources, keys) {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
  }
  return null;
}

function readBookingPage(res) {
  const data = res?.data;
  let list = [];
  if (Array.isArray(data)) list = data;
  else if (Array.isArray(data?.bookings)) list = data.bookings;
  else if (Array.isArray(data?.results)) list = data.results;
  else if (Array.isArray(data?.items)) list = data.items;
  else if (Array.isArray(res?.bookings)) list = res.bookings;
  const totalRaw = data?.pagination?.total
    ?? data?.pagination?.totalRecords
    ?? data?.total
    ?? data?.totalRecords
    ?? res?.pagination?.total
    ?? res?.total;
  const total = Number.isFinite(Number(totalRaw)) ? Number(totalRaw) : list.length;
  return { list: list.filter((item) => item && typeof item === "object"), total };
}

function recordKey(record) {
  return String(record?.id || record?._id || record?.booking_number || record?.bookingNumber || "");
}

function filledScore(record) {
  if (!record) return 0;
  let score = 0;
  if (record.check_in_date || record.checkInDate || record.actual_check_in || record.actualCheckIn || record.checkIn) score += 4;
  if (record.check_out_date || record.checkOutDate || record.actual_check_out || record.checkOut) score += 2;
  if (Number(record.total_amount || record.totalAmount || record.base_amount || record.baseAmount || record.paid_amount || record.paidAmount) > 0) score += 4;
  if (record.primary_guest_name || record.guestName || record.fullName || record.name) score += 1;
  return score;
}

function mergePair(a, b) {
  if (!a) return b;
  if (!b) return a;
  const timeA = new Date(a.updated_at || a.updatedAt || a.created_at || a.createdAt || 0).getTime();
  const timeB = new Date(b.updated_at || b.updatedAt || b.created_at || b.createdAt || 0).getTime();
  const primary = (timeB > timeA) ? b : (timeA > timeB) ? a : (filledScore(b) >= filledScore(a) ? b : a);
  const secondary = primary === b ? a : b;
  const merged = { ...secondary, ...primary };
  Object.entries(secondary).forEach(([key, value]) => {
    const current = merged[key];
    const empty = current === undefined || current === null || current === "";
    if (empty && value !== undefined && value !== null && value !== "") merged[key] = value;
  });
  return merged;
}

function mergeLists(...lists) {
  const map = new Map();
  lists.flat().forEach((item) => {
    if (!item || typeof item !== "object") return;
    const key = recordKey(item);
    if (!key) return;
    map.set(key, mergePair(map.get(key), item));
  });
  return Array.from(map.values());
}

function asRecordList(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value.bookings)) return value.bookings;
  if (Array.isArray(value.guests)) return value.guests;
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.data?.bookings)) return value.data.bookings;
  return [];
}

function roomLabelFor(record, rooms) {
  const embedded = Array.isArray(record.rooms)
    ? record.rooms.map((r) => r.room_number || r.roomNumber).filter(Boolean).join(", ")
    : "";
  if (embedded) return embedded;
  const direct = record.roomNumber || record.room_number || record.roomAssigned;
  if (direct) return String(direct);
  const ids = Array.isArray(record.room_id) ? record.room_id : record.room_id ? [record.room_id] : Array.isArray(record.roomId) ? record.roomId : [];
  if (!ids.length || !Array.isArray(rooms)) return "—";
  const labels = ids.map((id) => {
    const room = rooms.find((r) => String(r.id || r._id) === String(id));
    return room?.roomNumber || room?.room_number || String(id);
  });
  return labels.filter(Boolean).join(", ") || "—";
}

export default function GuestListPage({
  guests = [],
  bookings = [],
  rooms = [],
  hotelSettings = {},
  onRefresh,
  onRequestCheckout,
  defaultRowsPerPage = 10,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();

  // Selected Guest for Detail Page
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [pdfGuestId, setPdfGuestId] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [bookingDetails, setBookingDetails] = useState({});
  const [serverPage, setServerPage] = useState(null);

  const [liveTick, setLiveTick] = useState(0);

  // Real-Time Socket Auto-Sync.
  // Guest Directory uses the bookings list API only (all row fields come from that payload).
  useSocket(
    [
      "BOOKING_CREATED",
      "BOOKING_UPDATED",
      "GUEST_CHECKED_OUT",
      "PAYMENT_RECORDED",
      "GUEST_UPDATED",
      "ROOM_UPDATED",
    ],
    () => {
      setLiveTick((tick) => tick + 1);
      if (onRefresh) onRefresh();
    }
  );

  // booking:updated carries the whole booking (create, update, payment, check-out, status change, delete):
  // show it in the list at once, the background refresh above then confirms it.
  useSocket(["booking:updated"], (payload) => {
    const id = payload?.id ?? payload?._id;
    if (id === undefined || id === null) return;
    const key = String(id);

    setBookingDetails((prev) => {
      const next = { ...prev };
      if (payload.deleted_at) delete next[key];
      else next[key] = payload;
      return next;
    });

    setServerPage((prev) => {
      if (!prev) return prev; // list comes from the dashboard props, which are patched by the dashboard
      const exists = prev.list.some((item) => String(item.id ?? item._id) === key);
      let total = prev.total;
      if (!exists && !payload.deleted_at) total += 1;
      else if (exists && payload.deleted_at) total = Math.max(0, total - 1);
      return { list: mergeBookingEvent(prev.list, payload), total };
    });
  });

  // List the bookings API records (check-in / check-out stays) as they arrive.
  const unifiedGuests = useMemo(() => {
    const records = mergeLists(
      serverPage?.list || [],
      asRecordList(bookings),
      asRecordList(guests),
      Object.values(bookingDetails)
    );
    const items = [];
    const seenIds = new Set();

    records.forEach((b) => {
      const id = String(b.id || b._id || b.booking_number || b.bookingNumber || "");
      if (!id || seenIds.has(id)) return;
      seenIds.add(id);

      const rawStatus = String(b.booking_status || b.status || "CONFIRMED").toUpperCase();
      const normalizedStatus =
        rawStatus === "IN-HOUSE" || rawStatus === "IN_HOUSE" ? "CHECKED_IN" : rawStatus;

      const sources = staySources(b);
      const baseAmount = num(firstValue(sources, ["base_amount", "baseAmount", "room_amount", "roomAmount", "room_tariff", "roomTariff"]));
      const gstAmount = num(firstValue(sources, ["gst_amount", "gstAmount", "tax_amount", "taxAmount", "cgst_amount", "sgst_amount"]));
      const nights = num(firstValue(sources, ["number_of_nights", "numberOfNights", "nights"])) || 1;
      const rate = num(firstValue(sources, ["price_per_night", "pricePerNight", "rate_per_night", "ratePerNight", "custom_price_per_night", "nightly_rate", "rate"]));
      const total = num(firstValue(sources, ["total_amount", "totalAmount", "grand_total", "grandTotal", "invoice_total", "bill_amount"])) || baseAmount + gstAmount || (rate > 0 ? rate * nights : 0);
      const paid = num(firstValue(sources, ["paid_amount", "paidAmount", "advance_paid", "advancePaid", "advance_payment_amount", "advancePaymentAmount"]));
      const due = num(firstValue(sources, ["due_amount", "dueAmount"])) || Math.max(0, total - paid);
      const rawPaymentStatus = String(firstValue(sources, ["payment_status", "paymentStatus"]) || "").toUpperCase();
      const paymentStatus = rawPaymentStatus === "PARTIALLY_PAID" || rawPaymentStatus === "PARTIAL"
        ? "PARTIAL"
        : rawPaymentStatus === "PAID" || rawPaymentStatus === "FULLY_PAID"
          ? "PAID"
          : rawPaymentStatus === "UNPAID" || rawPaymentStatus === "DUE" || rawPaymentStatus === "PENDING"
            ? "UNPAID"
            : paid > 0 && due > 0
              ? "PARTIAL"
              : total > 0 && due <= 0
                ? "PAID"
                : "UNPAID";
      const roomType =
        (Array.isArray(b.rooms) && (b.rooms[0]?.room_type_name || b.rooms[0]?.roomTypeName)) ||
        b.room_type_name ||
        b.roomTypeName ||
        "";

      items.push({
        id,
        _id: id,
        bookingNumber: b.booking_number || b.bookingNumber || "",
        guestName: b.primary_guest_name || b.guestName || b.guest?.name || b.guest?.fullName || "Guest",
        secondaryGuestName: b.secondary_guest_name || b.secondaryGuestName || b.secondary_guest || "",
        phone: b.mobile_number || b.phone || b.mobile || b.guest?.phone || "",
        email: b.email || b.guest?.email || "",
        roomAssigned: roomLabelFor(b, rooms),
        roomType: roomType || "—",
        status: normalizedStatus,
        checkInDate: firstValue(sources, ["actual_check_in", "actualCheckIn", "check_in_date", "checkInDate", "check_in", "checkIn", "expected_check_in", "from_date", "arrival_date"]),
        checkOutDate: firstValue(sources, ["actual_check_out", "actualCheckOut", "check_out_date", "checkOutDate", "check_out", "checkOut", "expected_check_out", "to_date", "departure_date"]),
        actualCheckIn: firstValue(sources, ["actual_check_in", "actualCheckIn"]),
        actualCheckOut: firstValue(sources, ["actual_check_out", "actualCheckOut"]),
        baseAmount,
        gstAmount,
        totalAmount: total,
        paidAmount: paid,
        dueAmount: due,
        paymentStatus,
        createdAt: b.created_at || b.createdAt || b.check_in_date || b.checkInDate,
        raw: b,
      });
    });

    return items;
  }, [bookings, guests, rooms, serverPage, bookingDetails]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params = new URLSearchParams({ page: "1", limit: "100" });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      try {
        const res = await apiRequest(`${API_ENDPOINTS.BOOKINGS.ALL}?${params.toString()}`, { forceRefresh: true });
        const pageData = readBookingPage(res);
        if (!cancelled && pageData.list.length > 0) {
          setServerPage(pageData);
        } else if (!cancelled) {
          setServerPage(null);
        }
      } catch {
        if (!cancelled) setServerPage(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchQuery, liveTick]);

  const withApiStay = (g) => {
    const d = bookingDetails[g.id];
    const sources = [...staySources(d), ...staySources(g.raw), g];
    const checkIn = firstValue(sources, ["actual_check_in", "actualCheckIn", "check_in_date", "checkInDate", "check_in", "checkIn", "expected_check_in", "from_date", "arrival_date"]);
    const checkOut = firstValue(sources, ["actual_check_out", "actualCheckOut", "check_out_date", "checkOutDate", "check_out", "checkOut", "expected_check_out", "to_date", "departure_date"]);
    const baseAmount = num(firstValue(sources, ["base_amount", "baseAmount", "room_amount", "roomAmount", "room_tariff", "roomTariff"]));
    const gstAmount = num(firstValue(sources, ["gst_amount", "gstAmount", "tax_amount", "taxAmount"]));
    const nights = num(firstValue(sources, ["number_of_nights", "numberOfNights", "nights"])) || 1;
    const rate = num(firstValue(sources, ["price_per_night", "pricePerNight", "rate_per_night", "ratePerNight", "custom_price_per_night", "nightly_rate", "rate"]));
    const bookedPlusGst = baseAmount + gstAmount;
    const explicitTotal = firstValue(sources, ["total_amount", "totalAmount", "grand_total", "grandTotal", "invoice_total", "bill_amount"]);
    const totalAmount = explicitTotal !== undefined && explicitTotal !== null && explicitTotal !== ""
      ? num(explicitTotal)
      : (bookedPlusGst > 0 ? bookedPlusGst : (rate > 0 ? rate * nights : 0));
    const paidFromSources = firstValue(sources, ["paid_amount", "paidAmount", "advance_paid", "advancePaid", "advance_payment_amount", "advancePaymentAmount"]);
    const paidAmount = paidFromSources !== undefined && paidFromSources !== null && paidFromSources !== ""
      ? num(paidFromSources)
      : (g.paidAmount || 0);
    const dueFromApi = firstValue(sources, ["due_amount", "dueAmount"]);
    const dueAmount = dueFromApi !== undefined && dueFromApi !== null && dueFromApi !== ""
      ? num(dueFromApi)
      : Math.max(0, totalAmount - paidAmount);
    const guestName = firstValue(sources, ["primary_guest_name", "guest_name", "guestName", "full_name", "fullName", "name"]) || g.guestName;
    const phone = firstValue(sources, ["mobile_number", "phone", "mobile"]) || g.phone;
    const email = firstValue(sources, ["email"]) || g.email;
    const bookingNumber = firstValue(sources, ["booking_number", "bookingNumber"]) || g.bookingNumber;
    const roomFromDetail = d ? roomLabelFor(d, rooms) : "";
    let roomAssigned = roomFromDetail && roomFromDetail !== "—" ? roomFromDetail : (g.roomAssigned || roomLabelFor(g.raw || g, rooms));
    roomAssigned = String(roomAssigned).replace(/^Room\s*#?\s*/i, "").trim() || "—";
    const rawStatus = String(firstValue(sources, ["booking_status", "status"]) || g.status || "").toUpperCase();
    const status = (rawStatus === "IN-HOUSE" || rawStatus === "IN_HOUSE")
      ? "CHECKED_IN"
      : (rawStatus === "CHECKED_OUT" || rawStatus === "DEPARTED" || rawStatus === "CHECKOUT")
        ? "CHECKED_OUT"
        : (rawStatus || g.status);
    return { ...g, checkIn, checkOut, baseAmount, gstAmount, totalAmount, paidAmount, dueAmount, guestName, phone, email, bookingNumber, roomAssigned, status };
  };

  // Filtered & Sorted List
  const filteredGuests = useMemo(() => {
    return unifiedGuests
      .filter((item) => {
        // Status filter
        if (statusFilter !== "ALL") {
          if (statusFilter === "CHECKED_IN" && item.status !== "CHECKED_IN") return false;
          if (statusFilter === "CHECKED_OUT" && item.status !== "CHECKED_OUT" && item.status !== "DEPARTED") return false;
          if (statusFilter === "CONFIRMED" && item.status !== "CONFIRMED" && item.status !== "PENDING" && item.status !== "BOOKED") return false;
          if (statusFilter === "CANCELLED" && item.status !== "CANCELLED") return false;
        }

        // Payment status filter
        if (paymentFilter !== "ALL" && item.paymentStatus !== paymentFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.guestName.toLowerCase().includes(q);
          const matchPhone = item.phone.toLowerCase().includes(q);
          const matchEmail = item.email.toLowerCase().includes(q);
          const matchRoom = String(item.roomAssigned).toLowerCase().includes(q);
          const matchRef = String(item.bookingNumber || item.id).toLowerCase().includes(q);

          return matchName || matchPhone || matchEmail || matchRoom || matchRef;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "NEWEST") {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === "OLDEST") {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortBy === "NAME_ASC") {
          return a.guestName.localeCompare(b.guestName);
        }
        if (sortBy === "AMOUNT_DESC") {
          return b.totalAmount - a.totalAmount;
        }
        if (sortBy === "DUE_DESC") {
          return b.dueAmount - a.dueAmount;
        }
        return 0;
      });
  }, [unifiedGuests, statusFilter, paymentFilter, searchQuery, sortBy]);

  // Paginated Slices
  const paginatedGuests = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredGuests.slice(start, start + rowsPerPage);
  }, [filteredGuests, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const openGuestPdf = async (guest) => {
    const id = guest?.id || guest?._id;
    if (!id) return;
    try {
      setPdfGuestId(String(id));
      const label = String(guest.bookingNumber || guest.booking_number || guest.name || `guest-${id}`).replace(/\s+/g, "-");
      await downloadBookingBill(id, label);
      toast.show("Bill ready", "success");
    } catch (err) {
      toast.show(err?.message || "Could not generate the bill", "error");
    } finally {
      setPdfGuestId("");
    }
  };

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 4 } }}>
      <TableCard>
        <TableToolbar>
          <TextField
            size="small"
            placeholder="Search guest, booking, or room"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            sx={tableSearchSx(themeConfig)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: themeConfig.textMuted }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            sx={tableFieldSx(themeConfig, 180)}
          >
            <MenuItem value="ALL">All statuses</MenuItem>
            <MenuItem value="CHECKED_IN">Checked in</MenuItem>
            <MenuItem value="CHECKED_OUT">Checked out</MenuItem>
            <MenuItem value="CONFIRMED">Upcoming</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(0);
            }}
            sx={tableFieldSx(themeConfig, 170)}
          >
            <MenuItem value="ALL">All payments</MenuItem>
            <MenuItem value="PAID">Paid</MenuItem>
            <MenuItem value="PARTIAL">Partial</MenuItem>
            <MenuItem value="UNPAID">Unpaid</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(0);
            }}
            sx={tableFieldSx(themeConfig, 170)}
          >
            <MenuItem value="NEWEST">Newest stay</MenuItem>
            <MenuItem value="OLDEST">Oldest stay</MenuItem>
            <MenuItem value="NAME_ASC">Name (A-Z)</MenuItem>
            <MenuItem value="AMOUNT_DESC">Highest tariff</MenuItem>
            <MenuItem value="DUE_DESC">Highest due</MenuItem>
          </TextField>
        </TableToolbar>

        {filteredGuests.length === 0 ? (
          <EmptyState
            embedded
            title="No guests"
            description="No guest records match this search."
          />
        ) : (
          <>
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="medium" sx={{ minWidth: 980 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Guest</TableCell>
                  <TableCell>Room</TableCell>
                  <TableCell>Check-In</TableCell>
                  <TableCell>Check-Out</TableCell>
                  <TableCell align="right">Total Amount</TableCell>
                  <TableCell align="right">Paid Amount</TableCell>
                  <TableCell align="right">Due Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedGuests.map((row) => {
                  const g = withApiStay(row);
                  return (
                  <TableRow
                    key={g.id}
                    hover
                    sx={{
                      cursor: "pointer",
                      "&:last-child td, &:last-child th": { border: 0 },
                    }}
                    onClick={() => setSelectedGuest(g)}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: "0.8rem", fontWeight: 800, bgcolor: themeConfig.primary, color: themeConfig.onPrimary, flexShrink: 0 }}>
                          {(g.guestName || "G").charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "0.9rem", lineHeight: 1.2 }}>
                            {g.guestName}
                          </Typography>
                          {g.secondaryGuestName && (
                            <Typography variant="caption" sx={{ color: themeConfig.primary, fontWeight: 700, display: "block", fontSize: "0.74rem" }}>
                              + {g.secondaryGuestName}
                            </Typography>
                          )}
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 600 }}>
                            {g.phone || g.bookingNumber || "—"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>
                      Room {g.roomAssigned}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: themeConfig.textMain, whiteSpace: "nowrap" }}>
                      {formatDateTime(g.checkIn)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: themeConfig.textMain, whiteSpace: "nowrap" }}>
                      {formatDateTime(g.checkOut)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>
                      {formatCurrency(g.totalAmount)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: "#10B981", whiteSpace: "nowrap" }}>
                      {formatCurrency(g.paidAmount)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: g.dueAmount > 0 ? "#DC2626" : "#10B981", whiteSpace: "nowrap" }}>
                      {formatCurrency(g.dueAmount)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusChip status={g.status} />
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                        {g.phone && (
                          <Tooltip title="Chat on WhatsApp">
                            <IconButton
                              size="small"
                              onClick={() => {
                                const clean = g.phone.replace(/\D/g, "");
                                window.open(`https://wa.me/91${clean}`, "_blank");
                              }}
                              sx={{ color: "#25D366" }}
                            >
                              <WhatsApp fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title={pdfGuestId === String(g.id) ? "Preparing bill" : "Bill"}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={pdfGuestId === String(g.id)}
                              onClick={() => openGuestPdf(g)}
                              sx={{
                                border: `1px solid ${themeConfig.border}`,
                                borderRadius: "8px",
                                color: themeConfig.textMain,
                                "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary },
                              }}
                            >
                              <Print fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <FolioPdfButton booking={g} iconOnly />
                        {typeof onRequestCheckout === "function" &&
                          (g.status === "CHECKED_IN" || g.status === "IN-HOUSE" || g.status === "IN_HOUSE") && (
                          <Tooltip title="Check-out guest">
                            <IconButton
                              size="small"
                              aria-label="Check-out guest"
                              onClick={() => onRequestCheckout(g.raw || g)}
                              sx={{
                                color: "#DC2626",
                                bgcolor: "rgba(220, 38, 38, 0.08)",
                                border: "1px solid rgba(220, 38, 38, 0.28)",
                                borderRadius: "8px",
                                "&:hover": {
                                  bgcolor: "#DC2626",
                                  color: "#FFFFFF",
                                  borderColor: "#DC2626",
                                },
                              }}
                            >
                              <Logout fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePager
            count={filteredGuests.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
          </>
        )}
      </TableCard>

      <GuestDetailsModal
        open={Boolean(selectedGuest)}
        onClose={() => setSelectedGuest(null)}
        guestId={selectedGuest?.id}
        guestData={selectedGuest}
        hotelSettings={hotelSettings}
        onRefresh={onRefresh}
      />
    </Box>
  );
}
