"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  Check,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Building,
  Crown,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { API_ENDPOINTS, apiRequest } from "@/config/api";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState("annual"); // "monthly" | "annual"
  const [plansData, setPlansData] = useState({ monthly: [], annual: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await apiRequest(API_ENDPOINTS.SUBSCRIPTION_PLANS.PUBLIC);
      if (res?.success && res?.data) {
        setPlansData({
          monthly: res.data.monthly || [],
          annual: res.data.annual || [],
        });
      }
    } catch (err) {
      console.error("Failed to load subscription plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (index, plan) => {
    const name = (plan.name || "").toLowerCase();
    if (name.includes("enterprise") || plan.maxRooms >= 500) {
      return <Crown className="w-6 h-6 text-purple-700" />;
    }
    if (name.includes("pro") || plan.isPopular || index === 1) {
      return <Sparkles className="w-6 h-6 text-[#8c6636]" />;
    }
    return <Building className="w-6 h-6 text-slate-700" />;
  };

  const currentPlans = billingCycle === "annual" ? plansData.annual : plansData.monthly;

  const faqs = [
    {
      q: "How does the 30-Day Free Trial work?",
      a: "When you submit your hotel registration, Super Admin reviews your property and activates your account. Your 30-day trial begins immediately with zero payment required. You will have full access to all features.",
    },
    {
      q: "Do I need a credit card to register my hotel?",
      a: "No credit card or payment information is required to register and start your free trial. You only decide on a plan after your 30-day evaluation.",
    },
    {
      q: "Can I add more rooms or receptionists later?",
      a: "Yes! Hotel Admins can adjust room inventories, create new room types, and add unlimited front desk staff directly from their dashboard at any time.",
    },
    {
      q: "How are my hotel's data and guest records kept secure?",
      a: "Grand Royale utilizes strict multi-tenant data isolation. Each hotel's database records are cryptographically tagged and access-controlled. No staff member from another hotel can ever view your guest data.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-theme-main">
      <Navbar />

      {/* Header */}
      <section className="relative pt-16 pb-12 px-6 text-center bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full theme-badge px-4 py-1.5 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparent, Zero-Commission Pricing</span>
          </div>

          <h1 className="font-serif text-3xl md:text-5xl font-bold text-theme-main tracking-wide">
            Predictable Pricing for <span className="text-theme-gradient">Every Hotel</span>
          </h1>

          <p className="mt-3 text-sm md:text-base text-theme-muted max-w-xl mx-auto leading-relaxed">
            All plans start with a full-featured 30-Day Free Trial. No hidden commissions, no setup fees.
          </p>

          {/* Billing Switcher */}
          <div className="mt-6 inline-flex items-center rounded-xl bg-slate-200/70 p-1 border border-slate-200">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-lg px-5 py-2 text-xs font-semibold transition-all ${
                billingCycle === "monthly"
                  ? "bg-white text-theme-main shadow-sm"
                  : "text-theme-muted hover:text-theme-main"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`rounded-lg px-5 py-2 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                billingCycle === "annual"
                  ? "bg-white text-theme-main shadow-sm"
                  : "text-theme-muted hover:text-theme-main"
              }`}
            >
              <span>Annual Billing</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                Save up to 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[#8c6636] animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading subscription plans...</p>
          </div>
        ) : currentPlans.length === 0 ? (
          <div className="mx-auto max-w-xl text-center py-16 px-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <ShieldCheck className="w-12 h-12 text-[#8c6636] mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold text-slate-800 mb-2">
              Start with a 30-Day Free Trial
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Custom subscription tiers are currently being tailored. Register your property today to enjoy full evaluation access with zero commitments.
            </p>
            <Link
              href="/register-hotel"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-theme-btn text-xs font-bold shadow-md hover:scale-105 transition-all"
            >
              <span>Register Your Hotel</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {currentPlans.map((plan, idx) => {
              const isPopular = plan.isPopular || (plan.badge && plan.badge.toLowerCase().includes("popular"));
              const roomText = plan.maxRooms >= 9999 ? "Unlimited Rooms" : `Up to ${plan.maxRooms} Rooms`;
              const ctaLink = plan.maxRooms >= 9999 ? "/contact" : "/register-hotel";
              const ctaText = plan.maxRooms >= 9999 ? "Contact Enterprise Sales" : "Start 30-Day Free Trial";

              return (
                <div
                  key={plan._id || idx}
                  className={`theme-card rounded-3xl p-8 flex flex-col justify-between relative transition-all ${
                    isPopular
                      ? "border-2 border-theme-primary shadow-xl scale-105"
                      : "shadow-sm hover:shadow-md"
                  }`}
                >
                  {(isPopular || plan.badge) && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-theme-btn px-4 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                      {plan.badge || "Most Popular"}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        {getTierIcon(idx, plan)}
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-theme-main">
                        {roomText}
                      </span>
                    </div>

                    <h3 className="font-serif text-2xl font-bold text-theme-main mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-theme-muted mb-6">
                      {plan.description || (plan.billingCycle === "ANNUAL" ? "Annual subscription license." : "Monthly subscription plan.")}
                    </p>

                    <div className="mb-6 pb-6 border-b border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-4xl font-bold text-theme-main">
                          ₹{Number(plan.price).toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-theme-muted">
                          {plan.billingCycle === "ANNUAL" ? "/year" : "/month"}
                        </span>
                      </div>
                      {plan.discountPercent > 0 && (
                        <span className="inline-block mt-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          Includes {plan.discountPercent}% discount
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 mb-8">
                      <p className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                        Includes:
                      </p>
                      {Array.isArray(plan.features) && plan.features.map((feat, fidx) => (
                        <div key={fidx} className="flex items-center gap-2.5 text-xs text-theme-main font-medium">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={ctaLink}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold transition-all ${
                      isPopular
                        ? "bg-theme-btn shadow-md hover:scale-105"
                        : "bg-slate-100 hover:bg-slate-200 text-theme-main"
                    }`}
                  >
                    <span>{ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-white border-t border-slate-200 mt-12">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-theme-primary">
              Got Questions?
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-theme-main mt-1">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-200"
              >
                <h3 className="font-serif text-base font-bold text-theme-main mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-theme-dark" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs text-theme-muted leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

