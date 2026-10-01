"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppThemeProvider } from "@/shared/context/ThemeContext";
import { SocketProvider } from "@/shared/context/SocketContext";
import UnifiedLogin from "@/auth/components/UnifiedLogin";

function HotelLoginContent() {
  const router = useRouter();

  return (
    <UnifiedLogin
      onLoginSuccess={(user) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(user));
        }
        if (user.role === "HOTEL_ADMIN" || user.role === "RECEPTIONIST" || user.role === "STAFF") {
          router.push("/app");
        } else {
          router.push("/app");
        }
      }}
    />
  );
}

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AppThemeProvider>
      <SocketProvider>
        <HotelLoginContent />
      </SocketProvider>
    </AppThemeProvider>
  );
}
