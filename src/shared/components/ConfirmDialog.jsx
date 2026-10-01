"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  TextField,
  Box,
} from "@mui/material";
import { WarningAmber } from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";

export default function ConfirmDialog({
  open,
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this operation?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = false,
  requireReason = false,
  reasonValue = "",
  onReasonChange,
  reasonPlaceholder = "Please state the reason for this action...",
  loading = false,
  onConfirm,
  onClose,
}) {
  const { themeConfig } = useAppTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "20px",
            p: 1.5,
            bgcolor: themeConfig.bgCard,
            border: `1px solid ${themeConfig.border}`,
            boxShadow: "0 24px 48px -12px rgba(12, 39, 59, 0.22), 0 12px 24px -8px rgba(12, 39, 59, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.95)",
            maxWidth: 480,
            width: "100%",
          },
        },
      }}
    >
      <DialogTitle component="div" sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
        {isDanger && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: themeConfig.dangerBg,
              color: themeConfig.danger,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(220, 38, 38, 0.15)",
            }}
          >
            <WarningAmber sx={{ fontSize: 20 }} />
          </Box>
        )}
        <Typography component="div" variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "1.05rem" }}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" sx={{ color: themeConfig.textMuted, mb: requireReason ? 2 : 0 }}>
          {message}
        </Typography>

        {requireReason && (
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder={reasonPlaceholder}
            value={reasonValue}
            onChange={(e) => onReasonChange && onReasonChange(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: themeConfig.bgMain,
              },
            }}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} sx={{ color: themeConfig.textMuted, borderRadius: "10px" }}>
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          disabled={loading || (requireReason && !reasonValue?.trim())}
          onClick={onConfirm}
          sx={{
            background: isDanger
              ? `linear-gradient(135deg, ${themeConfig.danger} 0%, #B91C1C 100%)`
              : `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
            borderRadius: "12px",
            fontWeight: 700,
            boxShadow: isDanger
              ? "0 4px 14px rgba(220, 38, 38, 0.3)"
              : `0 4px 14px ${themeConfig.primaryGlow}`,
            "&:hover": {
              background: isDanger ? "#991B1B" : themeConfig.primaryDark,
              transform: "translateY(-1px)",
            },
          }}
        >
          {loading ? "Processing..." : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
