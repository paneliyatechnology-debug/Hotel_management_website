"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFA] text-[#0F172A] font-sans selection:bg-[#0F766E] selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-xs text-[#64748B] mb-4">
          <Link href="/" className="hover:text-[#0F766E]">Home</Link> &gt; <span>Terms & Conditions</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F172A]">
          Terms & Conditions
        </h1>
        <p className="text-xs text-[#64748B] mt-1 mb-8">Last updated: January 1, 2026</p>

        <div className="bg-white rounded-2xl p-8 border border-[#DDE8E6] shadow-sm space-y-6 text-xs sm:text-sm text-[#334155] leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-[#0F172A] mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using Grand Royale hotel management cloud, you agree to be bound by these terms. If you disagree with any part of the terms, you may not access the service.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0F172A] mb-2">2. Services</h2>
            <p>Grand Royale provides cloud-based hotel property management software, including booking management, billing, room inventory, and guest communication tools.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0F172A] mb-2">3. User Responsibilities</h2>
            <p>You are responsible for safeguarding the credentials you use to access the service and for all activities that occur under your account.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0F172A] mb-2">4. Limitation of Liability</h2>
            <p>In no event shall Grand Royale be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the service.</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
