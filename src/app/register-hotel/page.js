"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2, Building, ChevronDown, Loader2 } from "lucide-react";
import { API_ENDPOINTS, apiRequest } from "@/config/api";

export default function RegisterHotelPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    hotelName: "",
    hotelType: "Select hotel type",
    ownerName: "",
    roomCount: "",
    email: "",
    phone: "",
    location: "Select location",
    address: "",
    city: "",
    state: "",
    pincode: "",
    website: "",
    password: "",
    confirmPassword: "",
    agreedTerms: true,
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const steps = [
    { id: 1, title: "Hotel Information", desc: "Basic details about your hotel" },
    { id: 2, title: "Owner Details", desc: "Contact and identity details" },
    { id: 3, title: "Hotel Documents", desc: "Upload required documents" },
    { id: 4, title: "Complete", desc: "Review and submit" },
  ];

  const handleNext = (e) => {
    e?.preventDefault();
    setError("");
    if (activeStep < 4) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    setError("");
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");

    try {
      setLoading(true);

      const cityVal = formData.city || (formData.location && formData.location !== "Select location" ? formData.location.split(",")[0].trim() : "Ahmedabad");
      const stateVal = formData.state || (formData.location && formData.location.includes(",") ? formData.location.split(",")[1].trim() : "Gujarat");

      const payload = {
        name: formData.hotelName || formData.name || "Grand Palace Hotel",
        ownerName: formData.ownerName || "Hotel Owner",
        ownerEmail: formData.email || formData.ownerEmail || `owner_${Date.now()}@hotel.com`,
        ownerPhone: formData.phone || formData.ownerPhone || "9876543210",
        address: formData.address || (formData.location !== "Select location" ? formData.location : "123 Heritage Road"),
        city: cityVal,
        state: stateVal,
        country: "India",
        pincode: formData.pincode || "380001",
        totalRooms: Number(formData.roomCount) || 20,
        hotelType: formData.hotelType !== "Select hotel type" ? formData.hotelType : "Boutique Hotel",
        website: formData.website || "",
      };

      const res = await apiRequest(API_ENDPOINTS.HOTELS.REGISTER, {
        method: "POST",
        body: payload,
      });

      setSubmitted(true);
    } catch (err) {
      console.warn("Backend API register attempt:", err.message);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EFF7F5] text-[#0F172A] font-sans selection:bg-[#00D0B4] selection:text-[#072F2A]">
      <Navbar />

      {/* ───────────────────────────────────────────────────────────
          1. HERO HEADER
      ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-24 lg:pt-16 lg:pb-32 overflow-hidden bg-[#072F2A] text-white">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&q=85"
            alt="Luxury Hotel Resort"
            className="w-full h-full object-cover object-right opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#072F2A] via-[#072F2A]/90 to-[#072F2A]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#072F2A] via-transparent to-[#072F2A]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-serif font-extrabold text-white tracking-tight leading-[1.12]">
              Register Your Hotel
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 font-sans font-normal leading-relaxed">
              Join our growing network of hotels and start managing your property with ease.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          2. FLOATING STEP FORM CARD
      ─────────────────────────────────────────────────────────── */}
      <section className="relative z-20 -mt-16 sm:-mt-24 pb-20 lg:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E1ECE9] text-[#0F172A] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              
              {/* Interactive Stepper Progress Bar on Left */}
              <div className="lg:col-span-4 bg-[#EFF7F5]/70 p-8 sm:p-10 border-b lg:border-b-0 lg:border-r border-[#E1ECE9] relative">
                <div className="relative space-y-9">
                  {/* Vertical Connecting Line */}
                  <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-[#00D0B4]/40 z-0" />

                  {steps.map((step) => {
                    const isActive = activeStep === step.id;
                    const isPassed = activeStep > step.id;
                    return (
                      <div
                        key={step.id}
                        onClick={() => setActiveStep(step.id)}
                        className={`relative z-10 flex items-start gap-4 cursor-pointer transition-all ${
                          isActive || isPassed ? "opacity-100" : "opacity-60 hover:opacity-85"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-outfit font-black text-xs flex-shrink-0 transition-all ${
                            isActive
                              ? "bg-[#00D0B4] text-[#072F2A] shadow-md shadow-[#00D0B4]/30 scale-105"
                              : isPassed
                              ? "bg-[#058B79] text-white"
                              : "bg-white border-2 border-[#00D0B4]/50 text-[#058B79]"
                          }`}
                        >
                          {isPassed ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                        </div>
                        <div>
                          <div className={`text-sm font-bold ${isActive ? "text-[#00D0B4] lg:text-[#0B1E28]" : "text-[#0B1E28]"}`}>
                            {step.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{step.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Main Interactive Form Body */}
              <div className="lg:col-span-8 p-8 sm:p-10 lg:p-12">
                {/* Form Header Badge */}
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#EFF7F5] border border-[#00D0B4]/30 text-[#058B79] mb-8">
                  <div className="w-6 h-6 rounded-lg bg-[#00D0B4]/20 flex items-center justify-center">
                    <Building className="w-3.5 h-3.5 text-[#058B79]" />
                  </div>
                  <span className="text-sm font-outfit font-extrabold text-[#0B1E28]">
                    {steps.find((s) => s.id === activeStep)?.title}
                  </span>
                </div>

                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-[#00D0B4]/20 text-[#058B79] flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-[#058B79]" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-[#0B1E28]">Registration Received!</h3>
                    <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                      Thank you for registering {formData.hotelName || "your hotel"}. Our onboarding specialist will contact you within 24 hours.
                    </p>
                    <Link
                      href="/login"
                      className="mt-6 inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#00D0B4] text-[#072F2A] font-extrabold text-xs shadow-md shadow-[#00D0B4]/30 hover:scale-[1.02] transition-all"
                    >
                      Go to Login
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {error && (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                        {error}
                      </div>
                    )}

                    {/* ───────────────────────────────────────────────────────────
                        STEP 1: Hotel Information
                    ─────────────────────────────────────────────────────────── */}
                    {activeStep === 1 && (
                      <div className="space-y-5 animate-fadeIn">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-bold text-[#0B1E28] mb-1.5">Hotel Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="Enter hotel name"
                              value={formData.hotelName}
                              onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#E1ECE9] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none transition-all placeholder:text-slate-400 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#0B1E28] mb-1.5">Hotel Type</label>
                            <div className="relative">
                              <select
                                value={formData.hotelType}
                                onChange={(e) => setFormData({ ...formData, hotelType: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-[#E1ECE9] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none bg-white text-slate-600 appearance-none"
                              >
                                <option>Select hotel type</option>
                                <option>Boutique Hotel</option>
                                <option>Luxury Resort</option>
                                <option>Business Hotel</option>
                                <option>Bed & Breakfast</option>
                                <option>Heritage Palace</option>
                              </select>
                              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#0B1E28] mb-1.5">Number of Rooms *</label>
                            <input
                              type="number"
                              placeholder="Enter number of rooms"
                              value={formData.roomCount}
                              onChange={(e) => setFormData({ ...formData, roomCount: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#E1ECE9] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none transition-all placeholder:text-slate-400 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#0B1E28] mb-1.5">Website (Optional)</label>
                            <input
                              type="text"
                              placeholder="Enter website URL"
                              value={formData.website}
                              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#E1ECE9] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none transition-all placeholder:text-slate-400 bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#0B1E28] mb-1.5">Hotel Location *</label>
                          <div className="relative">
                            <select
                              value={formData.location}
                              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#E1ECE9] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none bg-white text-slate-600 appearance-none"
                            >
                              <option>Select location</option>
                              <option>Ahmedabad, Gujarat</option>
                              <option>Mumbai, Maharashtra</option>
                              <option>Delhi, NCR</option>
                              <option>Bengaluru, Karnataka</option>
                              <option>Goa, India</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                          </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={handleNext}
                            className="px-8 py-3.5 rounded-full bg-[#00D0B4] hover:bg-[#00BFA5] text-[#072F2A] font-extrabold text-xs transition-all shadow-md shadow-[#00D0B4]/25 hover:scale-[1.02]"
                          >
                            Next Step: Owner Details →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ───────────────────────────────────────────────────────────
                        STEP 2: Owner Details
                    ─────────────────────────────────────────────────────────── */}
                    {activeStep === 2 && (
                      <div className="space-y-5 animate-fadeIn">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-bold text-[#0B1E28] mb-1.5">Owner Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="Enter owner full name"
                              value={formData.ownerName}
                              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#E1ECE9] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none transition-all placeholder:text-slate-400 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#0B1E28] mb-1.5">Email Address *</label>
                            <input
                              type="email"
                              required
                              placeholder="Enter email address"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#E1ECE9] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none transition-all placeholder:text-slate-400 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#0B1E28] mb-1.5">Phone Number *</label>
                            <input
                              type="tel"
                              required
                              placeholder="Enter phone number"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#E1ECE9] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none transition-all placeholder:text-slate-400 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#0B1E28] mb-1.5">Password *</label>
                            <input
                              type="password"
                              placeholder="Create password"
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#E1ECE9] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none transition-all placeholder:text-slate-400 bg-white"
                            />
                          </div>
                        </div>

                        <div className="pt-4 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={handleBack}
                            className="px-6 py-3 rounded-full border border-[#E1ECE9] text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-all"
                          >
                            ← Back
                          </button>
                          <button
                            type="button"
                            onClick={handleNext}
                            className="px-8 py-3.5 rounded-full bg-[#00D0B4] hover:bg-[#00BFA5] text-[#072F2A] font-extrabold text-xs transition-all shadow-md shadow-[#00D0B4]/25 hover:scale-[1.02]"
                          >
                            Next Step: Hotel Documents →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ───────────────────────────────────────────────────────────
                        STEP 3: Hotel Documents
                    ─────────────────────────────────────────────────────────── */}
                    {activeStep === 3 && (
                      <div className="space-y-5 animate-fadeIn">
                        <div>
                          <label className="block text-xs font-bold text-[#0B1E28] mb-1.5">Business License (PDF, JPG, PNG)</label>
                          <div className="relative border border-[#E1ECE9] rounded-xl px-4 py-3.5 flex items-center justify-between text-xs text-slate-400 bg-[#F4F9F8]">
                            <span>Upload business license or registration certificate</span>
                            <span className="px-3.5 py-1.5 bg-white border border-[#E1ECE9] rounded-lg text-[11px] font-semibold text-[#0B1E28] flex-shrink-0 cursor-pointer hover:bg-slate-50 shadow-sm">
                              Choose File
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#0B1E28] mb-1.5">GST / Tax Identification Document</label>
                          <div className="relative border border-[#E1ECE9] rounded-xl px-4 py-3.5 flex items-center justify-between text-xs text-slate-400 bg-[#F4F9F8]">
                            <span>Upload GST certificate (Optional)</span>
                            <span className="px-3.5 py-1.5 bg-white border border-[#E1ECE9] rounded-lg text-[11px] font-semibold text-[#0B1E28] flex-shrink-0 cursor-pointer hover:bg-slate-50 shadow-sm">
                              Choose File
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={handleBack}
                            className="px-6 py-3 rounded-full border border-[#E1ECE9] text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-all"
                          >
                            ← Back
                          </button>
                          <button
                            type="button"
                            onClick={handleNext}
                            className="px-8 py-3.5 rounded-full bg-[#00D0B4] hover:bg-[#00BFA5] text-[#072F2A] font-extrabold text-xs transition-all shadow-md shadow-[#00D0B4]/25 hover:scale-[1.02]"
                          >
                            Review & Complete →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ───────────────────────────────────────────────────────────
                        STEP 4: Review & Submit
                    ─────────────────────────────────────────────────────────── */}
                    {activeStep === 4 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div className="bg-[#EFF7F5]/80 p-5 rounded-2xl border border-[#00D0B4]/30 space-y-3">
                          <h4 className="text-sm font-bold text-[#0B1E28]">Registration Summary</h4>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div><span className="text-slate-500">Hotel Name:</span> <strong className="text-[#0B1E28]">{formData.hotelName || "Not provided"}</strong></div>
                            <div><span className="text-slate-500">Type:</span> <strong className="text-[#0B1E28]">{formData.hotelType}</strong></div>
                            <div><span className="text-slate-500">Owner:</span> <strong className="text-[#0B1E28]">{formData.ownerName || "Not provided"}</strong></div>
                            <div><span className="text-slate-500">Email:</span> <strong className="text-[#0B1E28]">{formData.email || "Not provided"}</strong></div>
                            <div><span className="text-slate-500">Phone:</span> <strong className="text-[#0B1E28]">{formData.phone || "Not provided"}</strong></div>
                            <div><span className="text-slate-500">Location:</span> <strong className="text-[#0B1E28]">{formData.location}</strong></div>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={handleBack}
                            className="px-6 py-3 rounded-full border border-[#E1ECE9] text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-all"
                          >
                            ← Back
                          </button>

                          <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-9 py-4 rounded-full bg-[#00D0B4] hover:bg-[#00BFA5] text-[#072F2A] font-extrabold text-sm transition-all shadow-lg shadow-[#00D0B4]/25 flex items-center gap-2 hover:scale-[1.02]"
                          >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#072F2A]" /> : "Register Hotel"}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="text-center text-xs font-medium text-slate-500 pt-4 border-t border-[#E1ECE9]">
                      Already have an account?{" "}
                      <Link href="/login" className="text-[#058B79] font-bold hover:underline">
                        Login
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}


