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
  CircularProgress,
} from "@mui/material";
import {
  Refresh,
  CheckCircle,
  Create,
  TextFields,
  Draw,
  QrCode2,
  Smartphone,
  ContentCopy,
  OpenInNew,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { useSocket } from "@/shared/context/SocketContext";
import { QRCodeSVG } from "qrcode.react";
import SignaturePad from "@/shared/components/SignaturePad";

/**
 * Clean & Modern Digital E-Signature Pad
 * Supports:
 * 1. Real-time Mobile Phone Signature via Instant QR Code Scan (Default)
 * 2. Screen / Mouse Drawing (Desktop / Tablet)
 * 3. Typed Cursive Signature
 */
export default function DigitalSignaturePad({
  title = "Guest Signature",
  signerName = "",
  signerRole = "Guest",
  value = null,
  onChange,
  themeConfig: propThemeConfig,
  required = false,
}) {
  const { themeConfig: appThemeConfig, isDarkMode } = useAppTheme();
  const themeConfig = propThemeConfig || appThemeConfig;
  const { socket } = useSocket();

  const sigPadRef = useRef(null);
  const [hasSignature, setHasSignature] = useState(Boolean(value));
  const [mode, setMode] = useState("QR_MOBILE"); // 'QR_MOBILE' | 'DRAW' | 'TYPE'
  const [typedName, setTypedName] = useState(signerName || "");

  // Update signature status when value prop updates
  useEffect(() => {
    setHasSignature(Boolean(value));
  }, [value]);

  // Mobile QR Code Sync state
  const [sessionId, setSessionId] = useState("");
  const [networkHost, setNetworkHost] = useState("");
  const [isPollingMobile, setIsPollingMobile] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Generate unique session ID for mobile signing
  const generateNewSession = useCallback(() => {
    const newId = `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setSessionId(newId);
    return newId;
  }, []);

  // Detect true network host (LAN IP for mobile phone on same Wi-Fi, or live domain)
  useEffect(() => {
    generateNewSession();

    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host !== "localhost" && host !== "127.0.0.1" && host !== "") {
        setNetworkHost(window.location.origin);
      } else {
        // Fetch local LAN IPv4 address from API for mobile phone access
        fetch("/api/signature-sync?action=network-info")
          .then((res) => res.json())
          .then((data) => {
            if (data?.fullUrl) {
              setNetworkHost(data.fullUrl);
            } else if (data?.localIp) {
              setNetworkHost(`http://${data.localIp}:${window.location.port || 3001}`);
            } else {
              setNetworkHost(window.location.origin);
            }
          })
          .catch(() => {
            setNetworkHost(window.location.origin);
          });
      }
    }
  }, [generateNewSession]);

  // Join signature room on Socket.IO
  useEffect(() => {
    if (!socket || !sessionId) return;
    socket.emit("join_signature_session", { sessionId });
  }, [socket, sessionId]);

  // Dual Real-Time Sync: Socket.IO Instant Broadcast + Fast HTTP Polling Fallback
  useEffect(() => {
    if (!sessionId || hasSignature) return;

    let isMounted = true;
    setIsPollingMobile(true);

    const handleSignatureSubmitted = (e) => {
      const data = e.detail || e;
      if (data && data.sessionId === sessionId && data.signature) {
        if (isMounted) {
          setIsPollingMobile(false);
          setHasSignature(true);
          if (onChange) {
            onChange(data.signature);
          }
        }
      }
    };

    // 1. Listen on window custom event dispatched by SocketContext
    window.addEventListener("socket:SIGNATURE_SUBMITTED", handleSignatureSubmitted);

    // 2. Also listen directly on socket instance if connected
    if (socket) {
      socket.on("SIGNATURE_SUBMITTED", handleSignatureSubmitted);
    }

    // 3. Fast Polling interval (every 1.5s) to guarantee phone submission gets synced instantly
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/signature-sync?session=${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data?.status === "SIGNED" && data?.signature) {
          setIsPollingMobile(false);
          setHasSignature(true);
          if (onChange) {
            onChange(data.signature);
          }
        }
      } catch (err) {
        // Silent catch for network polling
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener("socket:SIGNATURE_SUBMITTED", handleSignatureSubmitted);
      if (socket) {
        socket.off("SIGNATURE_SUBMITTED", handleSignatureSubmitted);
      }
    };
  }, [socket, sessionId, hasSignature, onChange]);

  const mobileSignUrl = `${networkHost || (typeof window !== "undefined" ? window.location.origin : "")}/mobile-sign?session=${sessionId}&name=${encodeURIComponent(
    signerName || "Guest"
  )}`;

  const handleClear = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
    setHasSignature(false);
    setTypedName("");
    generateNewSession();
    if (onChange) {
      onChange(null);
    }
  };

  const handleTypedChange = (e) => {
    const text = e.target.value;
    setTypedName(text);
    if (text.trim()) {
      setHasSignature(true);
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
      if (onChange) onChange(dataUrl);
    } else {
      setHasSignature(false);
      if (onChange) onChange(null);
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(mobileSignUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2.2 },
        borderRadius: "16px",
        border: `1.5px solid ${hasSignature ? "#10B981" : themeConfig.border || "#E2E8F0"}`,
        bgcolor: themeConfig.bgCard || (isDarkMode ? "#162032" : "#FFFFFF"),
        boxShadow: hasSignature
          ? "0 4px 14px rgba(16, 185, 129, 0.12)"
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
              bgcolor: hasSignature ? "rgba(16, 185, 129, 0.12)" : "rgba(197, 160, 89, 0.14)",
              color: hasSignature ? "#059669" : themeConfig.primary || "#C5A059",
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
                color: themeConfig.textMain || "#0F172A",
                lineHeight: 1.25,
                fontSize: { xs: "0.82rem", sm: "0.9rem" },
                wordBreak: "break-word",
              }}
            >
              {title}
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
            ) : (
              <Create style={{ fontSize: 13, color: "#D97706" }} />
            )
          }
          label={hasSignature ? "Signed" : "Pending"}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: "0.68rem",
            height: 24,
            flexShrink: 0,
            bgcolor: hasSignature ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
            color: hasSignature ? "#059669" : "#B45309",
            border: `1px solid ${hasSignature ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
          }}
        />
      </Box>

      {/* Mode Switch: Mobile QR (Default) vs Draw vs Type */}
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
            value="QR_MOBILE"
            icon={<Smartphone sx={{ fontSize: 14 }} />}
            iconPosition="start"
            label="📱 Phone QR"
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

      {/* MODE 1: QR CODE MOBILE SIGNATURE (DEFAULT) */}
      {mode === "QR_MOBILE" && (
        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            borderRadius: "14px",
            bgcolor: isDarkMode ? "#0B1120" : "#F8FAFC",
            border: `1.5px dashed ${hasSignature ? "#10B981" : "#CBD5E1"}`,
            textAlign: "center",
          }}
        >
          {hasSignature ? (
            <Box sx={{ py: 2 }}>
              <CheckCircle sx={{ fontSize: 48, color: "#10B981", mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#065F46" }}>
                ✅ Signature Received from Mobile!
              </Typography>
              <Typography variant="caption" sx={{ color: "#059669", fontWeight: 700, display: "block", mt: 0.5 }}>
                Signature has been successfully saved from mobile device.
              </Typography>
              {value && (
                <Box
                  sx={{
                    mt: 2,
                    p: 1,
                    bgcolor: "#FFF",
                    borderRadius: "10px",
                    border: "1px solid #E2E8F0",
                    display: "inline-block",
                    maxWidth: 280,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={value} alt="Signature Preview" style={{ width: "100%", maxHeight: 100, objectFit: "contain" }} />
                </Box>
              )}
            </Box>
          ) : (
            <Box>
              {/* Instructions Banner */}
              <Box
                sx={{
                  p: 1.2,
                  mb: 2,
                  borderRadius: "10px",
                  bgcolor: isDarkMode ? "rgba(56, 189, 248, 0.1)" : "rgba(197, 160, 89, 0.12)",
                  border: "1px solid rgba(197, 160, 89, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                <Smartphone sx={{ fontSize: 20, color: themeConfig.primary || "#C5A059" }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: "0.78rem", sm: "0.85rem" },
                    color: themeConfig.textMain || "#0F172A",
                  }}
                >
                  Scan QR code with your phone camera to sign ✍️
                </Typography>
              </Box>

              {/* QR Code and Live Status Area */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2.5,
                  my: 1.5,
                }}
              >
                {/* QR Box */}
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: "#FFFFFF",
                    borderRadius: "14px",
                    border: "2px solid #E2E8F0",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <QRCodeSVG
                    value={mobileSignUrl}
                    size={140}
                    level="M"
                    includeMargin={false}
                    fgColor="#0F172A"
                  />
                  <Typography variant="caption" sx={{ mt: 1, fontWeight: 800, color: "#64748B", fontSize: "0.65rem" }}>
                    Scan with Mobile Camera
                  </Typography>
                </Box>

                {/* Steps and Live Sync Status */}
                <Box sx={{ textAlign: "left", maxWidth: 300 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain || "#0F172A", mb: 0.8 }}>
                    3 Easy Steps:
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", color: "#475569", fontWeight: 700, mb: 0.5 }}>
                    1️⃣ Point your phone camera at this QR code
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", color: "#475569", fontWeight: 700, mb: 0.5 }}>
                    2️⃣ Sign on your phone screen and tap Save
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", color: "#475569", fontWeight: 700, mb: 1.5 }}>
                    3️⃣ Signature will automatically sync here!
                  </Typography>

                  {/* Live Status indicator */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1,
                      borderRadius: "8px",
                      bgcolor: isPollingMobile ? "rgba(59, 130, 246, 0.08)" : "rgba(100, 116, 139, 0.08)",
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                    }}
                  >
                    {isPollingMobile ? (
                      <CircularProgress size={14} sx={{ color: "#3B82F6" }} />
                    ) : (
                      <QrCode2 sx={{ fontSize: 16, color: "#64748B" }} />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        color: isPollingMobile ? "#1D4ED8" : "#475569",
                        fontSize: "0.7rem",
                      }}
                    >
                      {isPollingMobile ? "Waiting for mobile signature..." : "Ready to scan"}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Action Buttons: Copy Link & Refresh */}
              <Box sx={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap", mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopy sx={{ fontSize: 13 }} />}
                  onClick={handleCopyLink}
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    textTransform: "none",
                    borderRadius: "8px",
                  }}
                >
                  {copiedLink ? "Link Copied! ✅" : "Copy Mobile Link"}
                </Button>

                <Button
                  size="small"
                  variant="text"
                  startIcon={<Refresh sx={{ fontSize: 13 }} />}
                  onClick={generateNewSession}
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    textTransform: "none",
                    color: "#64748B",
                  }}
                >
                  New QR Code
                </Button>

                <Button
                  size="small"
                  variant="text"
                  startIcon={<OpenInNew sx={{ fontSize: 13 }} />}
                  onClick={() => window.open(mobileSignUrl, "_blank")}
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    textTransform: "none",
                    color: "#64748B",
                  }}
                >
                  Open in Browser
                </Button>
              </Box>
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
              setHasSignature(signed);
              if (signed && onChange) {
                onChange(dataUrl || sigPadRef.current?.toDataURL());
              } else if (!signed && onChange) {
                onChange(null);
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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
        <Typography
          variant="caption"
          sx={{ color: themeConfig.textMuted || "#94A3B8", fontSize: "0.65rem", fontWeight: 700 }}
        >
          🔒 Legally binding digital acknowledgement • Mobile & Touch Supported
        </Typography>
      </Box>
    </Paper>
  );
}
