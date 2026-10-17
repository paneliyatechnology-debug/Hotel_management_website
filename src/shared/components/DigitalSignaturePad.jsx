"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  TextField,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Refresh,
  CheckCircle,
  Create,
  TextFields,
  Draw,
  CloudUpload,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import SignaturePad from "@/shared/components/SignaturePad";

/**
 * Clean & Modern Digital E-Signature Pad
 * Supports:
 * 1. Upload a signature image
 * 2. Screen / Mouse Drawing
 * 3. Typed Cursive Signature
 */
export default function DigitalSignaturePad({
  title = "Guest Signature",
  signerName = "",
  signerRole = "Guest",
  value = null,
  signature = null,
  onChange,
  onSave,
  onClear,
  themeConfig: propThemeConfig,
  required = false,
  error = false,
  helperText = "",
}) {
  const { themeConfig: appThemeConfig, isDarkMode } = useAppTheme();
  const themeConfig = propThemeConfig || appThemeConfig;

  const activeSig = value || signature || null;
  const sigPadRef = useRef(null);
  const fileInputRef = useRef(null);
  const [hasSignature, setHasSignature] = useState(Boolean(activeSig));
  const [mode, setMode] = useState("UPLOAD");
  const [typedName, setTypedName] = useState(signerName || "");
  const [uploadError, setUploadError] = useState("");

  // Update signature status when activeSig prop updates
  useEffect(() => {
    setHasSignature(Boolean(activeSig));
  }, [activeSig]);

  const handleSignatureUpdate = useCallback((dataUrl) => {
    setHasSignature(Boolean(dataUrl));
    if (onChange) onChange(dataUrl);
    if (onSave) onSave(dataUrl);
  }, [onChange, onSave]);

  const handleClear = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setHasSignature(false);
    setTypedName("");
    setUploadError("");
    if (onChange) onChange(null);
    if (onSave) onSave(null);
    if (onClear) onClear();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5 MB.");
      return;
    }
    setUploadError("");
    const reader = new FileReader();
    reader.onload = () => {
      handleSignatureUpdate(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const handleTypedChange = (e) => {
    const text = e.target.value;
    setTypedName(text);
    if (text.trim()) {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 140;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, 400, 140);
      ctx.font = "italic 36px 'Brush Script MT', 'Caveat', 'Dancing Script', cursive, sans-serif";
      ctx.fillStyle = "#0F172A";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 200, 70);

      const dataUrl = canvas.toDataURL("image/png");
      handleSignatureUpdate(dataUrl);
    } else {
      handleSignatureUpdate(null);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2.2 },
        borderRadius: "16px",
        border: `1.5px solid ${hasSignature ? "#10B981" : error ? "#EF4444" : themeConfig.border || "#E2E8F0"}`,
        bgcolor: error && !hasSignature 
          ? (isDarkMode ? "rgba(239, 68, 68, 0.08)" : "rgba(239, 68, 68, 0.03)") 
          : (themeConfig.bgCard || (isDarkMode ? "#162032" : "#FFFFFF")),
        boxShadow: hasSignature
          ? "0 4px 14px rgba(16, 185, 129, 0.12)"
          : error
            ? "0 0 0 3px rgba(239, 68, 68, 0.15)"
            : isDarkMode
              ? "0 4px 14px rgba(0,0,0,0.3)"
              : "0 2px 8px rgba(0,0,0,0.03)",
        transition: "all 0.2s ease",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 1,
          mb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              p: 0.8,
              borderRadius: "10px",
              bgcolor: hasSignature ? "rgba(16, 185, 129, 0.12)" : error ? "rgba(239, 68, 68, 0.15)" : "rgba(197, 160, 89, 0.14)",
              color: hasSignature ? "#059669" : error ? "#EF4444" : themeConfig.primary || "#C5A059",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Draw sx={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 900,
                color: error && !hasSignature ? "#EF4444" : (themeConfig.textMain || "#0F172A"),
                lineHeight: 1.25,
                fontSize: { xs: "0.82rem", sm: "0.9rem" },
                wordBreak: "break-word",
              }}
            >
              {title} {required && <span style={{ color: "#EF4444" }}>*</span>}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: themeConfig.textMuted || "#64748B",
                fontWeight: 700,
                display: "block",
                fontSize: { xs: "0.68rem", sm: "0.72rem" },
                noWrap: true,
              }}
            >
              {signerName ? `${signerName} • ${signerRole}` : signerRole}
            </Typography>
          </Box>
        </Box>

        <Chip
          icon={
            hasSignature ? (
              <CheckCircle style={{ fontSize: 13, color: "#059669" }} />
            ) : error ? (
              <Create style={{ fontSize: 13, color: "#DC2626" }} />
            ) : (
              <Create style={{ fontSize: 13, color: "#D97706" }} />
            )
          }
          label={hasSignature ? "Signed" : error ? "Signature Required *" : required ? "Required *" : "Pending"}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: "0.68rem",
            height: 24,
            flexShrink: 0,
            bgcolor: hasSignature 
              ? "rgba(16, 185, 129, 0.12)" 
              : error 
                ? "rgba(239, 68, 68, 0.14)" 
                : "rgba(245, 158, 11, 0.12)",
            color: hasSignature 
              ? "#059669" 
              : error 
                ? "#DC2626" 
                : "#B45309",
            border: `1px solid ${hasSignature ? "rgba(16, 185, 129, 0.3)" : error ? "rgba(239, 68, 68, 0.35)" : "rgba(245, 158, 11, 0.3)"}`,
          }}
        />
      </Box>

      {/* Mode Switch: Upload Image, Draw, or Type */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          mb: 1.2,
        }}
      >
        <Tabs
          value={mode}
          onChange={(_, val) => setMode(val)}
          sx={{
            minHeight: 32,
            "& .MuiTab-root": {
              minHeight: 32,
              py: 0.3,
              px: { xs: 1, sm: 1.5 },
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
              fontWeight: 800,
              textTransform: "none",
              borderRadius: "8px",
            },
          }}
        >
          <Tab
            value="UPLOAD"
            icon={<CloudUpload sx={{ fontSize: 14 }} />}
            iconPosition="start"
            label="Upload Image"
          />
          <Tab
            value="DRAW"
            icon={<Create sx={{ fontSize: 14 }} />}
            iconPosition="start"
            label="Screen Draw"
          />
          <Tab
            value="TYPE"
            icon={<TextFields sx={{ fontSize: 14 }} />}
            iconPosition="start"
            label="Type"
          />
        </Tabs>

        {hasSignature && (
          <Button
            size="small"
            startIcon={<Refresh sx={{ fontSize: 13 }} />}
            onClick={handleClear}
            sx={{
              fontSize: "0.72rem",
              fontWeight: 800,
              color: "#EF4444",
              textTransform: "none",
              px: 1,
              py: 0.3,
              borderRadius: "6px",
              bgcolor: "rgba(239, 68, 68, 0.06)",
              "&:hover": { bgcolor: "rgba(239, 68, 68, 0.15)" },
            }}
          >
            Clear
          </Button>
        )}
      </Box>

      {mode === "UPLOAD" && (
        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            borderRadius: "14px",
            bgcolor: isDarkMode ? "#0B1120" : "#F8FAFC",
            border: `1.5px dashed ${hasSignature ? "#10B981" : "#CBD5E1"}`,
            textAlign: "center",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageUpload}
          />
          {activeSig ? (
            <Box sx={{ py: 1 }}>
              <Box
                sx={{
                  mt: 0.5,
                  p: 1,
                  bgcolor: "#FFF",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                  display: "inline-block",
                  maxWidth: 320,
                }}
              >
                <img
                  src={activeSig}
                  alt="Uploaded signature"
                  style={{ width: "100%", maxHeight: 140, objectFit: "contain" }}
                />
              </Box>
              <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#059669", fontWeight: 800 }}>
                Signature image uploaded
              </Typography>
            </Box>
          ) : (
            <Box sx={{ py: 2 }}>
              <CloudUpload sx={{ fontSize: 36, color: themeConfig.primary || "#C5A059", mb: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 800, mb: 1.2, color: themeConfig.textMain }}>
                Upload a signature image
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                }}
              >
                Choose Image
              </Button>
              {uploadError && (
                <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#DC2626", fontWeight: 700 }}>
                  {uploadError}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* MODE 2: DIRECT DRAW CANVAS AREA */}
      {mode === "DRAW" && (
        <Box sx={{ mt: 1 }}>
          <SignaturePad
            ref={sigPadRef}
            height={180}
            color={isDarkMode ? "#38BDF8" : themeConfig.textMain || "#0F172A"}
            placeholder="Sign here using touchscreen or mouse"
            onSignChange={(signed, dataUrl) => {
              if (signed) {
                const imgUrl = dataUrl || sigPadRef.current?.toDataURL();
                handleSignatureUpdate(imgUrl);
              } else {
                handleSignatureUpdate(null);
              }
            }}
          />
        </Box>
      )}

      {/* MODE 3: TYPED NAME IN CURSIVE STYLE */}
      {mode === "TYPE" && (
        <Box sx={{ mt: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type your full name"
            value={typedName}
            onChange={handleTypedChange}
            sx={{
              mb: 1,
              "& input": {
                fontWeight: 800,
                fontSize: "0.85rem",
              },
            }}
          />
          {typedName && (
            <Box
              sx={{
                p: 2,
                borderRadius: "12px",
                bgcolor: isDarkMode ? "#0B1120" : "#F8FAFC",
                border: "1.5px dashed #CBD5E1",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'Brush Script MT', 'Caveat', 'Dancing Script', cursive, sans-serif",
                  fontSize: { xs: "1.5rem", sm: "1.8rem" },
                  color: isDarkMode ? "#38BDF8" : "#0F172A",
                  lineHeight: 1.2,
                }}
              >
                {typedName}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#64748B", fontSize: "0.65rem", fontWeight: 700, mt: 0.5, display: "block" }}
              >
                Generated Electronic E-Signature
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Footer info */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1, flexWrap: "wrap", gap: 0.5 }}>
        <Typography
          variant="caption"
          sx={{ color: themeConfig.textMuted || "#94A3B8", fontSize: "0.65rem", fontWeight: 700 }}
        >
          🔒 Legally binding digital acknowledgement • Mobile & Touch Supported
        </Typography>

        {error && !hasSignature && (
          <Typography
            variant="caption"
            sx={{
              color: "#EF4444",
              fontWeight: 800,
              fontSize: "0.72rem",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            ⚠️ {helperText || "Guest digital signature is required before proceeding."}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
