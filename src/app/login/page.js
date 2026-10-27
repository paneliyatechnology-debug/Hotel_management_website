"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppThemeProvider } from "@/shared/context/ThemeContext";
import { SocketProvider } from "@/shared/context/SocketContext";
import UnifiedLogin from "@/auth/components/UnifiedLogin";
import { clearAuthCookies, getCookie } from "@/shared/utils/cookieAuth";
import { getHomePath, isKnownRole, sanitizeRedirectPath } from "@/shared/utils/roleRoutes";

// Where to send a signed-in user: the page they were heading to (?redirect=...) or their role's home
function getPostLoginPath(role) {
  let requested = null;
  try {
    requested = sanitizeRedirectPath(new URLSearchParams(window.location.search).get("redirect"));
  } catch {}
  // The dashboard rewrites the URL to the user's own role base path if the request doesn't match it
  return requested || getHomePath(role);
}

function readStoredSession() {
  try {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token") || getCookie("accessToken") || getCookie("token");
    const user = stored ? JSON.parse(stored) : getCookie("user");
    return token && user && isKnownRole(user.role) ? user : null;
  } catch {
    return null;
  }
}

function HotelLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered") === "true";
  const initialEmail = searchParams.get("email") || "";

  return (
    <UnifiedLogin
      initialEmail={initialEmail}
      registrationSuccess={isRegistered}
      onLoginSuccess={(user) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(user));
        }
        router.replace(getPostLoginPath(user.role));
      }}
    />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // If arriving immediately after hotel registration, ensure fresh login state
    const params = new URLSearchParams(window.location.search);
    const isRegistered = params.get("registered") === "true";
    if (isRegistered) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        clearAuthCookies();
      } catch {}
      setMounted(true);
      return;
    }

    // Already signed in -> skip the login form and go straight to the dashboard
    const session = readStoredSession();
    if (session) {
      router.replace(getPostLoginPath(session.role));
      return;
    }
    setMounted(true);
  }, [router]);

  if (!mounted) return null;

  return (
    <AppThemeProvider>
      <SocketProvider>
        <Suspense fallback={null}>
          <HotelLoginContent />
        </Suspense>
      </SocketProvider>
    </AppThemeProvider>
  );
}
