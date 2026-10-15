"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { KeyRound, CheckCircle2, ArrowLeft, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { API_ENDPOINTS, apiRequest } from "@/config/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your registered email address.");
      setLoading(false);
      return;
    }

    try {
      const res = await apiRequest(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: "POST",
        body: { email: cleanEmail },
      });
      const msg = res?.message || "A password reset link has been sent to your email. Please check your inbox or spam folder.";
      setSuccessMessage(msg);
      setSent(true);
    } catch (err) {
      const msg = err?.message || "Could not process password reset request. Please check the email address and try again.";
      setError(msg);
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

            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {sent ? (
              <div className="text-center py-4 space-y-4">
                <CheckCircle2 className="w-12 h-12 text-[#0F766E] mx-auto" />
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">{successMessage}</p>
                  <p className="text-xs text-[#64748B] mt-1.5">
                    Click the link in the email or copy the token to create your new password.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2.5">
                  <Link
                    href="/reset-password"
                    className="w-full py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs transition-all shadow-md shadow-[#0F766E]/20 flex items-center justify-center gap-1.5"
                  >
                    Enter Reset Token <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-1.5 text-xs text-[#64748B] hover:text-[#0F766E] font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                  </Link>
                </div>
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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
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

                <div className="pt-2 flex flex-col gap-2 text-center">
                  <Link
                    href="/reset-password"
                    className="text-xs text-[#0F766E] hover:underline font-semibold"
                  >
                    Already have a reset token? Click here
                  </Link>

                  <Link href="/login" className="inline-flex items-center justify-center gap-1.5 text-xs text-[#64748B] hover:text-[#0F766E]">
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
