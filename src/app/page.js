"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  BedDouble,
  Calendar,
  Users,
  Receipt,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Layers,
  MousePointerClick,
  Headphones,
  Zap,
  Building,
  Star,
  Check,
  FileCheck
} from "lucide-react";

export default function HomePage() {
  const featureChips = [
    { title: "Room Management", icon: BedDouble },
    { title: "Reports & Analytics", icon: TrendingUp },
    { title: "Booking Management", icon: Calendar },
    { title: "Multi-Role Access", icon: ShieldCheck },
    { title: "Guest Management", icon: Users },
    { title: "Online Payments", icon: CreditCard },
    { title: "Billing & Invoicing", icon: Receipt },
    { title: "GST Management", icon: FileCheck },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFA] text-[#0F172A] font-sans selection:bg-[#0F766E] selection:text-white">
      <Navbar />

      {/* ───────────────────────────────────────────────────────────
          1. HERO SECTION (Luxury Resort Pool at Twilight)
      ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex flex-col justify-between pt-20 pb-16 lg:pt-28 lg:pb-20 overflow-hidden bg-[#0A1F1C]">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1920&q=85"
            alt="Grand Royale Luxury Resort Pool"
            className="w-full h-full object-cover object-center opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1F1C] via-[#0A1F1C]/75 to-[#0A1F1C]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F766E]/30 border border-[#14B8A6]/40 backdrop-blur-md mb-6">
              <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#14B8A6]">
                PREMIUM HOTEL MANAGEMENT SOLUTION
              </span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-sans font-extrabold text-white tracking-tight leading-[1.1]">
              Manage Your Hotel <br />
              <span className="font-extrabold text-[#14B8A6] font-sans">Smarter, Not Harder.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-[#CBD5E1] font-normal leading-relaxed max-w-xl">
              Grand Royale helps hotel owners and operators manage bookings, rooms, guests, billing and more — all in one powerful and easy-to-use platform.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register-hotel"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#14B8A6] hover:bg-[#0D9488] text-[#0A1F1C] font-bold text-sm transition-all shadow-lg"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/features"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-transparent hover:bg-white/5 text-white border border-white/30 font-bold text-sm backdrop-blur-md transition-all"
              >
                <Play className="w-4 h-4 text-white fill-white" />
                Watch Demo
              </Link>
            </div>

            {/* 4 Stats Bar */}
            <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[#14B8A6] mb-1">
                  <Building className="w-5 h-5" />
                  <span className="text-2xl font-bold text-white">500+</span>
                </div>
                <div className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Hotels Registered</div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[#14B8A6] mb-1">
                  <Users className="w-5 h-5" />
                  <span className="text-2xl font-bold text-white">50K+</span>
                </div>
                <div className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Happy Guests</div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[#14B8A6] mb-1">
                  <Zap className="w-5 h-5" />
                  <span className="text-2xl font-bold text-white">99.9%</span>
                </div>
                <div className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Uptime</div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[#14B8A6] mb-1">
                  <Headphones className="w-5 h-5" />
                  <span className="text-2xl font-bold text-white">24/7</span>
                </div>
                <div className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Customer Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          2. EVERYTHING YOU NEED TO RUN YOUR HOTEL
      ─────────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-white border-b border-[#DDE8E6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Features List */}
            <div className="lg:col-span-6">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F172A] tracking-tight">
                Everything You Need <br />to Run Your Hotel
              </h2>
              <p className="mt-4 text-[#64748B] text-sm sm:text-base leading-relaxed">
                From room management to billing and reports, Grand Royale gives you complete control — so you can focus on what matters most — your guests.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {featureChips.map((chip, idx) => {
                  const Icon = chip.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFA] border border-[#DDE8E6] hover:border-[#14B8A6] hover:bg-[#F0FDFA] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-[#0F172A]">{chip.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Video / Room Preview Card */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#DDE8E6] aspect-[16/10] group">
                <img
                  src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=85"
                  alt="Luxury Suite Preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-[#0A1F1C]/25" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-[#0F766E] text-white flex items-center justify-center shadow-xl backdrop-blur-sm cursor-pointer hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-white ml-1" />
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
      <section className="py-20 lg:py-24 bg-[#F8FAFA] border-b border-[#DDE8E6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F172A] tracking-tight">
              Why Choose Grand Royale?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-[#DDE8E6] shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center mb-4 text-[#0F766E]">
                <MousePointerClick className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#0F172A] mb-1.5">Easy to Use</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Simple and intuitive interface for everyone.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#DDE8E6] shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center mb-4 text-[#0F766E]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#0F172A] mb-1.5">Secure & Reliable</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Your data is always safe with us.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#DDE8E6] shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center mb-4 text-[#0F766E]">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#0F172A] mb-1.5">24/7 Support</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                We're here whenever you need us.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#DDE8E6] shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center mb-4 text-[#0F766E]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#0F172A] mb-1.5">Grow Your Business</h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                More bookings, more revenue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          4. READY TO TRANSFORM YOUR HOTEL OPERATIONS? (CTA)
      ─────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 text-white relative overflow-hidden bg-[#0A1F1C]">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=85"
            alt="Luxury Hotel Exterior"
            className="w-full h-full object-cover object-center opacity-30 group-hover:scale-105 transition-transform duration-[10s]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1F1C] via-[#0A1F1C]/80 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-5xl font-sans font-extrabold tracking-tight">
              Ready to Transform Your <br/> Hotel Operations?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#CBD5E1] max-w-lg leading-relaxed">
              Join thousands of hotel owners already using Grand Royale to boost efficiency and elevate the guest experience.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register-hotel"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#14B8A6] hover:bg-[#0D9488] text-[#0A1F1C] font-bold text-sm transition-all shadow-lg"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-transparent hover:bg-white/5 text-white border border-white/30 font-bold text-sm backdrop-blur-md transition-all"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
