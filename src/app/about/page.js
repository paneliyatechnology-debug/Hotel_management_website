"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Building, Users, Zap, Headphones, Sparkles, ShieldCheck, Heart, Award, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFA] text-[#0F172A] font-sans selection:bg-[#0F766E] selection:text-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-20 pb-16 lg:pt-24 lg:pb-20 bg-[#0A1F1C] text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F766E]/40 border border-[#14B8A6]/40 text-[#14B8A6] text-xs font-semibold uppercase tracking-wider mb-4">
            About Grand Royale
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight">
            Built for Modern Hospitality
          </h1>
          <p className="mt-4 text-sm sm:text-base text-[#CBD5E1] max-w-2xl mx-auto">
            We're on a mission to make hotel management simple, efficient, and accessible for hoteliers across the globe.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-white border-b border-[#DDE8E6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0F172A]">Our Story</h2>
              <p className="mt-4 text-sm sm:text-base text-[#64748B] leading-relaxed">
                Grand Royale was founded with a clear vision: to help hoteliers manage their properties with ease. We noticed that existing legacy systems were clunky, outdated, and overly complicated.
              </p>
              <p className="mt-3 text-sm sm:text-base text-[#64748B] leading-relaxed">
                We engineered an intuitive, cloud-native platform that empowers hotel staff, delights arriving guests, and drives measurable revenue growth from day one.
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden shadow-xl border border-[#DDE8E6] aspect-[16/10]">
                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=80"
                  alt="Grand Royale Story"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* 4 Stats */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="p-6 rounded-2xl bg-[#F8FAFA] border border-[#DDE8E6]">
              <div className="text-3xl font-serif font-bold text-[#0F766E]">500+</div>
              <div className="text-xs text-[#64748B] font-semibold mt-1">Active Hotels</div>
            </div>
            <div className="p-6 rounded-2xl bg-[#F8FAFA] border border-[#DDE8E6]">
              <div className="text-3xl font-serif font-bold text-[#0F766E]">50K+</div>
              <div className="text-xs text-[#64748B] font-semibold mt-1">Happy Guests</div>
            </div>
            <div className="p-6 rounded-2xl bg-[#F8FAFA] border border-[#DDE8E6]">
              <div className="text-3xl font-serif font-bold text-[#0F766E]">99.9%</div>
              <div className="text-xs text-[#64748B] font-semibold mt-1">Cloud Uptime</div>
            </div>
            <div className="p-6 rounded-2xl bg-[#F8FAFA] border border-[#DDE8E6]">
              <div className="text-3xl font-serif font-bold text-[#0F766E]">24/7</div>
              <div className="text-xs text-[#64748B] font-semibold mt-1">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-[#F8FAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0F172A]">Our Values</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-[#DDE8E6] shadow-sm text-center">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-[#0F172A] mb-1">Innovation</h3>
              <p className="text-xs text-[#64748B]">Always improving our platform.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#DDE8E6] shadow-sm text-center">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center mx-auto mb-4">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-[#0F172A] mb-1">Customer First</h3>
              <p className="text-xs text-[#64748B]">Your success is our top priority.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#DDE8E6] shadow-sm text-center">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-[#0F172A] mb-1">Trust & Security</h3>
              <p className="text-xs text-[#64748B]">Your data is always protected.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#DDE8E6] shadow-sm text-center">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center mx-auto mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-[#0F172A] mb-1">Excellence</h3>
              <p className="text-xs text-[#64748B]">In everything we build & deliver.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
