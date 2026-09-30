"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  BedDouble,
  Calendar,
  Users,
  Receipt,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Zap,
  Check,
  Headphones,
  ArrowRight
} from "lucide-react";

export default function FeaturesPage() {
  const mainFeatures = [
    {
      title: "Room Management",
      desc: "Manage room types, availability and pricing.",
      icon: BedDouble
    },
    {
      title: "Booking Management",
      desc: "Handle online, walk-in and advance bookings.",
      icon: Calendar
    },
    {
      title: "Guest Management",
      desc: "Keep guest profiles, history and preferences.",
      icon: Users
    },
    {
      title: "Billing & Invoicing",
      desc: "Generate invoices, collect payments and manage GST.",
      icon: Receipt
    },
    {
      title: "Reports & Analytics",
      desc: "Get real-time insights with detailed reports.",
      icon: TrendingUp
    },
    {
      title: "Multi-Role Access",
      desc: "Admin, Hotel Manager, Receptionist, and more.",
      icon: ShieldCheck
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFA] text-[#0F172A] font-sans selection:bg-[#0F766E] selection:text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 bg-[#072F2A] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1920&q=85"
            alt="Hotel Lounge"
            className="w-full h-full object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#072F2A] via-[#072F2A]/85 to-[#072F2A]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#072F2A] via-transparent to-[#072F2A]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00D0B4]/15 border border-[#00D0B4]/40 text-[#00D0B4] text-[11px] sm:text-xs font-outfit font-extrabold uppercase tracking-[0.18em] mb-6">
              OUR FEATURES
            </div>
            <h1 className="text-4xl sm:text-6xl font-serif font-extrabold text-white tracking-tight leading-[1.12]">
              Powerful Features for <br />Seamless Hotel Management
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-xl font-sans font-normal leading-relaxed">
              Everything you need to manage your hotel efficiently, from room management to detailed reports — all in one platform.
            </p>
          </div>
        </div>
      </section>

      {/* Main Features 6-Card Grid */}
      <section className="py-20 lg:py-24 bg-white border-b border-[#DDE8E6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <h2 className="text-3xl sm:text-4xl font-sans font-bold text-[#0F172A] tracking-tight">Main Features</h2>
            <p className="mt-3 text-base sm:text-lg text-[#64748B] leading-relaxed">
              Built for hotel owners, managers, and staff to work smarter and provide better guest experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mainFeatures.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-7 border border-[#DDE8E6] shadow-sm hover:shadow-md hover:border-[#14B8A6] transition-all">
                  <div className="w-11 h-11 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center mb-5 text-[#0F766E]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-[#0F172A] mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Built for Every Role */}
      <section className="py-20 lg:py-24 bg-[#F8FAFA] border-b border-[#DDE8E6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=80"
                  alt="Hotel Team"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-sans font-bold text-[#0F172A] tracking-tight">
                Built for Every Role
              </h2>
              <p className="mt-4 text-base sm:text-lg text-[#64748B] leading-relaxed">
                From super admins to receptionists, everyone gets the right tools to do their job efficiently.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#DDE8E6] text-sm font-semibold text-[#0F172A] shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-[#0F766E]" /> Super Admin
                </div>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#DDE8E6] text-sm font-semibold text-[#0F172A] shadow-sm">
                  <BedDouble className="w-4 h-4 text-[#0F766E]" /> Hotel Admin
                </div>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#DDE8E6] text-sm font-semibold text-[#0F172A] shadow-sm">
                  <Users className="w-4 h-4 text-[#0F766E]" /> Receptionist
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20 border-t border-[#DDE8E6] pt-12 flex flex-wrap justify-center gap-12 sm:gap-24">
            <div className="flex items-center gap-3 text-[#0F172A] font-semibold text-sm">
              <div className="w-10 h-10 rounded-full bg-[#F0FDFA] flex items-center justify-center text-[#14B8A6]">
                <Lock className="w-5 h-5" />
              </div>
              Secure
            </div>
            <div className="flex items-center gap-3 text-[#0F172A] font-semibold text-sm">
              <div className="w-10 h-10 rounded-full bg-[#F0FDFA] flex items-center justify-center text-[#14B8A6]">
                <Zap className="w-5 h-5" />
              </div>
              Scalable
            </div>
            <div className="flex items-center gap-3 text-[#0F172A] font-semibold text-sm">
              <div className="w-10 h-10 rounded-full bg-[#F0FDFA] flex items-center justify-center text-[#14B8A6]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              Reliable
            </div>
            <div className="flex items-center gap-3 text-[#0F172A] font-semibold text-sm">
              <div className="w-10 h-10 rounded-full bg-[#F0FDFA] flex items-center justify-center text-[#14B8A6]">
                <Headphones className="w-5 h-5" />
              </div>
              24/7 Support
            </div>
          </div>
        </div>
      </section>

      {/* More Than Just a System */}
      <section className="py-20 bg-white border-b border-[#DDE8E6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0F172A]">
                More Than Just a System
              </h2>
              <p className="mt-2 text-sm text-[#64748B]">It's your complete hotel management partner.</p>

              <div className="mt-6 space-y-3.5">
                {[
                  "Increase Efficiency",
                  "Improve Guest Satisfaction",
                  "Maximize Revenue",
                  "Easy Integrations"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm font-semibold text-[#0F172A]">
                    <div className="w-5 h-5 rounded-full bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div className="rounded-2xl overflow-hidden shadow-xl border border-[#DDE8E6] aspect-[16/10]">
                <img
                  src="https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1000&q=80"
                  alt="Resort Pool"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-4 right-4 bg-[#091F1C]/90 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-semibold border border-[#143B36] shadow-lg">
                Trusted by 500+ Hotels Worldwide
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
