"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Send,
  CheckCircle2,
  Building,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    hotelName: "",
    subject: "General Inquiry",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      {/* Header */}
      <section className="relative pt-16 pb-12 px-6 text-center bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#b48c5a]/30 bg-[#b48c5a]/10 px-4 py-1.5 text-xs font-semibold text-[#8c6636] mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>24/7 Dedicated Hospitality Support</span>
          </div>

          <h1 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 tracking-wide">
            Get in Touch with Our <span className="gold-text-gradient">Hotel Specialists</span>
          </h1>

          <p className="mt-3 text-sm md:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Have questions regarding custom enterprise onboarding, API integrations, or multi-property deployments? We are here to help.
          </p>
        </div>
      </section>

      {/* Contact Content Grid */}
      <section className="py-8 px-6">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left info column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                Contact Information
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Reach out to our global hotel onboarding and tech support team. We respond within 1 hour for high-priority inquiries.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#8c6636]">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Direct Phone</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">+91 98765 43210 / +91 79 4000 8000</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#8c6636]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Email Support</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">support@grandroyalehotel.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#8c6636]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Corporate Headquarters</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      Grand Royale Tower, SG Highway, Ahmedabad, Gujarat, India 380015
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[#8c6636]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Operating Hours</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">24/7 Operations &amp; Support</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Registration Reminder Card */}
            <div className="bg-white rounded-2xl p-6 border-2 border-[#b48c5a]/40 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Building className="w-5 h-5 text-[#8c6636]" />
                <h3 className="font-serif text-lg font-bold text-slate-900">Ready to Register Your Hotel?</h3>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Skip the inquiry and jump straight into your 30-Day Free Trial.
              </p>
              <a
                href="/register-hotel"
                className="inline-block text-xs font-bold text-[#8c6636] hover:text-[#b48c5a] underline underline-offset-4"
              >
                Go to Hotel Registration Form →
              </a>
            </div>
          </div>

          {/* Right inquiry form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-8 md:p-10 border border-slate-200 shadow-sm">
              {submitted ? (
                <div className="py-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2">
                    Inquiry Received!
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto mb-5">
                    Thank you, <strong className="text-[#8c6636]">{formData.fullName}</strong>. Our hotel onboarding team will contact you at <strong className="text-slate-900">{formData.email}</strong> shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        fullName: "",
                        email: "",
                        phone: "",
                        hotelName: "",
                        subject: "General Inquiry",
                        message: "",
                      });
                    }}
                    className="rounded-lg bg-slate-100 px-6 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-200 transition-all"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="font-serif text-2xl font-bold text-slate-900 mb-1">
                    Send Us a Message
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Jatin Kakadiya"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#b48c5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#b48c5a]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                        Work Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="jatin@hotel.com"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#b48c5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#b48c5a]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#b48c5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#b48c5a]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                        Hotel / Property Name
                      </label>
                      <input
                        type="text"
                        value={formData.hotelName}
                        onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                        placeholder="Grand Royale Palace"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#b48c5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#b48c5a]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Inquiry Topic
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#b48c5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#b48c5a]"
                    >
                      <option value="General Inquiry">General Product Inquiry</option>
                      <option value="Enterprise Sales">Enterprise / Multi-Property Sales</option>
                      <option value="Technical Support">Technical &amp; API Support</option>
                      <option value="Trial Setup">Assistance with 30-Day Free Trial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your hotel requirements or questions..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#b48c5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#b48c5a]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b48c5a] to-[#8c6636] py-3.5 text-xs font-bold text-white shadow-md hover:scale-[1.01] transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Sending Message...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Inquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
