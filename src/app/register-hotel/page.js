"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  ChevronDown,
  CheckCircle2,
  Loader2,
  Upload,
  ShieldCheck,
} from "lucide-react";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { setAuthCookies } from "@/shared/utils/cookieAuth";

export default function RegisterHotelPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    hotelName: "",
    hotelType: "",
    customHotelType: "",
    ownerName: "",
    roomCount: "",
    email: "",
    website: "",
    phone: "",
    businessLicense: null,
    businessLicenseName: "",
    location: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    idNumber: "",
    emergencyPhone: "",
    gstNumber: "",
    panNumber: "",
    ownershipDocName: "",
    agreedTerms: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const steps = [
    {
      id: 1,
      title: "Hotel Information",
      desc: "Basic details about your hotel",
    },
    {
      id: 2,
      title: "Owner Details",
      desc: "Contact and identity details",
    },
    {
      id: 3,
      title: "Hotel Documents",
      desc: "Upload required documents",
    },
    {
      id: 4,
      title: "Complete",
      desc: "Review and submit",
    },
  ];

  const handleStepClick = (targetStepId) => {
    if (targetStepId < activeStep) {
      setError("");
      setActiveStep(targetStepId);
    }
  };

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateStep = (step) => {
    const errors = {};
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(formData.email || "").trim());
    const phoneDigits = String(formData.phone || "").replace(/\D/g, "");
    const pinDigits = String(formData.pincode || "").replace(/\D/g, "");
    const rooms = Number(formData.roomCount);
    const gst = String(formData.gstNumber || "").trim().toUpperCase();
    const pan = String(formData.panNumber || "").trim().toUpperCase();

    if (step === 1) {
      if (!formData.hotelName.trim()) errors.hotelName = "Hotel name is required.";
      if (!formData.hotelType) errors.hotelType = "Select a hotel type.";
      else if (formData.hotelType === "Custom" && !formData.customHotelType.trim()) errors.hotelType = "Enter your hotel type.";
      if (!formData.ownerName.trim()) errors.ownerName = "Owner name is required.";
      if (!formData.roomCount || !Number.isFinite(rooms) || rooms < 1) errors.roomCount = "Enter at least 1 room.";
      if (!formData.email.trim()) errors.email = "Email is required.";
      else if (!emailOk) errors.email = "Enter a valid email address.";
      if (!phoneDigits) errors.phone = "Phone number is required.";
      else if (phoneDigits.length !== 10) errors.phone = "Enter a 10-digit mobile number.";
      if (formData.website.trim() && !/^https?:\/\/.+\..+/.test(formData.website.trim())) {
        errors.website = "Enter a full website URL, like https://hotel.com";
      }
    }

    if (step === 2) {
      if (!formData.address.trim()) errors.address = "Property address is required.";
      if (!formData.city.trim()) errors.city = "City is required.";
      if (!formData.state.trim()) errors.state = "State is required.";
      if (!pinDigits) errors.pincode = "Pincode is required.";
      else if (pinDigits.length !== 6) errors.pincode = "Pincode must be 6 digits.";
    }

    if (step === 3) {
      if (gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst)) {
        errors.gstNumber = "Enter a valid 15-character GST number, or leave it blank.";
      }
      if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
        errors.panNumber = "Enter a valid 10-character PAN, or leave it blank.";
      }
    }

    if (step === 4 && !formData.agreedTerms) {
      errors.agreedTerms = "Please accept the terms before submitting.";
    }

    return errors;
  };

  const handleNextStep = (e) => {
    if (e) e.preventDefault();
    setError("");
    const errors = validateStep(activeStep);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Please fix the highlighted fields before continuing.");
      return;
    }
    if (activeStep < 4) setActiveStep(activeStep + 1);
  };

  const handleBackStep = () => {
    setError("");
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    const stepErrors = { ...validateStep(1), ...validateStep(2), ...validateStep(3), ...validateStep(4) };
    if (Object.keys(stepErrors).length > 0) {
      setFieldErrors(stepErrors);
      setError("Please fix the highlighted fields before submitting.");
      if (stepErrors.hotelName || stepErrors.hotelType || stepErrors.ownerName || stepErrors.roomCount || stepErrors.email || stepErrors.phone || stepErrors.website) setActiveStep(1);
      else if (stepErrors.address || stepErrors.city || stepErrors.state || stepErrors.pincode) setActiveStep(2);
      else if (stepErrors.gstNumber || stepErrors.panNumber) setActiveStep(3);
      return;
    }

    const cleanPincode = String(formData.pincode || "").replace(/\D/g, "");
    const cleanPhone = String(formData.phone || "").replace(/\D/g, "").slice(-10);

    try {
      setLoading(true);

      const payload = {
        name: formData.hotelName.trim(),
        ownerName: formData.ownerName.trim(),
        ownerEmail: formData.email.toLowerCase().trim(),
        ownerPhone: cleanPhone,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: "India",
        pincode: cleanPincode,
        totalRooms: Number(formData.roomCount),
        hotelType: formData.hotelType === "Custom" ? formData.customHotelType.trim() : formData.hotelType,
        website: (formData.website || "").trim(),
      };

      // Only attach GSTIN if valid 15-char format
      const gstTrimmed = (formData.gstNumber || "").trim().toUpperCase();
      if (/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstTrimmed)) {
        payload.gstNumber = gstTrimmed;
      }

      // Only attach PAN if valid 10-char format
      const panTrimmed = (formData.panNumber || "").trim().toUpperCase();
      if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panTrimmed)) {
        payload.panNumber = panTrimmed;
      }

      const res = await apiRequest(API_ENDPOINTS.HOTELS.REGISTER, {
        method: "POST",
        body: payload,
      });

      if (res?.data?.auth?.accessToken) {
        localStorage.setItem("token", res.data.auth.accessToken);
        if (res.data.admin) {
          localStorage.setItem("user", JSON.stringify(res.data.admin));
        }
        setAuthCookies({
          accessToken: res.data.auth.accessToken,
          user: res.data.admin,
        });
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Backend API register error:", err.message);
      setError(
        err.message || "Hotel registration failed. Please check your inputs and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: file,
        [`${fieldName}Name`]: file.name,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F7F5] text-[#0F172A] font-sans selection:bg-[#00D0B4] selection:text-[#072F2A]">
      <Navbar />

      {/* ───────────────────────────────────────────────────────────
          1. HERO HEADER SECTION
      ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-28 lg:pt-16 lg:pb-36 overflow-hidden bg-[#073832] text-white">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&q=85"
            alt="Luxury Hotel Resort"
            className="w-full h-full object-cover object-right opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#073832] via-[#073832]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#073832] via-transparent to-[#073832]/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-serif font-extrabold text-white tracking-tight leading-[1.15]">
              Register Your Hotel
            </h1>
            <p className="mt-3.5 text-base sm:text-lg text-emerald-100/90 font-sans font-normal leading-relaxed">
              Join our growing network of hotels and start managing your property with ease.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          2. FLOATING CARD WITH STEPPER & FORM
      ─────────────────────────────────────────────────────────── */}
      <section className="relative z-20 -mt-20 sm:-mt-28 pb-20 lg:pb-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              
              {/* ── LEFT COLUMN: STEPPER SIDEBAR (Mobile Horizontal "aadu" + Desktop Vertical "ubhu") ── */}
              <div className="lg:col-span-4 bg-[#F5FBF9] p-5 sm:p-7 lg:p-9 border-b lg:border-b-0 lg:border-r border-emerald-100/70 relative">
                
                {/* MOBILE HORIZONTAL STEPPER (< lg) */}
                <div className="lg:hidden">
                  <div className="flex items-center justify-between relative px-2">
                    {steps.map((step, idx) => {
                      const isActive = activeStep === step.id;
                      const isPassed = activeStep > step.id;
                      const isFuture = step.id > activeStep;
                      const isLast = idx === steps.length - 1;

                      return (
                        <div key={step.id} className="flex-1 flex items-center relative">
                          <div
                            onClick={() => handleStepClick(step.id)}
                            className={`flex flex-col items-center gap-1 z-10 mx-auto ${
                              isPassed ? "cursor-pointer" : isFuture ? "cursor-not-allowed opacity-60" : "cursor-default"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                isActive
                                  ? "bg-[#00C2A8] text-white shadow-md shadow-[#00C2A8]/30 ring-2 ring-[#00C2A8]/30 scale-105"
                                  : isPassed
                                  ? "bg-[#058B79] text-white"
                                  : "bg-white border-2 border-emerald-300 text-emerald-700"
                              }`}
                            >
                              {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.id}
                            </div>
                            <span
                              className={`text-[10px] font-bold text-center transition-colors whitespace-nowrap ${
                                isActive ? "text-[#00C2A8]" : "text-slate-600"
                              }`}
                            >
                              {step.id === 1 ? "Hotel" : step.id === 2 ? "Owner" : step.id === 3 ? "Docs" : "Finish"}
                            </span>
                          </div>

                          {/* Connecting Horizontal Line between steps */}
                          {!isLast && (
                            <div
                              className={`flex-1 h-[2px] -mx-1 mb-4 transition-colors ${
                                isPassed ? "bg-[#058B79]" : "bg-emerald-200"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* DESKTOP VERTICAL STEPPER (>= lg) */}
                <div className="hidden lg:block relative space-y-8">
                  {/* Connecting Vertical Line */}
                  <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-emerald-200 z-0" />

                  {steps.map((step) => {
                    const isActive = activeStep === step.id;
                    const isPassed = activeStep > step.id;
                    const isFuture = step.id > activeStep;

                    return (
                      <div
                        key={step.id}
                        onClick={() => handleStepClick(step.id)}
                        className={`relative z-10 flex items-start gap-4 transition-all ${
                          isPassed
                            ? "cursor-pointer opacity-100 hover:opacity-90"
                            : isActive
                            ? "cursor-default opacity-100"
                            : "cursor-not-allowed opacity-45"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all ${
                            isActive
                              ? "bg-[#00C2A8] text-white shadow-md shadow-[#00C2A8]/30 scale-105"
                              : isPassed
                              ? "bg-[#058B79] text-white"
                              : "bg-white border-2 border-emerald-300 text-emerald-700"
                          }`}
                        >
                          {isPassed ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                        </div>
                        <div>
                          <div
                            className={`text-sm font-bold tracking-tight ${
                              isActive ? "text-[#00C2A8] lg:text-[#073832]" : "text-[#0F172A]"
                            }`}
                          >
                            {step.title}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {step.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── RIGHT COLUMN: FORM CONTENT AREA ── */}
              <div className="lg:col-span-8 p-7 sm:p-10 lg:p-11">
                
                {/* Form Badge Header */}
                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-[#058B79] mb-6 border border-emerald-100">
                  <div className="w-6 h-6 rounded-lg bg-[#00C2A8]/20 flex items-center justify-center">
                    <Building className="w-3.5 h-3.5 text-[#058B79]" />
                  </div>
                  <span className="text-xs font-bold tracking-wide text-[#073832]">
                    {steps.find((s) => s.id === activeStep)?.title}
                  </span>
                </div>

                {submitted ? (
                  <div className="text-center py-10 space-y-6">
                    <div className="w-16 h-16 rounded-full bg-[#00C2A8]/20 text-[#058B79] flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8 text-[#058B79]" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-[#073832]">
                        Registration Successful!
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                        Thank you for registering <strong>{formData.hotelName || "your hotel"}</strong>. Your admin account is active.
                      </p>
                    </div>

                    <div className="bg-[#F0F7F5] border border-[#00C2A8]/40 rounded-2xl p-5 max-w-md mx-auto text-center shadow-sm">
                      <div className="text-sm font-bold text-[#073832]">
                        Check your email
                      </div>
                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                        We have sent your PMS login details to your email. Please check your inbox.
                      </p>
                    </div>

                    <div className="pt-2">
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#00C2A8] hover:bg-[#00A892] text-white font-extrabold text-xs shadow-md shadow-[#00C2A8]/30 transition-all hover:scale-[1.02]"
                      >
                        Go to Login Portal →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={activeStep === 4 ? handleSubmit : handleNextStep} className="space-y-5">
                    {error && (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                        {error}
                      </div>
                    )}

                    {/* ───────────────────────────────────────────────────────────
                        STEP 1: HOTEL INFORMATION (Matches Image 100%)
                    ─────────────────────────────────────────────────────────── */}
                    {activeStep === 1 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Hotel Name *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Enter hotel name"
                              value={formData.hotelName}
                              onChange={(e) => updateField("hotelName", e.target.value)}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 outline-none transition-all placeholder:text-slate-300 ${fieldErrors.hotelName ? "border-red-400 bg-red-50/40 focus:ring-red-300" : "border-slate-200 bg-[#F8FAFC] focus:ring-[#00C2A8] focus:border-[#00C2A8]"}`}
                            />
                            {fieldErrors.hotelName && <p className="text-[10px] text-red-600 mt-1 font-semibold">{fieldErrors.hotelName}</p>}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Hotel Type *
                            </label>
                            <div className="relative">
                              <select
                                value={formData.hotelType}
                                onChange={(e) => updateField("hotelType", e.target.value)}
                                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 outline-none appearance-none pr-9 ${fieldErrors.hotelType ? "border-red-400 bg-red-50/40 text-red-900 focus:ring-red-300" : "border-slate-200 bg-[#F8FAFC] text-slate-700 focus:ring-[#00C2A8] focus:border-[#00C2A8]"}`}
                              >
                                <option value="">Select hotel type</option>
                                <option>Luxury Boutique Hotel</option>
                                <option>Boutique Hotel</option>
                                <option>Luxury Resort</option>
                                <option>Business Hotel</option>
                                <option>Heritage Palace</option>
                                <option>Bed &amp; Breakfast</option>
                                <option value="Custom">Custom hotel type</option>
                              </select>
                              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                            </div>
                            {formData.hotelType === "Custom" && (
                              <input
                                type="text"
                                required
                                placeholder="Enter your hotel type"
                                value={formData.customHotelType}
                                onChange={(e) => updateField("customHotelType", e.target.value)}
                                className={`mt-2 w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 outline-none transition-all placeholder:text-slate-300 ${fieldErrors.hotelType ? "border-red-400 bg-red-50/40 focus:ring-red-300" : "border-slate-200 bg-[#F8FAFC] focus:ring-[#00C2A8] focus:border-[#00C2A8]"}`}
                              />
                            )}
                            {fieldErrors.hotelType && <p className="text-[10px] text-red-600 mt-1 font-semibold">{fieldErrors.hotelType}</p>}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Owner Name *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Enter owner name"
                              value={formData.ownerName}
                              onChange={(e) => updateField("ownerName", e.target.value)}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 outline-none transition-all placeholder:text-slate-300 ${fieldErrors.ownerName ? "border-red-400 bg-red-50/40 focus:ring-red-300" : "border-slate-200 bg-[#F8FAFC] focus:ring-[#00C2A8] focus:border-[#00C2A8]"}`}
                            />
                            {fieldErrors.ownerName && <p className="text-[10px] text-red-600 mt-1 font-semibold">{fieldErrors.ownerName}</p>}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Number of Rooms *
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              placeholder="Enter number of rooms"
                              value={formData.roomCount}
                              onChange={(e) => updateField("roomCount", e.target.value)}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 outline-none transition-all placeholder:text-slate-300 ${fieldErrors.roomCount ? "border-red-400 bg-red-50/40 focus:ring-red-300" : "border-slate-200 bg-[#F8FAFC] focus:ring-[#00C2A8] focus:border-[#00C2A8]"}`}
                            />
                            {fieldErrors.roomCount && <p className="text-[10px] text-red-600 mt-1 font-semibold">{fieldErrors.roomCount}</p>}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Email Address *
                            </label>
                            <input
                              type="email"
                              required
                              placeholder="Enter email address"
                              value={formData.email}
                              onChange={(e) => updateField("email", e.target.value)}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 outline-none transition-all placeholder:text-slate-300 ${fieldErrors.email ? "border-red-400 bg-red-50/40 focus:ring-red-300" : "border-slate-200 bg-[#F8FAFC] focus:ring-[#00C2A8] focus:border-[#00C2A8]"}`}
                            />
                            {fieldErrors.email && <p className="text-[10px] text-red-600 mt-1 font-semibold">{fieldErrors.email}</p>}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Website (Optional)
                            </label>
                            <input
                              type="url"
                              placeholder="Enter website"
                              value={formData.website}
                              onChange={(e) => updateField("website", e.target.value)}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 outline-none transition-all placeholder:text-slate-300 ${fieldErrors.website ? "border-red-400 bg-red-50/40 focus:ring-red-300" : "border-slate-200 bg-[#F8FAFC] focus:ring-[#00C2A8] focus:border-[#00C2A8]"}`}
                            />
                            {fieldErrors.website && <p className="text-[10px] text-red-600 mt-1 font-semibold">{fieldErrors.website}</p>}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              required
                              placeholder="Enter phone number"
                              maxLength={10}
                              value={formData.phone}
                              onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 outline-none transition-all placeholder:text-slate-300 ${fieldErrors.phone ? "border-red-400 bg-red-50/40 focus:ring-red-300" : "border-slate-200 bg-[#F8FAFC] focus:ring-[#00C2A8] focus:border-[#00C2A8]"}`}
                            />
                            {fieldErrors.phone && <p className="text-[10px] text-red-600 mt-1 font-semibold">{fieldErrors.phone}</p>}
                          </div>

                        </div>

                        {/* Submit / Next Button */}
                        <div className="pt-4 space-y-3">
                          <button
                            type="button"
                            onClick={handleNextStep}
                            className="w-full py-3.5 rounded-xl bg-[#00C2A8] hover:bg-[#00A892] text-white font-bold text-sm shadow-md shadow-[#00C2A8]/25 transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
                          >
                            <span>Next Step: Owner Details →</span>
                          </button>

                          <div className="text-center text-xs text-slate-500 font-medium">
                            Already have an account?{" "}
                            <Link href="/login" className="text-[#00C2A8] font-bold hover:underline">
                              Login
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ───────────────────────────────────────────────────────────
                        STEP 2: OWNER DETAILS
                    ─────────────────────────────────────────────────────────── */}
                    {activeStep === 2 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Complete Property Address *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Enter property address"
                              value={formData.address}
                              onChange={(e) => updateField("address", e.target.value)}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 outline-none ${fieldErrors.address ? "border-red-400 bg-red-50/40 focus:ring-red-300" : "border-slate-200 bg-[#F8FAFC] focus:ring-[#00C2A8]"}`}
                            />
                            {fieldErrors.address && <p className="text-[10px] text-red-600 mt-1 font-semibold">{fieldErrors.address}</p>}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              City *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Enter city"
                              value={formData.city}
                              onChange={(e) => updateField("city", e.target.value)}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 outline-none ${fieldErrors.city ? "border-red-400 bg-red-50/40 focus:ring-red-300" : "border-slate-200 bg-[#F8FAFC] focus:ring-[#00C2A8]"}`}
                            />
                            {fieldErrors.city && <p className="text-[10px] text-red-600 mt-1 font-semibold">{fieldErrors.city}</p>}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              State *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Enter state"
                              value={formData.state}
                              onChange={(e) => updateField("state", e.target.value)}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 outline-none ${fieldErrors.state ? "border-red-400 bg-red-50/40 focus:ring-red-300" : "border-slate-200 bg-[#F8FAFC] focus:ring-[#00C2A8]"}`}
                            />
                            {fieldErrors.state && <p className="text-[10px] text-red-600 mt-1 font-semibold">{fieldErrors.state}</p>}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Pincode / Postal Code * (6 Digits)
                            </label>
                            <input
                              type="text"
                              required
                              maxLength={6}
                              placeholder="Enter 6-digit pincode"
                              value={formData.pincode}
                              onChange={(e) => updateField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 outline-none transition-all ${
                                fieldErrors.pincode
                                  ? "border-red-400 focus:ring-red-300 bg-red-50/40 text-red-900"
                                  : "border-slate-200 focus:ring-[#00C2A8] bg-[#F8FAFC]"
                              }`}
                            />
                            {fieldErrors.pincode && (
                              <p className="text-[10px] text-red-600 mt-1 font-semibold">{fieldErrors.pincode}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Country
                            </label>
                            <input
                              type="text"
                              disabled
                              value="India"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-100 text-slate-500 cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                          <button
                            type="button"
                            onClick={handleBackStep}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
                          >
                            ← Back
                          </button>
                          <button
                            type="button"
                            onClick={handleNextStep}
                            className="px-7 py-2.5 rounded-xl bg-[#00C2A8] hover:bg-[#00A892] text-white font-bold text-xs shadow-md shadow-[#00C2A8]/20"
                          >
                            Next Step →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ───────────────────────────────────────────────────────────
                        STEP 3: HOTEL DOCUMENTS
                    ─────────────────────────────────────────────────────────── */}
                    {activeStep === 3 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              GST Number (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 24ABCDE1234F1Z5"
                              value={formData.gstNumber}
                              onChange={(e) => updateField("gstNumber", e.target.value.toUpperCase())}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 outline-none ${fieldErrors.gstNumber ? "border-red-400 bg-red-50/40 focus:ring-red-300" : "border-slate-200 bg-[#F8FAFC] focus:ring-[#00C2A8]"}`}
                            />
                            {fieldErrors.gstNumber && <p className="text-[10px] text-red-600 mt-1 font-semibold">{fieldErrors.gstNumber}</p>}
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              PAN Number (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. ABCDE1234F"
                              value={formData.panNumber}
                              onChange={(e) => updateField("panNumber", e.target.value.toUpperCase())}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 outline-none ${fieldErrors.panNumber ? "border-red-400 bg-red-50/40 focus:ring-red-300" : "border-slate-200 bg-[#F8FAFC] focus:ring-[#00C2A8]"}`}
                            />
                            {fieldErrors.panNumber && <p className="text-[10px] text-red-600 mt-1 font-semibold">{fieldErrors.panNumber}</p>}
                          </div>

                        </div>

                        <div className="flex items-center justify-between pt-4">
                          <button
                            type="button"
                            onClick={handleBackStep}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
                          >
                            ← Back
                          </button>
                          <button
                            type="button"
                            onClick={handleNextStep}
                            className="px-7 py-2.5 rounded-xl bg-[#00C2A8] hover:bg-[#00A892] text-white font-bold text-xs shadow-md shadow-[#00C2A8]/20"
                          >
                            Review Details →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ───────────────────────────────────────────────────────────
                        STEP 4: COMPLETE & SUBMIT
                    ─────────────────────────────────────────────────────────── */}
                    {activeStep === 4 && (
                      <div className="space-y-5">
                        <div className="bg-[#F0F7F5] p-4 rounded-2xl border border-emerald-200 space-y-2 text-xs">
                          <h4 className="font-bold text-[#073832] text-sm">Registration Summary</h4>
                          <div className="grid grid-cols-2 gap-2 text-slate-700">
                            <div><span className="text-slate-500">Hotel Name:</span> <strong>{formData.hotelName || "Not set"}</strong></div>
                            <div><span className="text-slate-500">Hotel Type:</span> <strong>{formData.hotelType === "Custom" ? formData.customHotelType : formData.hotelType}</strong></div>
                            <div><span className="text-slate-500">Owner Name:</span> <strong>{formData.ownerName || "Not set"}</strong></div>
                            <div><span className="text-slate-500">Email:</span> <strong>{formData.email || "Not set"}</strong></div>
                            <div><span className="text-slate-500">Phone:</span> <strong>{formData.phone || "Not set"}</strong></div>
                            <div><span className="text-slate-500">City:</span> <strong>{formData.city || "Not set"}</strong></div>
                          </div>
                        </div>

                        <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 leading-relaxed select-none">
                          <input
                            type="checkbox"
                            checked={formData.agreedTerms}
                            onChange={(e) => updateField("agreedTerms", e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded text-[#00C2A8] focus:ring-[#00C2A8] accent-[#00C2A8]"
                          />
                          <span>
                            I confirm that all information provided is accurate and agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>.
                          </span>
                        </label>
                        {fieldErrors.agreedTerms && <p className="text-[10px] text-red-600 font-semibold">{fieldErrors.agreedTerms}</p>}

                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={handleBackStep}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
                          >
                            ← Back
                          </button>
                          <button
                            type="submit"
                            disabled={loading || !formData.agreedTerms}
                            className="px-8 py-3 rounded-xl bg-[#00C2A8] hover:bg-[#00A892] text-white font-bold text-xs shadow-lg shadow-[#00C2A8]/30 transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Registering...</span>
                              </>
                            ) : (
                              <span>Submit Registration →</span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
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
