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

export default function RegisterHotelPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Hotel Information
    hotelName: "",
    hotelType: "Select hotel type",
    ownerName: "",
    roomCount: "",
    email: "",
    website: "",
    phone: "",
    businessLicense: null,
    businessLicenseName: "",
    location: "Select location",

    // Step 2: Owner Details & Address
    address: "",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380015",
    country: "India",
    idNumber: "",
    emergencyPhone: "",

    // Step 3: Hotel Documents & Taxation
    gstNumber: "",
    panNumber: "",
    ownershipDocName: "",

    // Step 4: Complete & Terms
    agreedTerms: true,
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [registeredCredentials, setRegisteredCredentials] = useState(null);

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

  const handleNextStep = (e) => {
    if (e) e.preventDefault();
    setError("");

    if (activeStep === 1) {
      if (!formData.hotelName || !formData.ownerName || !formData.email || !formData.phone) {
        setError("Please fill all required fields marked with * (Hotel Name, Owner Name, Email, Phone).");
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      setActiveStep(3);
    } else if (activeStep === 3) {
      setActiveStep(4);
    }
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

    if (!formData.hotelName || !formData.ownerName || !formData.email || !formData.phone) {
      setError("Please fill all required hotel registration fields (*).");
      return;
    }

    try {
      setLoading(true);

      const locParts = formData.location && formData.location !== "Select location" ? formData.location.split(",") : [];
      const cityVal = formData.city || (locParts[0] ? locParts[0].trim() : "Ahmedabad");
      const stateVal = formData.state || (locParts[1] ? locParts[1].trim() : "Gujarat");

      const payload = {
        name: formData.hotelName,
        ownerName: formData.ownerName,
        ownerEmail: formData.email.toLowerCase().trim(),
        ownerPhone: formData.phone,
        address: formData.address || (formData.location !== "Select location" ? formData.location : "123 Ocean Drive"),
        city: cityVal,
        state: stateVal,
        country: formData.country || "India",
        pincode: formData.pincode || "380015",
        gstNumber: formData.gstNumber || "",
        panNumber: formData.panNumber || "",
        totalRooms: Number(formData.roomCount) || 20,
        hotelType: formData.hotelType !== "Select hotel type" ? formData.hotelType : "Luxury Boutique Hotel",
        website: formData.website || "",
      };

      const res = await apiRequest(API_ENDPOINTS.HOTELS.REGISTER, {
        method: "POST",
        body: payload,
      });

      if (res?.credentials || res?.data?.generatedPassword) {
        setRegisteredCredentials({
          email: res?.credentials?.email || payload.ownerEmail,
          password: res?.credentials?.password || res?.data?.generatedPassword,
        });
      } else {
        const ownerFirstName = (formData.ownerName || "Admin")
          .trim()
          .split(" ")[0]
          .replace(/[^a-zA-Z0-9]/g, "");
        const capName = ownerFirstName
          ? ownerFirstName.charAt(0).toUpperCase() + ownerFirstName.slice(1)
          : "Admin";
        setRegisteredCredentials({
          email: payload.ownerEmail,
          password: `${capName}@123`,
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
                      const isLast = idx === steps.length - 1;

                      return (
                        <div key={step.id} className="flex-1 flex items-center relative">
                          <div
                            onClick={() => setActiveStep(step.id)}
                            className="flex flex-col items-center gap-1 cursor-pointer z-10 mx-auto"
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
                    return (
                      <div
                        key={step.id}
                        onClick={() => setActiveStep(step.id)}
                        className={`relative z-10 flex items-start gap-4 cursor-pointer transition-all ${
                          isActive || isPassed ? "opacity-100" : "opacity-60 hover:opacity-90"
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
                        Thank you for registering <strong>{formData.hotelName || "your hotel"}</strong>. Your admin account is active and credentials have been generated.
                      </p>
                    </div>

                    {registeredCredentials && (
                      <div className="bg-[#F0F7F5] border border-[#00C2A8]/40 rounded-2xl p-5 max-w-md mx-auto text-left shadow-sm">
                        <div className="text-xs font-bold text-[#058B79] uppercase tracking-wider mb-2">
                          Your Admin Credentials
                        </div>
                        <div className="space-y-1.5 text-xs text-[#0F172A]">
                          <div>
                            <span className="text-slate-500">Login Email:</span>{" "}
                            <strong className="font-mono text-sm select-all">{registeredCredentials.email}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Password:</span>{" "}
                            <strong className="font-mono text-sm select-all bg-white px-2 py-0.5 rounded border border-emerald-200 text-[#073832]">
                              {registeredCredentials.password}
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}

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
                              onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#00C2A8] focus:border-[#00C2A8] outline-none transition-all placeholder:text-slate-300 bg-[#F8FAFC]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Hotel Type
                            </label>
                            <div className="relative">
                              <select
                                value={formData.hotelType}
                                onChange={(e) => setFormData({ ...formData, hotelType: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#00C2A8] focus:border-[#00C2A8] outline-none bg-[#F8FAFC] text-slate-700 appearance-none pr-9"
                              >
                                <option>Select hotel type</option>
                                <option>Luxury Boutique Hotel</option>
                                <option>Boutique Hotel</option>
                                <option>Luxury Resort</option>
                                <option>Business Hotel</option>
                                <option>Heritage Palace</option>
                                <option>Bed &amp; Breakfast</option>
                              </select>
                              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                            </div>
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
                              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#00C2A8] focus:border-[#00C2A8] outline-none transition-all placeholder:text-slate-300 bg-[#F8FAFC]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Number of Rooms *
                            </label>
                            <input
                              type="number"
                              required
                              placeholder="Enter number of rooms"
                              value={formData.roomCount}
                              onChange={(e) => setFormData({ ...formData, roomCount: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#00C2A8] focus:border-[#00C2A8] outline-none transition-all placeholder:text-slate-300 bg-[#F8FAFC]"
                            />
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
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#00C2A8] focus:border-[#00C2A8] outline-none transition-all placeholder:text-slate-300 bg-[#F8FAFC]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Website (Optional)
                            </label>
                            <input
                              type="url"
                              placeholder="Enter website"
                              value={formData.website}
                              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#00C2A8] focus:border-[#00C2A8] outline-none transition-all placeholder:text-slate-300 bg-[#F8FAFC]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              required
                              placeholder="Enter phone number"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#00C2A8] focus:border-[#00C2A8] outline-none transition-all placeholder:text-slate-300 bg-[#F8FAFC]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Business License
                            </label>
                            <div className="relative">
                              <label className="flex items-center justify-between w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-[#F8FAFC] text-xs cursor-pointer hover:bg-slate-100 transition-all">
                                <span className="text-slate-500 font-medium truncate">
                                  {formData.businessLicenseName || "Choose file"}
                                </span>
                                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 shadow-xs">
                                  Choose file
                                </span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.png,.jpeg"
                                  onChange={(e) => handleFileChange(e, "businessLicense")}
                                  className="hidden"
                                />
                              </label>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              Upload Business License (PDF, JPG, PNG)
                            </span>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Hotel Location *
                            </label>
                            <div className="relative">
                              <select
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#00C2A8] focus:border-[#00C2A8] outline-none bg-[#F8FAFC] text-slate-700 appearance-none pr-9"
                              >
                                <option>Select location</option>
                                <option>Ahmedabad, Gujarat</option>
                                <option>Mumbai, Maharashtra</option>
                                <option>Delhi, NCR</option>
                                <option>Bangalore, Karnataka</option>
                                <option>Goa</option>
                                <option>Jaipur, Rajasthan</option>
                              </select>
                              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        {/* Submit / Next Button */}
                        <div className="pt-4 space-y-3">
                          <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-[#00C2A8] hover:bg-[#00A892] text-white font-bold text-sm shadow-md shadow-[#00C2A8]/25 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Registering Hotel...</span>
                              </>
                            ) : (
                              <span>Register Hotel &amp; Activate 30-Day Free Trial →</span>
                            )}
                          </button>

                          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                            <span>
                              Already have an account?{" "}
                              <Link href="/login" className="text-[#00C2A8] font-bold hover:underline">
                                Login
                              </Link>
                            </span>
                            <button
                              type="button"
                              onClick={handleNextStep}
                              className="text-slate-600 font-semibold hover:text-[#00C2A8] underline"
                            >
                              Add Optional Address &amp; Documents →
                            </button>
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
                              placeholder="e.g. 742 Ocean Drive, Coastal Highway"
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#00C2A8] outline-none bg-[#F8FAFC]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              City *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ahmedabad"
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#00C2A8] outline-none bg-[#F8FAFC]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              State *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Gujarat"
                              value={formData.state}
                              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#00C2A8] outline-none bg-[#F8FAFC]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Pincode / Postal Code *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="380015"
                              value={formData.pincode}
                              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#00C2A8] outline-none bg-[#F8FAFC]"
                            />
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
                              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#00C2A8] outline-none bg-[#F8FAFC]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              PAN Number (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. ABCDE1234F"
                              value={formData.panNumber}
                              onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#00C2A8] outline-none bg-[#F8FAFC]"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Property Ownership / Lease Agreement
                            </label>
                            <div className="relative">
                              <label className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-xs cursor-pointer hover:bg-slate-100 transition-all">
                                <span className="text-slate-500 font-medium truncate">
                                  {formData.ownershipDocName || "Upload Property Agreement (PDF, JPG)"}
                                </span>
                                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600">
                                  Browse
                                </span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.png"
                                  onChange={(e) => handleFileChange(e, "ownershipDoc")}
                                  className="hidden"
                                />
                              </label>
                            </div>
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
                            <div><span className="text-slate-500">Hotel Type:</span> <strong>{formData.hotelType}</strong></div>
                            <div><span className="text-slate-500">Owner Name:</span> <strong>{formData.ownerName || "Not set"}</strong></div>
                            <div><span className="text-slate-500">Email:</span> <strong>{formData.email || "Not set"}</strong></div>
                            <div><span className="text-slate-500">Phone:</span> <strong>{formData.phone || "Not set"}</strong></div>
                            <div><span className="text-slate-500">Location:</span> <strong>{formData.location}</strong></div>
                          </div>
                        </div>

                        <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 leading-relaxed select-none">
                          <input
                            type="checkbox"
                            checked={formData.agreedTerms}
                            onChange={(e) => setFormData({ ...formData, agreedTerms: e.target.checked })}
                            className="mt-0.5 w-4 h-4 rounded text-[#00C2A8] focus:ring-[#00C2A8] accent-[#00C2A8]"
                          />
                          <span>
                            I confirm that all information provided is accurate and agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>.
                          </span>
                        </label>

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
