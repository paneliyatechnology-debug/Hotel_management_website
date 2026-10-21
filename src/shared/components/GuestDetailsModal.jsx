"use client";

import { Dialog, DialogContent } from "@mui/material";
import GuestDetailPage from "@/hotel-admin/pages/GuestDetailPage";

/**
 * Same guest detail screen everywhere, opened as a popup.
 */
export default function GuestDetailsModal({
  open = false,
  onClose,
  guestId,
  guestData = null,
  hotelSettings = null,
  onRefresh,
}) {
  const resolvedGuest = guestData?.raw || guestData || null;
  const resolvedId =
    guestId ||
    resolvedGuest?._id ||
    resolvedGuest?.id ||
    resolvedGuest?.bookingId ||
    resolvedGuest?.booking_id ||
    null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      scroll="paper"
      slotProps={{
        paper: {
          sx: {
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            maxHeight: "calc(100dvh - 24px)",
            m: "12px",
            width: "calc(100% - 24px)",
            borderRadius: "16px",
            "&.MuiDialog-paperScrollPaper": {
              maxHeight: "calc(100dvh - 24px)",
              overflow: "hidden",
            },
          },
        },
      }}
    >
      <DialogContent sx={{ flex: "1 1 auto", minHeight: 0, p: { xs: 1.5, sm: 2 }, overflowY: "auto", bgcolor: "#F4FBFA" }}>
        {open ? (
          <GuestDetailPage
            guest={resolvedGuest}
            guestId={resolvedId}
            hotelSettings={hotelSettings || {}}
            embedded
            onBack={onClose}
            onRefresh={onRefresh}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
