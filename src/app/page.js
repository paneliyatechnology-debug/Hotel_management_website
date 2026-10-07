"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Play,
  BedDouble,
  Calendar,
  Users,
  Receipt,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  MousePointerClick,
  Headphones,
  Zap,
  Building,
  Grid,
  Sparkles,
  ArrowRight,
  X,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  const [demoOpen, setDemoOpen] = useState(false);

  const featureChips = [
    { title: "Room Management", icon: BedDouble },
    { title: "Reports & Analytics", icon: TrendingUp },
    { title: "Booking Management", icon: Calendar },
    { title: "Multi-Role Access", icon: ShieldCheck },
    { title: "Guest Management", icon: Users },
    { title: "Online Payments", icon: CreditCard },
    { title: "Billing & Invoicing", icon: Receipt },
    { title: "And Much More...", icon: Grid },
  ];

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F172A] font-sans selection:bg-[#00D0B4] selection:text-[#072F2A]">
      <Navbar />

      {/* ───────────────────────────────────────────────────────────
          1. HERO SECTION (Luxury Resort Pool at Dusk)
      ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden bg-[#072F2A]">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1920&q=85"
            alt="Grand Royale Luxury Resort"
            className="w-full h-full object-cover object-right lg:object-center opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#062823] via-[#062823]/85 to-[#062823]/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#062823] via-transparent to-[#062823]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            {/* Top Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00D0B4]/10 border border-[#00D0B4]/35 backdrop-blur-md mb-8">
              <span className="w-2 h-2 rounded-full bg-[#00D0B4] animate-pulse" />
              <span className="text-[11px] sm:text-[12px] font-outfit font-extrabold uppercase tracking-[0.18em] text-[#00D0B4]">
                PREMIUM HOTEL MANAGEMENT SOLUTION
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-serif font-extrabold text-white tracking-tight leading-[1.08]">
              Manage Your Hotel <br />
              <span className="text-[#00D0B4] font-serif font-black">Smarter, Not Harder.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-[17px] lg:text-[18px] font-sans text-slate-300 font-normal leading-[1.65] max-w-xl">
              Grand Royale helps hotel owners and operators manage bookings, rooms, guests, billing and more — all in one powerful and easy-to-use platform.
            </p>

            {/* CTA Buttons */}
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/register-hotel"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#00D0B4] hover:bg-[#00BFA5] text-[#072F2A] font-extrabold text-sm transition-all shadow-lg shadow-[#00D0B4]/25 hover:scale-[1.02]"
              >
                Get Started Free
              </Link>

              <button
                type="button"
                onClick={() => setDemoOpen(true)}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full bg-transparent hover:bg-white/10 text-white border border-[#00D0B4]/50 font-bold text-sm backdrop-blur-md transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full border border-white/60 flex items-center justify-center">
                  <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                </div>
                Watch Demo
              </button>
            </div>
          </div>

          {/* 4 Hero Metric Badges - Spread Across Full Container Width */}
          <div className="mt-16 sm:mt-20 pt-8 border-t border-[#0F4A42]/80 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 justify-between">
            {/* Stat 1 */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full border border-[#00D0B4]/40 bg-[#00D0B4]/10 flex items-center justify-center flex-shrink-0 text-[#00D0B4]">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-outfit font-black text-white leading-none">500+</div>
                <div className="text-xs font-sans font-semibold text-slate-300 mt-1">Hotels Registered</div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full border border-[#00D0B4]/40 bg-[#00D0B4]/10 flex items-center justify-center flex-shrink-0 text-[#00D0B4]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-outfit font-black text-white leading-none">50K+</div>
                <div className="text-xs font-sans font-semibold text-slate-300 mt-1">Happy Guests</div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full border border-[#00D0B4]/40 bg-[#00D0B4]/10 flex items-center justify-center flex-shrink-0 text-[#00D0B4]">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-outfit font-black text-white leading-none">99.9%</div>
                <div className="text-xs font-sans font-semibold text-slate-300 mt-1">Uptime</div>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full border border-[#00D0B4]/40 bg-[#00D0B4]/10 flex items-center justify-center flex-shrink-0 text-[#00D0B4]">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-outfit font-black text-white leading-none">24/7</div>
                <div className="text-xs font-sans font-semibold text-slate-300 mt-1">Customer Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          2. EVERYTHING YOU NEED TO RUN YOUR HOTEL
      ─────────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Title & Feature Chips */}
            <div className="lg:col-span-6">
              <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-serif font-extrabold text-[#0B1E28] tracking-tight leading-[1.15]">
                Everything You Need <br />to Run Your Hotel
              </h2>
              <p className="mt-5 text-slate-600 font-sans text-sm sm:text-base leading-[1.65]">
                From room management to billing and reports, Grand Royale gives you complete control — so you can focus on what matters most — your guests.
              </p>

              {/* 8 Feature Chips Grid */}
              <div className="mt-9 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {featureChips.map((chip, idx) => {
                  const Icon = chip.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#F4F9F8] border border-[#E1ECE9] hover:border-[#00D0B4] hover:bg-[#ECF7F5] transition-all group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#00D0B4]/15 text-[#058B79] flex items-center justify-center flex-shrink-0 group-hover:bg-[#00D0B4] group-hover:text-[#072F2A] transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-sans font-bold text-[#0B1E28] group-hover:text-[#058B79] transition-colors">
                        {chip.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Hotel Suite Video Preview Card */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 aspect-[16/11] group">
                <img
                  src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=85"
                  alt="Luxury Hotel Room Preview"
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-[#072F2A]/30 group-hover:bg-[#072F2A]/20 transition-colors" />
                
                {/* Centered Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    onClick={() => setDemoOpen(true)}
                    className="w-16 h-16 rounded-full bg-[#00D0B4] text-[#072F2A] flex items-center justify-center shadow-xl shadow-[#00D0B4]/40 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Play className="w-7 h-7 fill-[#072F2A] ml-1 text-[#072F2A]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          3. WHY CHOOSE GRAND ROYALE?
      ─────────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-[#EFF7F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-serif font-extrabold text-[#0B1E28] tracking-tight">
              Why Choose Grand Royale?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-7 border border-[#E1ECE9] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="w-11 h-11 rounded-xl bg-[#EFF7F5] border border-[#00D0B4]/30 flex items-center justify-center mb-5 text-[#058B79]">
                <MousePointerClick className="w-5 h-5" />
              </div>
              <h3 className="text-[19px] font-outfit font-extrabold text-[#0B1E28] mb-2">Easy to Use</h3>
              <p className="text-xs sm:text-[14px] font-sans text-slate-500 leading-relaxed">
                Simple and intuitive interface for everyone.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-7 border border-[#E1ECE9] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="w-11 h-11 rounded-xl bg-[#EFF7F5] border border-[#00D0B4]/30 flex items-center justify-center mb-5 text-[#058B79]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-[19px] font-outfit font-extrabold text-[#0B1E28] mb-2">Secure & Reliable</h3>
              <p className="text-xs sm:text-[14px] font-sans text-slate-500 leading-relaxed">
                Your data is always safe with us.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-7 border border-[#E1ECE9] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="w-11 h-11 rounded-xl bg-[#EFF7F5] border border-[#00D0B4]/30 flex items-center justify-center mb-5 text-[#058B79]">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="text-[19px] font-outfit font-extrabold text-[#0B1E28] mb-2">24/7 Support</h3>
              <p className="text-xs sm:text-[14px] font-sans text-slate-500 leading-relaxed">
                We're here whenever you need us.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl p-7 border border-[#E1ECE9] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="w-11 h-11 rounded-xl bg-[#EFF7F5] border border-[#00D0B4]/30 flex items-center justify-center mb-5 text-[#058B79]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-[19px] font-outfit font-extrabold text-[#0B1E28] mb-2">Grow Your Business</h3>
              <p className="text-xs sm:text-[14px] font-sans text-slate-500 leading-relaxed">
                More bookings, more revenue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          4. READY TO TRANSFORM YOUR HOTEL OPERATIONS? (CTA)
      ─────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-[#072F2A] p-8 sm:p-14 lg:p-16 text-white shadow-2xl">
          {/* Background Image Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=85"
              alt="Luxury Hotel Exterior"
              loading="lazy"
              className="w-full h-full object-cover object-center opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#072F2A] via-[#072F2A]/90 to-transparent" />
            
            {/* Wave graphics overlay on right */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none hidden lg:block">
              <svg viewBox="0 0 500 500" className="w-full h-full stroke-[#00D0B4]" fill="none" strokeWidth="1.5">
                <path d="M0,100 C150,200 350,0 500,100" />
                <path d="M0,150 C150,250 350,50 500,150" />
                <path d="M0,200 C150,300 350,100 500,200" />
                <path d="M0,250 C150,350 350,150 500,250" />
                <path d="M0,300 C150,400 350,200 500,300" />
              </svg>
            </div>
          </div>

          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]">
              Ready to Transform Your <br/> Hotel Operations?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-lg leading-relaxed font-normal">
              Join thousands of hotel owners already using Grand Royale.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register-hotel"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[#00D0B4] hover:bg-[#00BFA5] text-[#072F2A] font-extrabold text-sm transition-all shadow-lg shadow-[#00D0B4]/25 hover:scale-[1.02]"
              >
                Get Started Free
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-transparent hover:bg-white/10 text-white border border-white/30 font-bold text-sm backdrop-blur-md transition-all"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Watch Demo Modal */}
      {demoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-[#072F2A] border border-[#00D0B4]/40 rounded-3xl overflow-hidden shadow-2xl text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#0F4A42]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00D0B4]/20 flex items-center justify-center text-[#00D0B4]">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-white">
                    Grand Royale Hotel PMS Walkthrough
                  </h3>
                  <p className="text-xs text-slate-300">
                    Explore room inventory, guest check-ins, automated billing, and live reports.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDemoOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Close demo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video / Interactive Player Area */}
            <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
              <video
                controls
                autoPlay
                className="w-full h-full object-cover"
                poster="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=85"
              >
                <source
                  src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#062823] border-t border-[#0F4A42] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00D0B4]" /> Instant 5-Step Check-In
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00D0B4]" /> Multi-Role Staff Access
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00D0B4]" /> Automated GST Invoicing
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/register-hotel"
                  onClick={() => setDemoOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-[#00D0B4] hover:bg-[#00BFA5] text-[#072F2A] font-extrabold text-xs transition-all shadow-md"
                >
                  Start Free Trial →
                </Link>
                <button
                  onClick={() => setDemoOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-white/30 text-white font-semibold text-xs hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

