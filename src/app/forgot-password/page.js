"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { KeyRound, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { API_ENDPOINTS, apiRequest } from "@/config/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiRequest(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: "POST",
        body: { email },
      });
      setSent(true);
    } catch (err) {
      console.warn("Forgot password attempt completed:", err.message);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1F1C] text-[#E2E8F0] font-sans selection:bg-[#0F766E] selection:text-white flex flex-col justify-between">
      <Navbar />

      <section className="relative py-16 flex-grow flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 w-full">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#DDE8E6] p-8 text-[#0F172A]">
            <div className="w-12 h-12 rounded-2xl bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h1 className="text-2xl font-serif font-bold text-center text-[#0F172A]">
              Forgot Your Password?
            </h1>
            <p className="text-xs text-[#64748B] text-center mt-1 mb-6">
              Enter your registered email address and we'll send you a password reset link.
            </p>

            {sent ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-10 h-10 text-[#0F766E] mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#0F172A]">Reset link sent to {email}!</p>
                <p className="text-[11px] text-[#64748B] mt-1">Please check your inbox or spam folder.</p>
                <Link
                  href="/login"
                  className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE8E6] text-xs focus:ring-2 focus:ring-[#0F766E] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs transition-all shadow-md shadow-[#0F766E]/20 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                </button>

                <div className="text-center pt-2">
                  <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0F766E]">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
