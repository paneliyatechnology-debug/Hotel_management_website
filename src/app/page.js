"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  CreditCard,
  Building,
  BarChart3,
  Lock,
  Zap,
  Star,
  ChevronRight,
  Laptop,
  Clock,
  Receipt,
  FileCheck,
  ChevronDown,
  DollarSign,
  TrendingUp,
  Check,
  Play,
  Sparkle
} from "lucide-react";
import { getAdminUrl } from "@/config/api";

export default function HomePage() {
  // Interactive ROI Calculator state
  const [roomCount, setRoomCount] = useState(35);

  // Interactive FAQ state
  const [openFaq, setOpenFaq] = useState(0);

  // ROI Calculator Calculations
  const hoursSaved = Math.round(roomCount * 0.95);
  const revenueLeakageSaved = (roomCount * 2200).toLocaleString("en-IN");
  const estimatedRevenueBoost = (roomCount * 6500).toLocaleString("en-IN");

  const faqs = [
    {
      q: "How does the 30-day free trial work?",
      a: "You get full, unrestricted access to the complete Grand Royale hotel management cloud for 30 days. No credit card is required. You can add room types, staff, and run live check-ins from day one.",
    },
    {
      q: "Can I manage multiple properties from one master account?",
      a: "Yes! Our platform is engineered with true multi-tenancy. You can operate multiple hotels, resorts, or boutique homestays with independent databases, staff logins, and unified executive reporting.",
    },
    {
      q: "How secure is guest information and Govt ID data?",
      a: "All guest Aadhaar and Passport scans are encrypted using enterprise AES-256 standards with strict tenant data isolation. Staff roles restrict receptionists from viewing master financial data or modifying closed audit records.",
    },
    {
      q: "Does it support automated GST invoicing and restaurant/spa folios?",
      a: "Absolutely. Any charges from dining, mini-bar, laundry, or spa can be added to the guest's master folio with one click, and an itemized GST compliant tax invoice is generated upon check-out.",
    },
    {
      q: "How quickly can my front desk team learn the system?",
      a: "Most receptionists master check-ins and room assignments in under 15 minutes. The interface is intuitive, visual, and requires zero prior PMS training.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-sky-500 selection:text-white">
      {/* Top Luxury Announcement Bar */}
      <div className="bg-slate-950 text-amber-200 text-xs py-2 px-4 border-b border-amber-500/20 text-center flex items-center justify-center gap-3">
        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-300">
          <Sparkle className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          Grand Royale Cloud PMS 3.0 Live
        </span>
        <span className="hidden md:inline text-slate-400">•</span>
        <span className="hidden md:inline text-slate-300">
          Multi-Tenant Architecture • Instant Govt ID Verification • 30-Day Free Trial
        </span>
        <Link
          href="/register-hotel"
          className="underline text-amber-400 font-bold hover:text-amber-300 ml-2"
        >
          Claim Your Property →
        </Link>
      </div>

      <Navbar />

      {/* ====================================================================
       * HERO SECTION: Breathtaking Luxury Resort Background & Value Proposition
       * ==================================================================== */}
      <section className="relative overflow-hidden min-h-[640px] lg:min-h-[720px] flex items-center justify-center">
        {/* Background Resort Image */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: "url('/images/hero-resort.jpg')",
          }}
        />

        {/* Sophisticated Dark Luxury Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/75 to-slate-950/95 backdrop-blur-[1.5px]" />

        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-sky-500/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
          {/* Champagne Gold Luxury Pill */}
          <div className="inline-flex items-center gap-2 rounded-full glass-badge px-4 py-1.5 text-xs font-semibold text-amber-300 mb-6 border border-amber-400/30 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Next-Generation Multi-Tenant Hospitality Cloud</span>
            <span className="bg-amber-400/20 px-2 py-0.5 rounded-full text-[10px] text-amber-200">
              v3.0
            </span>
          </div>

          {/* Premium Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white font-serif leading-[1.15]">
            Elevate Your Hotel Operations with{" "}
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-sky-300 bg-clip-text text-transparent">
              5-Star Digital Precision
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto font-light leading-relaxed">
            The complete cloud property management system tailored for luxury resorts, boutique
            hotels, and heritage estates. Streamline multi-tenancy, front desk check-in, room
            inventory, automated folios, and GST billing effortlessly.
          </p>

          {/* Action CTAs with High-Impact Contrast */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            <Link
              href="/register-hotel"
              className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-8 py-4 text-sm font-bold shadow-xl shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 border border-sky-400/40"
            >
              <Sparkles className="h-4 w-4" />
              <span>Register Hotel (30-Day Free Trial)</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#console-preview"
              className="flex items-center gap-2 rounded-xl glass-panel text-white hover:text-white px-7 py-4 text-sm font-semibold transition-all hover:bg-white/20 border border-white/30 shadow-lg"
            >
              <Play className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span>Live Console Preview</span>
            </a>

            <a
              href={getAdminUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white px-6 py-4 text-sm font-medium transition-all border border-slate-700/80"
            >
              <Laptop className="h-4 w-4 text-sky-400" />
              <span>Staff Login</span>
            </a>
          </div>

          {/* Key Assurance Highlights */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              No Credit Card Required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Setup in Under 2 Minutes
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              100% Tenant Data Isolation
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Automated Super Admin Approval
            </span>
          </div>
        </div>
      </section>

      {/* ====================================================================
       * FLOATING METRICS STATS BAR
       * ==================================================================== */}
      <section className="relative -mt-10 z-20 max-w-6xl mx-auto px-6 w-full">
        <div className="glass-panel bg-white/95 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-2 border-r border-slate-200 last:border-none">
            <p className="font-serif text-3xl sm:text-4xl font-bold text-sky-700">500+</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">
              Active Hotels & Resorts
            </p>
          </div>
          <div className="text-center p-2 border-r border-slate-200 last:border-none">
            <p className="font-serif text-3xl sm:text-4xl font-bold text-sky-700">&lt; 45 Sec</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">
              Average Check-in Speed
            </p>
          </div>
          <div className="text-center p-2 border-r border-slate-200 last:border-none">
            <p className="font-serif text-3xl sm:text-4xl font-bold text-sky-700">99.4%</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">
              Guest Satisfaction Rate
            </p>
          </div>
          <div className="text-center p-2">
            <p className="font-serif text-3xl sm:text-4xl font-bold text-sky-700">99.99%</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">
              Cloud Uptime SLA
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================================
       * SECTION 2: REAL FRONT DESK CONSOLE & LIVE INVENTORY SHOWCASE
       * ==================================================================== */}
      <section id="console-preview" className="py-20 px-6 bg-slate-50 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-600 bg-sky-50 px-3.5 py-1.5 rounded-full border border-sky-200">
              Live Front Desk Console & Category Inventory
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900 mt-3">
              Real-Time Front Desk & Category-Wise Room Inventory
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Empower your reception team with instant 1-click express check-ins, Govt ID compliance,
              real-time vacant room counts, and category tariffs at a single glance.
            </p>
          </div>

          {/* Polished Master Screenshot Showcase Frame */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900/10 group">
            <img
              src="/images/frontdesk-console-showcase.png"
              alt="Grand Royale Front Desk Console & Room Inventory"
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.01]"
            />

            {/* Floating Live Indicator Badge */}
            <div className="absolute top-6 left-6 glass-panel rounded-xl px-4 py-2.5 shadow-lg border border-white/60 flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <p className="text-[11px] font-bold text-slate-900">Live PMS Synchronized</p>
                <p className="text-[9px] text-slate-500">Real-time Socket.io Cloud Feed</p>
              </div>
            </div>

            {/* Quick Floating Feature Callouts */}
            <div className="absolute bottom-6 right-6 hidden md:flex items-center gap-3">
              <div className="glass-panel-dark rounded-xl px-4 py-2 text-white text-xs border border-white/20 shadow-xl">
                <span className="font-semibold text-amber-300">Front Desk:</span> Aadhaar / Passport Instant Scan
              </div>
              <div className="glass-panel-dark rounded-xl px-4 py-2 text-white text-xs border border-white/20 shadow-xl">
                <span className="font-semibold text-sky-300">Folio:</span> Automated Tax & Add-on Billing
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
       * THREE-TIER DEDICATED WORKSPACES: Super Admin, Hotel Admin, Reception
       * ==================================================================== */}
      <section className="py-24 px-6 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Purpose-Built Roles
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 mt-2">
              Three Distinct Workspaces for Flawless Operations
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Each user enters a role-specific interface focused exactly on what they need to accomplish.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Super Admin */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200/80 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                Tier 1 Oversight
              </span>
              <h3 className="font-serif text-2xl font-bold text-slate-900 mt-3 mb-2">
                Super Admin Master Control
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Complete platform governance. Approve incoming hotel trial registrations, review documents, manage global subscriptions, and oversee multi-tenant health.
              </p>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600" />
                  <span>Instant 1-Click Hotel Approval & Rejection</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600" />
                  <span>Automated Credential Dispatch via Nodemailer</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600" />
                  <span>Global Audit Logs & Multi-Property Metrics</span>
                </li>
              </ul>
            </div>

            {/* Hotel Admin */}
            <div className="bg-white rounded-3xl p-8 border-2 border-sky-500 shadow-xl shadow-sky-500/10 transition-all relative overflow-hidden group">
              <div className="absolute top-4 right-4 bg-sky-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                Tier 2 Property Owner
              </span>
              <h3 className="font-serif text-2xl font-bold text-slate-900 mt-3 mb-2">
                Hotel Owner & Manager
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Total control over your individual hotel property. Configure custom room types, seasonal pricing matrices, onboard front desk staff, and track daily revenue.
              </p>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-600" />
                  <span>Room Type & Base Pricing Engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-600" />
                  <span>Receptionist Onboarding & Secure Logins</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-600" />
                  <span>Live Occupancy, RevPAR & Profit Analytics</span>
                </li>
              </ul>
            </div>

            {/* Receptionist */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200/80 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Tier 3 Front Desk
              </span>
              <h3 className="font-serif text-2xl font-bold text-slate-900 mt-3 mb-2">
                Front Desk Operations
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Engineered for maximum speed and zero friction during check-in. Instant Aadhaar & Passport verification, room key allocations, add-on POS billing, and express checkouts.
              </p>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>&lt;45s Guest Check-In & Govt ID Scan</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Instant Add-on Billing (Laundry, Dining, Spa)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Auto GST Invoices & Folio Receipt Print</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
       * LUXURY GUEST SUITE & EXPERIENCE SHOWCASE
       * ==================================================================== */}
      <section className="py-20 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Suite Image with Luxury Floating Tag */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
            <img
              src="/images/hotel-suite.jpg"
              alt="Luxury Presidential Suite"
              className="w-full h-[450px] object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Presidential Penthouse
                </p>
                <p className="font-serif text-2xl font-bold">The Royal Grandview Suite</p>
              </div>
              <div className="glass-panel-dark px-4 py-2 rounded-xl text-center border border-white/20">
                <p className="text-[10px] text-slate-300 uppercase">Nightly Rate</p>
                <p className="font-serif text-lg font-bold text-amber-300">₹28,000</p>
              </div>
            </div>
          </div>

          {/* Value Highlights */}
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Unrivaled Guest Hospitality
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 mt-3 mb-4">
              Turn First-Time Visitors into Lifelong Loyal Guests
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              A smooth check-in sets the tone for the entire luxury hotel stay. Grand Royale removes paperwork, delays, and billing confusion so your staff can focus purely on warm hospitality.
            </p>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-sky-50 text-sky-600 rounded-xl mt-1">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Compliant Aadhaar & Govt ID Archiving
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Capture guest IDs digitally with automatic redaction and encrypted cloud storage meeting Indian hospitality regulatory compliance.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl mt-1">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Unified Multi-Department Folio
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pool dining charges, mini-bar consumption, banquet services, and spa appointments into a single comprehensive bill with one click.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mt-1">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Real-time Housekeeping Status Sync
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Housekeeping marks rooms clean on mobile in real time, immediately unlocking rooms for incoming arrivals without phone calls.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
       * INTERACTIVE ROI & PROFITABILITY CALCULATOR
       * ==================================================================== */}
      <section className="py-20 px-6 bg-slate-900 text-white relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
              Interactive ROI Calculator
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-2">
              Calculate Your Operational Savings
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Slide to select your total room inventory and see your estimated monthly savings with Grand Royale.
            </p>
          </div>

          <div className="bg-slate-800/80 rounded-3xl p-8 sm:p-10 border border-slate-700/80 shadow-2xl max-w-3xl mx-auto backdrop-blur-md">
            {/* Slider */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-slate-300">
                  Select Total Room Inventory:
                </label>
                <span className="font-serif text-2xl font-bold text-sky-400 bg-sky-950/80 px-4 py-1 rounded-xl border border-sky-500/30">
                  {roomCount} Rooms
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={roomCount}
                onChange={(e) => setRoomCount(Number(e.target.value))}
                className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-medium">
                <span>10 Rooms (Boutique)</span>
                <span>100 Rooms (Resort)</span>
                <span>200+ Rooms (Grand Hotel)</span>
              </div>
            </div>

            {/* Dynamic Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-700">
              <div className="text-center p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60">
                <Clock className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                <p className="font-serif text-2xl sm:text-3xl font-bold text-amber-300">
                  {hoursSaved} Hrs/wk
                </p>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                  Staff Hours Saved
                </p>
              </div>

              <div className="text-center p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60">
                <DollarSign className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <p className="font-serif text-2xl sm:text-3xl font-bold text-emerald-300">
                  ₹{revenueLeakageSaved}
                </p>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                  Billing Leakage Prevented/Mo
                </p>
              </div>

              <div className="text-center p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60">
                <TrendingUp className="w-5 h-5 text-sky-400 mx-auto mb-2" />
                <p className="font-serif text-2xl sm:text-3xl font-bold text-sky-300">
                  ₹{estimatedRevenueBoost}
                </p>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                  Avg. Add-On Revenue Gain/Mo
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/register-hotel"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-8 py-3.5 text-xs font-bold shadow-lg shadow-sky-500/30 transition-all hover:scale-105"
              >
                <span>Start Free 30-Day Trial for {roomCount} Rooms</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
       * VERIFIED HOTELIER TESTIMONIALS
       * ==================================================================== */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Trusted by Hoteliers
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 mt-2">
              Loved by Luxury Resort Owners Across India
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed mb-6">
                  "Switching from our slow desktop PMS to Grand Royale was the best decision for our 48-room heritage property. Reception check-ins now take under a minute."
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="font-serif text-sm font-bold text-slate-900">
                  Vikramaditya Singhania
                </p>
                <p className="text-xs text-sky-600 font-medium">
                  Managing Director, Heritage Palace Udaipur
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed mb-6">
                  "The automated add-on billing and folio management prevented tens of thousands in unbilled mini-bar and dining orders. The 30-day trial sold us completely."
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="font-serif text-sm font-bold text-slate-900">Ananya Deshmukh</p>
                <p className="text-xs text-sky-600 font-medium">
                  General Manager, Coastal Breeze Resort Goa
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed mb-6">
                  "Having strict role isolation between front desk staff and master financials gives me complete peace of mind when traveling abroad. Truly world class."
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="font-serif text-sm font-bold text-slate-900">Rajeshwar Nair</p>
                <p className="text-xs text-sky-600 font-medium">
                  Owner, Green Valley Mountain Retreat Munnar
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
       * FREQUENTLY ASKED QUESTIONS (FAQ) ACCORDION
       * ==================================================================== */}
      <section className="py-20 px-6 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Clear Answers
            </span>
            <h2 className="text-3xl font-serif font-bold text-slate-900 mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  className="w-full flex items-center justify-between p-5 text-left bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 text-sm">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180 text-sky-600" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="p-5 pt-2 text-xs sm:text-sm text-slate-600 bg-white border-t border-slate-100 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
       * CLOSING HIGH-CONVERSION CTA BANNER
       * ==================================================================== */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 p-10 sm:p-14 text-center text-white shadow-2xl border border-slate-800 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3.5 py-1 rounded-full border border-amber-400/30">
              Instant 30-Day Free Trial
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-4 mb-3">
              Ready to Modernize Your Hotel Front Desk?
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-8">
              Register your hotel property in under 2 minutes. Get instant access to the multi-tenant
              cloud PMS with no credit card required.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register-hotel"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-white px-8 py-4 text-xs font-bold shadow-xl shadow-sky-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <span>Start 30-Day Free Trial</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href={getAdminUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white px-7 py-4 text-xs font-semibold transition-all border border-white/20 backdrop-blur-md"
              >
                <Laptop className="h-4 w-4 text-sky-400" />
                <span>Open Staff Dashboard</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
