"use client";

import {
  Dialog,
  DialogActions,
  Typography,
  Button,
  TextField,
  Box,
  IconButton,
} from "@mui/material";
import { Close, WarningAmber } from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";

export default function ConfirmDialog({
  open,
  section = "Confirmation",
  title = "Confirm action",
  message = "Review the details below before you continue.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = false,
  requireReason = false,
  reasonValue = "",
  onReasonChange,
  reasonPlaceholder = "Add a reason",
  loading = false,
  onConfirm,
  onClose,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const accent = isDanger ? themeConfig.danger || "#DC2626" : themeConfig.primary;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: "16px",
            bgcolor: themeConfig.bgCard || "#FFFFFF",
            border: `1px solid ${themeConfig.border}`,
            boxShadow: isDarkMode ? "0 24px 48px rgba(0,0,0,0.45)" : "0 24px 48px rgba(15, 23, 42, 0.16)",
            overflow: "hidden",
          },
        },
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          color: "#FFFFFF",
          background: `linear-gradient(135deg, ${themeConfig.primaryDark || "#0C273B"} 0%, ${themeConfig.primary || "#0B8EE0"} 100%)`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              bgcolor: "rgba(255,255,255,0.16)",
            }}
          >
            <WarningAmber sx={{ fontSize: 22 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>
              {section}
            </Typography>
            <Typography sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "1.05rem", lineHeight: 1.3 }} noWrap>
              {title}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          disabled={loading}
          aria-label="Close"
          sx={{ color: "#FFFFFF", bgcolor: "rgba(255,255,255,0.16)", "&:hover": { bgcolor: "rgba(255,255,255,0.28)" } }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, py: 2.75 }}>
        <Typography sx={{ color: themeConfig.textMain, fontSize: "0.95rem", lineHeight: 1.6 }}>
          {message}
        </Typography>
        {requireReason && (
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Reason"
            placeholder={reasonPlaceholder}
            value={reasonValue}
            onChange={(e) => onReasonChange && onReasonChange(e.target.value)}
            sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
        )}
      </Box>

      <DialogActions
        sx={{
          px: 2.5,
          py: 1.75,
          gap: 1,
          borderTop: `1px solid ${themeConfig.border}`,
          bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{
            minWidth: 104,
            height: 40,
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 700,
            color: themeConfig.textMain,
            borderColor: themeConfig.border,
          }}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          disabled={loading || (requireReason && !reasonValue?.trim())}
          onClick={onConfirm}
          sx={{
            minWidth: 104,
            height: 40,
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 700,
            boxShadow: "none",
            bgcolor: accent,
            "&:hover": { bgcolor: isDanger ? "#B91C1C" : themeConfig.primaryDark, boxShadow: "none" },
          }}
        >
          {loading ? "Please wait…" : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
