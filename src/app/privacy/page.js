"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFA] text-[#0F172A] font-sans selection:bg-[#0F766E] selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-xs text-[#64748B] mb-4">
          <Link href="/" className="hover:text-[#0F766E]">Home</Link> &gt; <span>Privacy Policy</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F172A]">
          Privacy Policy
        </h1>
        <p className="text-xs text-[#64748B] mt-1 mb-8">Last updated: January 1, 2026</p>

        <div className="bg-white rounded-2xl p-8 border border-[#DDE8E6] shadow-sm space-y-6 text-xs sm:text-sm text-[#334155] leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-[#0F172A] mb-2">1. Information We Collect</h2>
            <p>We collect information you provide directly to us when creating a hotel account, managing guests, or processing reservations through Grand Royale.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0F172A] mb-2">2. How We Use Your Information</h2>
            <p>We use the information we collect to operate, maintain, enhance, and provide all features of the Grand Royale platform.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0F172A] mb-2">3. Data Security</h2>
            <p>We use industry-standard 256-bit encryption and security measures designed to protect your personal and business data from unauthorized access.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0F172A] mb-2">4. Third-Party Services</h2>
            <p>We do not sell or rent your personal information to third parties. We only share data with payment gateways and verified partners necessary to provide services.</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
