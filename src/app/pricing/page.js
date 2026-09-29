"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, ArrowRight, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
import { API_ENDPOINTS, apiRequest } from "@/config/api";

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [dynamicPlans, setDynamicPlans] = useState(null);

  const [trialText, setTrialText] = useState("30-Day");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiRequest(API_ENDPOINTS.SUBSCRIPTION_PLANS.PUBLIC);
        if (res && res.data) {
          setDynamicPlans(res.data);
        }
      } catch (err) {}
      
      try {
        const res = await apiRequest(API_ENDPOINTS.SETTINGS.PUBLIC);
        if (res && res.settings) {
          const unit = res.settings.freeTrialUnit === "hours" ? "Hour" : "Day";
          setTrialText(`${res.settings.freeTrialValue}-${unit}`);
        }
      } catch (err) {}
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFA] text-[#0F172A] font-sans selection:bg-[#0F766E] selection:text-white">
      <Navbar />

      {/* Header */}
      <section className="relative pt-24 pb-16 lg:pt-28 lg:pb-20 text-center border-b border-[#DDE8E6] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=80"
            alt="Hotel Room"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-white/70" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-[2.75rem] font-sans font-bold text-[#0D2825] tracking-tight leading-[1.2]">
            Simple & Transparent Pricing
          </h1>
          <p className="mt-4 text-base sm:text-[1.1rem] text-[#476C67] font-medium max-w-2xl mx-auto">
            Choose the plan that fits your hotel's needs. Start with a {trialText.toLowerCase()} free trial.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-10 inline-flex items-center p-1 bg-white rounded-full border border-[#CCFBF1] shadow-sm">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-7 py-2.5 rounded-full text-sm font-bold transition-all ${
                !isYearly ? "bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]" : "text-[#476C67] border border-transparent hover:text-[#0F766E]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-7 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2.5 ${
                isYearly ? "bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]" : "text-[#476C67] border border-transparent hover:text-[#0F766E]"
              }`}
            >
              Yearly
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FDE68A] text-[#92400E]">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 3 Pricing Cards */}
      <section className="py-16 bg-[#F8FAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Starter */}
            <div className="bg-white rounded-3xl p-8 border border-[#DDE8E6] shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#0F172A]">Starter</h3>
                <p className="text-xs text-[#64748B] mt-1">Perfect for small hotels</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-serif font-bold text-[#0F172A]">
                    ₹{isYearly ? "2,399" : "2,999"}
                  </span>
                  <span className="text-xs text-[#64748B]"> /month</span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-[#0F172A] pt-4 border-t border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] flex-shrink-0" /> Up to 10 rooms
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] flex-shrink-0" /> Basic features
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] flex-shrink-0" /> Online support
                  </div>
                </div>
              </div>

              <Link
                href="/register-hotel"
                className="mt-8 w-full py-3 rounded-xl bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0F766E] font-semibold text-xs text-center transition-colors block border border-[#CCFBF1]"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Professional (Featured Dark Card) */}
            <div className="bg-[#0B2A27] text-white rounded-3xl p-8 border-2 border-[#14B8A6] shadow-xl flex flex-col justify-between relative transform lg:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#14B8A6] text-[#091F1C] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Most Popular
              </div>

              <div>
                <h3 className="text-xl font-serif font-bold text-white">Professional</h3>
                <p className="text-xs text-[#CBD5E1] mt-1">Ideal for growing hotels</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-serif font-bold text-white">
                    ₹{isYearly ? "4,799" : "5,999"}
                  </span>
                  <span className="text-xs text-[#CBD5E1]"> /month</span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-[#E2E8F0] pt-4 border-t border-[#143B36]">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0" /> Up to 50 rooms
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0" /> Advanced features
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0" /> Reports & analytics
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#14B8A6] flex-shrink-0" /> Priority support
                  </div>
                </div>
              </div>

              <Link
                href="/register-hotel"
                className="mt-8 w-full py-3 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs text-center transition-all block shadow-lg shadow-[#0F766E]/40"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-3xl p-8 border border-[#DDE8E6] shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#0F172A]">Enterprise</h3>
                <p className="text-xs text-[#64748B] mt-1">For large hotel chains</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-serif font-bold text-[#0F172A]">
                    ₹{isYearly ? "7,999" : "9,999"}
                  </span>
                  <span className="text-xs text-[#64748B]"> /month</span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-[#0F172A] pt-4 border-t border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] flex-shrink-0" /> Unlimited rooms
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] flex-shrink-0" /> All features
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] flex-shrink-0" /> Dedicated support
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] flex-shrink-0" /> Custom integrations
                  </div>
                </div>
              </div>

              <Link
                href="/contact"
                className="mt-8 w-full py-3 rounded-xl bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0F766E] font-semibold text-xs text-center transition-colors block border border-[#CCFBF1]"
              >
                Contact Sales
              </Link>
            </div>
          </div>

          {/* 3 Trust points */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs text-[#64748B] font-medium">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0F766E]" /> {trialText} Free Trial
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0F766E]" /> No Setup Fee
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> Cancel Anytime
            </span>
          </div>
        </div>
      </section>

      {/* Mid CTA */}
      <section className="relative py-20 sm:py-28 text-white text-center overflow-hidden bg-[#0A1F1C] border-y border-[#143B36]">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1600&q=80"
            alt="Hotel Pool"
            className="w-full h-full object-cover opacity-50 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1F1C] via-[#0A1F1C]/70 to-[#0A1F1C]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight">Ready to Get Started?</h2>
          <p className="mt-4 text-base sm:text-lg text-[#CCFBF1] font-medium">Join thousands of hotels already using Grand Royale.</p>
          <Link
            href="/register-hotel"
            className="mt-8 inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[#CCFBF1] hover:bg-[#A7F3D0] text-[#0A1F1C] font-bold text-sm transition-all shadow-lg"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Custom Solution */}
      <section className="py-20 bg-white border-t border-[#DDE8E6]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-[#F8FAFA] rounded-3xl border border-[#DDE8E6] overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-sm">
            <div className="p-8 md:p-12 md:w-2/3">
              <h3 className="text-2xl sm:text-3xl font-sans font-bold text-[#0F172A] tracking-tight">Need a Custom Solution?</h3>
              <p className="text-sm sm:text-base text-[#64748B] mt-3 mb-8 max-w-md leading-relaxed">
                We also offer custom plans for large hotel chains and enterprise needs. Get in touch with us to learn more.
              </p>
              <Link
                href="/contact"
                className="inline-flex px-8 py-4 rounded-full bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-sm transition-colors shadow-md"
              >
                Contact Our Sales Team
              </Link>
            </div>
            <div className="hidden md:block w-1/3 h-full self-stretch relative min-h-[300px]">
              <img
                src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80"
                alt="Luxury Resort"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
