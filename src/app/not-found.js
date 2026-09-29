"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Hotel, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFA] text-[#0F172A] font-sans flex flex-col justify-between selection:bg-[#0F766E] selection:text-white">
      <Navbar />

      <main className="max-w-md mx-auto px-4 py-24 text-center my-auto">
        <div className="w-20 h-20 rounded-full bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Hotel className="w-10 h-10 stroke-[2]" />
        </div>

        <h1 className="text-6xl font-serif font-bold text-[#0F172A] tracking-tight">
          404
        </h1>

        <h2 className="text-xl font-serif font-bold text-[#0F172A] mt-2">
          Page Not Found
        </h2>

        <p className="text-xs sm:text-sm text-[#64748B] mt-2 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back Home
        </Link>
      </main>

      <Footer />
    </div>
  );
}
