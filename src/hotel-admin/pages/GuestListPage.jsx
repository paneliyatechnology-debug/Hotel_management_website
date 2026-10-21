"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Button,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Grid,
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
  ArrowForward,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { useSocket } from "@/shared/context/SocketContext";
import { mergeBookingEvent } from "@/shared/utils/liveSync";
import { toast } from "@/shared/utils/toast";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";
import GuestDetailsModal from "@/shared/components/GuestDetailsModal";
import { downloadBookingPdf } from "@/shared/utils/bookingPdf";

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
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [bookingDetails, setBookingDetails] = useState({});
  const [serverPage, setServerPage] = useState(null);

  const [liveTick, setLiveTick] = useState(0);

  // Real-Time Socket Auto-Sync.
  // This page lists bookings from its own paginated API call and caches per-booking details,
  // so a live event must reload both of them, not only the dashboard data passed in as props.
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
      setBookingDetails({});
      setLiveTick((tick) => tick + 1);
      if (onRefresh) onRefresh();
    }
  );

  // booking:updated carries the whole booking (create, update, payment, check-out, status change, delete):
  // show it in the list at once, the reload above then confirms it.
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
      const isNewOnFirstPage = !payload.deleted_at && page === 0 && statusFilter === "ALL" && !searchQuery.trim();
      if (!exists && !isNewOnFirstPage) return prev;

      let total = prev.total;
      if (!exists) total += 1;
      else if (payload.deleted_at) total = Math.max(0, total - 1);
      return { list: mergeBookingEvent(prev.list, payload).slice(0, rowsPerPage), total };
    });
  });

  // List the bookings API records (check-in / check-out stays) as they arrive.
  const unifiedGuests = useMemo(() => {
    const source = serverPage?.list || asRecordList(bookings);
    const records = source.length > 0 ? source : asRecordList(guests);
    const items = [];
    const seenIds = new Set();

    records.forEach((b) => {
      const id = String(b.id || b._id || b.booking_number || b.bookingNumber || "");
      if (!id || seenIds.has(id)) return;
      seenIds.add(id);

      const rawStatus = String(b.booking_status || b.status || "CONFIRMED").toUpperCase();
      const normalizedStatus =
        rawStatus === "IN-HOUSE" || rawStatus === "IN_HOUSE" ? "CHECKED_IN" : rawStatus;

      const sources = [b, b.booking, b.guest?.booking];
      const baseAmount = num(firstValue(sources, ["base_amount", "baseAmount", "room_amount", "roomAmount"]));
      const gstAmount = num(firstValue(sources, ["gst_amount", "gstAmount", "tax_amount", "taxAmount"]));
      const total = num(firstValue(sources, ["total_amount", "totalAmount", "grand_total", "grandTotal"])) || baseAmount + gstAmount;
      const paid = num(firstValue(sources, ["paid_amount", "paidAmount"]));
      const due = num(firstValue(sources, ["due_amount", "dueAmount"])) || Math.max(0, total - paid);
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
        phone: b.mobile_number || b.phone || b.mobile || b.guest?.phone || "",
        email: b.email || b.guest?.email || "",
        roomAssigned: roomLabelFor(b, rooms),
        roomType: roomType || "—",
        status: normalizedStatus,
        checkInDate: firstValue(sources, ["check_in_date", "checkInDate", "check_in", "checkIn"]),
        checkOutDate: firstValue(sources, ["check_out_date", "checkOutDate", "check_out", "checkOut"]),
        actualCheckIn: firstValue(sources, ["actual_check_in", "actualCheckIn"]),
        actualCheckOut: firstValue(sources, ["actual_check_out", "actualCheckOut"]),
        baseAmount,
        gstAmount,
        totalAmount: total,
        paidAmount: paid,
        dueAmount: due,
        createdAt: b.created_at || b.createdAt || b.check_in_date || b.checkInDate,
        raw: b,
      });
    });

    return items;
  }, [bookings, guests, rooms, serverPage]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
      });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (statusFilter !== "ALL") params.set("booking_status", statusFilter);
      try {
        const res = await apiRequest(`${API_ENDPOINTS.BOOKINGS.ALL}?${params.toString()}`, { forceRefresh: true });
        const list = Array.isArray(res?.data) ? res.data : [];
        const rawTotal = res?.data?.total ?? res?.data?.pagination?.total ?? res?.data?.pagination?.totalRecords;
        if (!cancelled && Number.isFinite(Number(rawTotal))) {
          setServerPage({ list, total: Number(rawTotal) });
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
  }, [page, rowsPerPage, searchQuery, statusFilter, liveTick]);

  useEffect(() => {
    const missing = unifiedGuests.filter((g) => {
      const known = bookingDetails[g.id];
      if (known) return false;
      return !g.actualCheckIn || !(g.baseAmount || g.gstAmount || g.totalAmount);
    });
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      const loaded = {};
      await Promise.all(
        missing.map(async (g) => {
          try {
            const endpoint =
              (typeof API_ENDPOINTS.BOOKINGS?.BY_ID === "function" && API_ENDPOINTS.BOOKINGS.BY_ID(g.id)) ||
              `${API_ENDPOINTS.BOOKINGS.ALL}/${g.id}`;
            const res = await apiRequest(endpoint, { forceRefresh: true });
            const detail = res?.data?.data || res?.data || res?.booking || null;
            if (detail && typeof detail === "object" && !Array.isArray(detail)) loaded[g.id] = detail;
          } catch {
            loaded[g.id] = {};
          }
        })
      );
      if (!cancelled) setBookingDetails((prev) => ({ ...prev, ...loaded }));
    })();

    return () => {
      cancelled = true;
    };
  }, [unifiedGuests, bookingDetails]);

  const withApiStay = (g) => {
    const d = bookingDetails[g.id];
    const sources = [d, g.raw, g];
    const checkIn = firstValue(sources, ["actual_check_in", "actualCheckIn", "check_in_date", "checkInDate", "check_in", "checkIn"]);
    const checkOut = firstValue(sources, ["actual_check_out", "actualCheckOut", "check_out_date", "checkOutDate", "check_out", "checkOut"]);
    const baseAmount = num(firstValue(sources, ["base_amount", "baseAmount", "room_amount", "roomAmount"]));
    const gstAmount = num(firstValue(sources, ["gst_amount", "gstAmount", "tax_amount", "taxAmount"]));
    const bookedPlusGst = baseAmount + gstAmount;
    const totalAmount = bookedPlusGst > 0 ? bookedPlusGst : num(firstValue(sources, ["total_amount", "totalAmount", "grand_total", "grandTotal", "totalAmount"]));
    const paidAmount = num(firstValue(sources, ["paid_amount", "paidAmount", "advance_paid", "advancePaid"])) || g.paidAmount || 0;
    const dueFromApi = firstValue(sources, ["due_amount", "dueAmount"]);
    const dueAmount = dueFromApi !== undefined && dueFromApi !== null && dueFromApi !== ""
      ? num(dueFromApi)
      : Math.max(0, totalAmount - paidAmount);
    return { ...g, checkIn, checkOut, baseAmount, gstAmount, totalAmount, paidAmount, dueAmount };
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
        if (paymentFilter === "PAID" && item.dueAmount > 0) return false;
        if (paymentFilter === "DUE" && item.dueAmount <= 0) return false;

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
    if (serverPage) return filteredGuests;
    const start = page * rowsPerPage;
    return filteredGuests.slice(start, start + rowsPerPage);
  }, [filteredGuests, page, rowsPerPage, serverPage]);

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
      await downloadBookingPdf(id, label);
      toast.show("Guest PDF ready", "success");
    } catch (err) {
      toast.show(err?.message || "Could not download the guest PDF", "error");
    } finally {
      setPdfGuestId("");
    }
  };

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 4 } }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
          border: `1px solid ${themeConfig.border}`,
          boxShadow: isDarkMode ? "none" : "0 1px 2px rgba(15, 23, 42, 0.04)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: { xs: 2, sm: 2.5 },
            py: 2,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.5,
            borderBottom: `1px solid ${themeConfig.border}`,
          }}
        >
          <TextField
            size="small"
            placeholder="Search by name, phone, room, or booking"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            sx={{
              flex: { xs: "1 1 100%", sm: "1 1 280px" },
              maxWidth: { sm: 360 },
              "& .MuiOutlinedInput-root": { height: 40, borderRadius: "10px", bgcolor: themeConfig.bgMain },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" sx={{ color: themeConfig.textMuted }} />
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
            sx={{ width: { xs: "100%", sm: 210 }, "& .MuiOutlinedInput-root": { height: 40, borderRadius: "10px", bgcolor: themeConfig.bgMain } }}
          >
            <MenuItem value="ALL">All statuses ({unifiedGuests.length})</MenuItem>
            <MenuItem value="CHECKED_IN">In-house ({unifiedGuests.filter((g) => g.status === "CHECKED_IN").length})</MenuItem>
            <MenuItem value="CHECKED_OUT">Checked out ({unifiedGuests.filter((g) => g.status === "CHECKED_OUT" || g.status === "DEPARTED").length})</MenuItem>
            <MenuItem value="CONFIRMED">Upcoming ({unifiedGuests.filter((g) => g.status === "CONFIRMED" || g.status === "PENDING" || g.status === "BOOKED").length})</MenuItem>
            <MenuItem value="CANCELLED">Cancelled ({unifiedGuests.filter((g) => g.status === "CANCELLED").length})</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: "100%", sm: 180 }, "& .MuiOutlinedInput-root": { height: 40, borderRadius: "10px", bgcolor: themeConfig.bgMain } }}
          >
            <MenuItem value="ALL">All payments</MenuItem>
            <MenuItem value="PAID">Fully settled</MenuItem>
            <MenuItem value="DUE">Balance pending</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            sx={{ width: { xs: "100%", sm: 180 }, "& .MuiOutlinedInput-root": { height: 40, borderRadius: "10px", bgcolor: themeConfig.bgMain } }}
          >
            <MenuItem value="NEWEST">Newest stay</MenuItem>
            <MenuItem value="OLDEST">Oldest stay</MenuItem>
            <MenuItem value="NAME_ASC">Name (A-Z)</MenuItem>
            <MenuItem value="AMOUNT_DESC">Highest tariff</MenuItem>
            <MenuItem value="DUE_DESC">Highest due</MenuItem>
          </TextField>
        </Box>

        {filteredGuests.length === 0 ? (
          <EmptyState
            embedded
            title="No guests"
            description="No guest records match this search."
          />
        ) : (
          <>
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 980 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#F0FDFA" }}>
                  {["Guest", "Room", "Check-In", "Check-Out", "Billing", "Stay Status"].map((heading) => (
                    <TableCell key={heading}>{heading}</TableCell>
                  ))}
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
                    <TableCell sx={{ py: 1.75 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 180 }}>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            fontWeight: 800,
                            bgcolor: themeConfig.primary,
                            color: "#FFFFFF",
                            fontSize: "0.95rem",
                            flexShrink: 0,
                          }}
                        >
                          {g.guestName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "0.92rem", lineHeight: 1.2 }}>
                            {g.guestName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", fontWeight: 600 }}>
                            {g.phone || "No contact"}
                          </Typography>
                          {g.bookingNumber ? (
                            <Typography variant="caption" sx={{ color: themeConfig.primary, display: "block", fontWeight: 700 }}>
                              {g.bookingNumber}
                            </Typography>
                          ) : null}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ py: 1.75, whiteSpace: "nowrap" }}>
                      <Typography sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "0.9rem" }}>
                        Room {g.roomAssigned}
                      </Typography>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 600 }}>
                        {g.roomType}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ py: 1.75, whiteSpace: "nowrap" }}>
                      <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.88rem" }}>
                        {formatDateTime(g.checkIn)}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ py: 1.75, whiteSpace: "nowrap" }}>
                      <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.88rem" }}>
                        {formatDateTime(g.checkOut)}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ py: 1.75, whiteSpace: "nowrap" }}>
                      <Typography sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "0.92rem" }}>
                        {formatCurrency(g.totalAmount)}
                      </Typography>
                      {(g.baseAmount > 0 || g.gstAmount > 0) && (
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", fontWeight: 600 }}>
                          {formatCurrency(g.baseAmount)} + GST {formatCurrency(g.gstAmount)}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ color: g.dueAmount > 0 ? "#DC2626" : "#059669", fontWeight: 800, display: "block" }}>
                        {g.dueAmount > 0 ? `Due ${formatCurrency(g.dueAmount)}` : "Fully Paid"}
                      </Typography>
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

                        <Tooltip title={pdfGuestId === String(g.id) ? "Preparing PDF" : "Guest PDF"}>
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
                        <Tooltip title="Details">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedGuest(g)}
                            sx={{
                              border: `1px solid ${themeConfig.border}`,
                              borderRadius: "8px",
                              color: themeConfig.textMain,
                              "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary },
                            }}
                          >
                            <ArrowForward fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={serverPage ? serverPage.total : filteredGuests.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              borderTop: `1px solid ${themeConfig.border}`,
              color: themeConfig.textMuted,
            }}
          />
          </>
        )}
      </Paper>

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
