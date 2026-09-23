"use client";

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
} from "lucide-react";
import { getAdminUrl } from "@/config/api";

export default function HomePage() {
  const stats = [
    { label: "Active Hotels & Resorts", value: "500+" },
    { label: "Bookings Managed Daily", value: "50,000+" },
    { label: "Guest Satisfaction Rate", value: "99.4%" },
    { label: "Enterprise Uptime SLA", value: "99.99%" },
  ];

  const features = [
    {
      icon: <Building className="w-6 h-6 text-theme-primary" />,
      title: "Multi-Tenant Architecture",
      desc: "Isolated databases, dedicated credentials, and customized workflows for each independent hotel property.",
    },
    {
      icon: <Users className="w-6 h-6 text-theme-primary" />,
      title: "Front Desk & Quick Check-In",
      desc: "Fast guest check-in, Govt ID verification (Aadhaar/Passport), room key assignment, and luggage tracking.",
    },
    {
      icon: <CreditCard className="w-6 h-6 text-theme-primary" />,
      title: "Automated Folio & Invoicing",
      desc: "Real-time room charges, add-on services (dining, spa, laundry), automated GST/tax calculation, and instant receipts.",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-theme-primary" />,
      title: "Real-time Room Grid & Analytics",
      desc: "Visual occupancy matrix (Available, Reserved, Occupied, Cleaning, Maintenance) with live revenue tracking.",
    },
    {
      icon: <Lock className="w-6 h-6 text-theme-primary" />,
      title: "Strict Role-Based Security",
      desc: "Hierarchical permissions for Super Admins, Hotel Admins, and Receptionists with immutable audit logs.",
    },
    {
      icon: <Zap className="w-6 h-6 text-theme-primary" />,
      title: "Instant 30-Day Free Trial",
      desc: "Sign up your hotel online in 2 minutes. Super Admin review and immediate automated onboarding.",
    },
  ];

  const testimonials = [
    {
      quote:
        "Grand Royale transformed our 45-room resort operations. Front desk check-ins take under 60 seconds now, and staff management is effortless.",
      author: "Vikramaditya Singhania",
      role: "Managing Director, Heritage Palace Udaipur",
      rating: 5,
    },
    {
      quote:
        "The automated folio and add-on billing prevented thousands in billing discrepancies every month. The 30-day trial sold us completely.",
      author: "Ananya Deshmukh",
      role: "General Manager, Coastal Breeze Resort Goa",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-theme-main text-theme-main">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 px-6 bg-theme-main">
        <div className="mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full theme-badge px-4 py-1.5 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Multi-Tenant Hotel Management Platform</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-theme-main leading-tight">
            Elevate Your Hotel Operations with{" "}
            <span className="text-theme-gradient">Timeless Elegance</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-theme-muted max-w-2xl mx-auto font-normal leading-relaxed">
            The complete cloud PMS for luxury hotels, boutique resorts, and heritage properties.
            Manage multi-tenancy, front desk check-ins, guest verification, and automated billing effortlessly.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register-hotel"
              className="flex items-center gap-2 rounded-xl bg-theme-btn px-7 py-3.5 text-sm font-bold shadow-lg transition-all hover:scale-105"
            >
              <Sparkles className="h-4 w-4" />
              <span>Register Hotel (30-Day Free Trial)</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href={getAdminUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl theme-card px-6 py-3.5 text-sm font-semibold text-theme-main shadow-sm transition-all"
            >
              <Laptop className="h-4 w-4 text-theme-primary" />
              <span>Open Staff Dashboard</span>
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-theme-muted">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Super Admin instant approval
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100% Data isolation
            </span>
          </div>
        </div>

        {/* Floating Stats Row */}
        <div className="mx-auto max-w-5xl mt-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 theme-card rounded-2xl p-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-3 border-r last:border-r-0 border-theme">
                <p className="font-serif text-2xl md:text-3xl font-bold text-theme-dark">
                  {stat.value}
                </p>
                <p className="text-xs text-theme-muted mt-1 uppercase tracking-wider font-semibold">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-Based Hierarchy Section */}
      <section className="py-20 px-6 bg-theme-main border-y border-theme">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-theme-primary">
              Built For Seamless Operations
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-theme-main mt-2">
              Three-Tier Dedicated Role Hierarchy
            </h2>
            <p className="text-theme-muted text-sm max-w-2xl mx-auto mt-2">
              Each user gets a tailored workspace designed specifically for their operational responsibilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Super Admin */}
            <div className="theme-card rounded-2xl p-8 border border-theme hover:border-purple-300 transition-all shadow-sm hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-theme-main mb-2">
                1. Super Admin Hub
              </h3>
              <p className="text-xs text-theme-muted mb-4 leading-relaxed">
                Global platform oversight. Approve new hotel registrations, manage subscription trials, suspend accounts with automated email notices, and view multi-hotel analytics.
              </p>
              <ul className="space-y-2 text-xs text-theme-muted font-medium">
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-theme-primary" />
                  <span>Hotel approval &amp; rejection workflow</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-theme-primary" />
                  <span>Auto-credential emailing via Nodemailer</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-theme-primary" />
                  <span>System-wide audit logs &amp; security</span>
                </li>
              </ul>
            </div>

            {/* Hotel Admin */}
            <div className="theme-card rounded-2xl p-8 border-2 border-theme-primary shadow-md relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-theme-badge text-theme-dark mb-6">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-theme-main mb-2">
                2. Hotel Admin Portal
              </h3>
              <p className="text-xs text-theme-muted mb-4 leading-relaxed">
                Complete control over your individual hotel property. Define room categories, setup room inventory, hire receptionists, and monitor occupancy metrics.
              </p>
              <ul className="space-y-2 text-xs text-theme-muted font-medium">
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-theme-primary" />
                  <span>Room Types &amp; base pricing matrix</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-theme-primary" />
                  <span>Receptionist onboarding &amp; passwords</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-theme-primary" />
                  <span>Revenue &amp; occupancy analytics</span>
                </li>
              </ul>
            </div>

            {/* Receptionist */}
            <div className="theme-card rounded-2xl p-8 border border-theme hover:border-blue-300 transition-all shadow-sm hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-theme-main mb-2">
                3. Front Desk Operations
              </h3>
              <p className="text-xs text-theme-muted mb-4 leading-relaxed">
                Optimized for fast-paced check-ins, guest verification, booking extensions, room service charges, and fast guest checkout with itemized billing.
              </p>
              <ul className="space-y-2 text-xs text-theme-muted font-medium">
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-theme-primary" />
                  <span>Aadhaar / Passport ID verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-theme-primary" />
                  <span>Add-on charges (Laundry, Food, Spa)</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-theme-primary" />
                  <span>Express check-out with tax invoices</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-6 bg-theme-main">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-theme-primary">
              Everything You Need
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-theme-main mt-2">
              Engineered For Modern Hospitality
            </h2>
            <p className="text-theme-muted text-sm max-w-2xl mx-auto mt-2">
              Powerful tools designed to simplify day-to-day operations and maximize revenue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, index) => (
              <div
                key={index}
                className="theme-card theme-card-hover rounded-2xl p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="p-3 theme-badge rounded-xl w-fit mb-5">
                    {feat.icon}
                  </div>
                  <h4 className="font-serif text-lg font-bold text-theme-main mb-2">
                    {feat.title}
                  </h4>
                  <p className="text-xs text-theme-muted leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-6 bg-theme-main border-t border-theme">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-theme-primary">
              Trusted By Luxury Hoteliers
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-theme-main mt-1">
              Loved By Hospitality Leaders
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="theme-card rounded-2xl p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-1 mb-3">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-theme-muted italic mb-5 leading-relaxed">
                    "{t.quote}"
                  </p>
                </div>
                <div>
                  <p className="font-serif text-sm font-bold text-theme-main">{t.author}</p>
                  <p className="text-xs text-theme-dark font-medium">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-6 bg-theme-main">
        <div className="mx-auto max-w-5xl bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-10 md:p-12 text-center text-white shadow-xl relative overflow-hidden">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-3">
            Ready to Upgrade Your Hotel PMS?
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto mb-6">
            Register your property in under 2 minutes. Start your completely free 30-day trial with full access to all features.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register-hotel"
              className="rounded-xl bg-theme-btn px-7 py-3.5 text-xs font-bold shadow-lg hover:scale-105 transition-all"
            >
              Start 30-Day Free Trial
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl bg-white/10 hover:bg-white/20 px-7 py-3.5 text-xs font-bold text-white transition-all border border-white/20"
            >
              View Pricing Plans
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
