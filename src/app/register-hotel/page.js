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
  Sparkles,
} from "lucide-react";
import { API_ENDPOINTS, apiRequest } from "@/config/api";

export default function RegisterHotelPage() {
  const [formData, setFormData] = useState({
    hotelName: "",
    hotelType: "Luxury Boutique Hotel",
    website: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    gstNumber: "",
    panNumber: "",
    agreedTerms: true,
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [registeredCredentials, setRegisteredCredentials] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (
      !formData.hotelName ||
      !formData.ownerName ||
      !formData.ownerEmail ||
      !formData.ownerPhone ||
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.pincode
    ) {
      setError("Please fill all required hotel registration fields (*).");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.hotelName,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail.toLowerCase().trim(),
        ownerPhone: formData.ownerPhone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country || "India",
        pincode: formData.pincode,
        gstNumber: formData.gstNumber,
        panNumber: formData.panNumber,
        hotelType: formData.hotelType || "Luxury Boutique Hotel",
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
        err.message ||
          "Hotel registration failed. Please check your inputs and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] font-sans selection:bg-[#00D0B4] selection:text-[#072F2A]">
      <Navbar />

      {/* ───────────────────────────────────────────────────────────
          1. HERO HEADER WITH LUXURY GRADIENT OVERLAY
      ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-14 pb-28 lg:pt-18 lg:pb-36 overflow-hidden bg-[#072F2A] text-white">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&q=85"
            alt="Luxury Hotel Resort"
            className="w-full h-full object-cover object-right opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#072F2A] via-[#072F2A]/95 to-[#072F2A]/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#072F2A] via-transparent to-[#072F2A]/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00D0B4]/15 border border-[#00D0B4]/40 text-[#00D0B4] text-xs font-extrabold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Property Onboarding • 30-Day Free Trial</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-serif font-extrabold text-white tracking-tight leading-[1.12]">
              Register Your Hotel
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 font-sans font-normal leading-relaxed">
              Join our growing network of luxury hotels and start managing your property with ease.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          2. UPGRADED LUXURY REGISTRATION FORM CARD
      ─────────────────────────────────────────────────────────── */}
      <section className="relative z-20 -mt-20 sm:-mt-28 pb-20 lg:pb-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/95 backdrop-blur-md rounded-[28px] shadow-[0_25px_60px_-15px_rgba(7,47,42,0.15)] border border-[#00D0B4]/25 p-7 sm:p-10 lg:p-12 text-[#0F172A] relative overflow-hidden">
            
            {/* Top Accent Gradient Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#00D0B4] via-[#058B79] to-[#A16207] absolute top-0 left-0 right-0" />

            {submitted ? (
              <div className="text-center py-10 space-y-6">
                <div className="w-20 h-20 rounded-full bg-[#00D0B4]/20 text-[#058B79] flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10 text-[#058B79]" />
                </div>
                <div>
                  <h3 className="text-3xl font-serif font-extrabold text-[#0B1E28]">
                    Registration Successful!
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    Thank you for registering{" "}
                    <strong className="text-[#072F2A]">{formData.hotelName || "your hotel"}</strong>. Your admin credentials have been set and emailed to you.
                  </p>
                </div>

                {registeredCredentials && (
                  <div className="bg-[#EFF7F5] border border-[#00D0B4]/40 rounded-2xl p-6 max-w-md mx-auto text-left shadow-sm">
                    <div className="text-xs font-bold text-[#058B79] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#058B79]" />
                      <span>Your Admin Credentials</span>
                    </div>
                    <div className="space-y-2 text-xs text-[#0B1E28]">
                      <div className="flex justify-between items-center py-1 border-b border-[#00D0B4]/20">
                        <span className="text-slate-500 font-medium">Login Email:</span>{" "}
                        <strong className="font-mono text-sm select-all text-[#072F2A]">
                          {registeredCredentials.email}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500 font-medium">Temporary Password:</span>{" "}
                        <strong className="font-mono text-sm select-all bg-white px-2.5 py-1 rounded-lg border border-[#00D0B4]/30 text-[#072F2A] shadow-xs">
                          {registeredCredentials.password}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-9 py-4 rounded-full bg-gradient-to-r from-[#00D0B4] to-[#058B79] text-[#072F2A] font-extrabold text-sm shadow-lg shadow-[#00D0B4]/30 hover:scale-[1.02] transition-all"
                  >
                    Go to Login Portal →
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-9">
                {error && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold shadow-xs">
                    {error}
                  </div>
                )}

                {/* ───────────────────────────────────────────────────────────
                    SECTION 1: PROPERTY & HOTEL DETAILS
                ─────────────────────────────────────────────────────────── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-[#A16207] font-extrabold text-xs sm:text-sm uppercase tracking-wider border-b border-slate-100 pb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#A16207] flex items-center justify-center flex-shrink-0">
                      <Building className="w-4 h-4 text-[#A16207]" />
                    </div>
                    <span>1. PROPERTY &amp; HOTEL DETAILS</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-7">
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                        HOTEL / RESORT NAME *
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. The Grand Royale Luxury Hotel"
                          value={formData.hotelName}
                          onChange={(e) =>
                            setFormData({ ...formData, hotelName: e.target.value })
                          }
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#00D0B4] focus:border-[#00D0B4] focus:bg-white outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                        HOTEL TYPE *
                      </label>
                      <div className="relative">
                        <select
                          value={formData.hotelType}
                          onChange={(e) =>
                            setFormData({ ...formData, hotelType: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-xl border border-slate-200/90 text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] focus:border-[#00D0B4] focus:bg-white outline-none bg-[#F8FAFC] text-slate-700 appearance-none pr-10 cursor-pointer"
                        >
                          <option>Luxury Boutique Hotel</option>
                          <option>Boutique Hotel</option>
                          <option>Luxury Resort</option>
                          <option>Business Hotel</option>
                          <option>Heritage Palace</option>
                          <option>Bed &amp; Breakfast</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                      </div>
                    </div>

                    <div className="sm:col-span-12">
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                        OFFICIAL WEBSITE (OPTIONAL)
                      </label>
                      <input
                        type="url"
                        placeholder="https://grandroyalehotel.com"
                        value={formData.website}
                        onChange={(e) =>
                          setFormData({ ...formData, website: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#00D0B4] focus:border-[#00D0B4] focus:bg-white outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                      />
                    </div>
                  </div>
                </div>

                {/* ───────────────────────────────────────────────────────────
                    SECTION 2: OWNER & ADMINISTRATOR INFORMATION
                ─────────────────────────────────────────────────────────── */}
                <div className="space-y-4 pt-1">
                  <div className="flex items-center gap-2.5 text-[#A16207] font-extrabold text-xs sm:text-sm uppercase tracking-wider border-b border-slate-100 pb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#A16207] flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-[#A16207]" />
                    </div>
                    <span>2. OWNER &amp; ADMINISTRATOR INFORMATION</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                        OWNER FULL NAME *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Jatin Kakadiya"
                          value={formData.ownerName}
                          onChange={(e) =>
                            setFormData({ ...formData, ownerName: e.target.value })
                          }
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#00D0B4] focus:border-[#00D0B4] focus:bg-white outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                        OWNER LOGIN EMAIL(CREDENTIALS) *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                        <input
                          type="email"
                          required
                          placeholder="owner@hotel.com"
                          value={formData.ownerEmail}
                          onChange={(e) =>
                            setFormData({ ...formData, ownerEmail: e.target.value })
                          }
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#00D0B4] focus:border-[#00D0B4] focus:bg-white outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                        MOBILE NUMBER *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                        <input
                          type="tel"
                          required
                          placeholder="+91 98765 43210"
                          value={formData.ownerPhone}
                          onChange={(e) =>
                            setFormData({ ...formData, ownerPhone: e.target.value })
                          }
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#00D0B4] focus:border-[#00D0B4] focus:bg-white outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ───────────────────────────────────────────────────────────
                    SECTION 3: LOCATION & ADDRESS
                ─────────────────────────────────────────────────────────── */}
                <div className="space-y-4 pt-1">
                  <div className="flex items-center gap-2.5 text-[#A16207] font-extrabold text-xs sm:text-sm uppercase tracking-wider border-b border-slate-100 pb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#A16207] flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-[#A16207]" />
                    </div>
                    <span>3. LOCATION &amp; ADDRESS</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                        COMPLETE PROPERTY ADDRESS *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="742 Ocean Drive, Coastal Highway"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#00D0B4] focus:border-[#00D0B4] focus:bg-white outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                          CITY *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ahmedabad"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#00D0B4] focus:border-[#00D0B4] focus:bg-white outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                          STATE *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Gujarat"
                          value={formData.state}
                          onChange={(e) =>
                            setFormData({ ...formData, state: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#00D0B4] focus:border-[#00D0B4] focus:bg-white outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                          PINCODE / POSTAL CODE *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="380015"
                          value={formData.pincode}
                          onChange={(e) =>
                            setFormData({ ...formData, pincode: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#00D0B4] focus:border-[#00D0B4] focus:bg-white outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                          COUNTRY
                        </label>
                        <input
                          type="text"
                          disabled
                          readOnly
                          value="India"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-500 bg-[#F1F5F9] cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ───────────────────────────────────────────────────────────
                    SECTION 4: TAXATION & REGULATORY INFORMATION (OPTIONAL)
                ─────────────────────────────────────────────────────────── */}
                <div className="space-y-4 pt-1">
                  <div className="flex items-center gap-2.5 text-[#A16207] font-extrabold text-xs sm:text-sm uppercase tracking-wider border-b border-slate-100 pb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#A16207] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-[#A16207]" />
                    </div>
                    <span>4. TAXATION &amp; REGULATORY INFORMATION (OPTIONAL)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                        GST NUMBER
                      </label>
                      <input
                        type="text"
                        placeholder="24ABCDE1234F1Z5"
                        value={formData.gstNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, gstNumber: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#00D0B4] focus:border-[#00D0B4] focus:bg-white outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                        PAN NUMBER
                      </label>
                      <input
                        type="text"
                        placeholder="ABCDE1234F"
                        value={formData.panNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, panNumber: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#00D0B4] focus:border-[#00D0B4] focus:bg-white outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                      />
                    </div>
                  </div>
                </div>

                {/* ───────────────────────────────────────────────────────────
                    TERMS CHECKBOX & SUBMIT BUTTON
                ─────────────────────────────────────────────────────────── */}
                <div className="pt-6 border-t border-slate-100 space-y-6">
                  <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-600 leading-relaxed select-none">
                    <input
                      type="checkbox"
                      checked={formData.agreedTerms}
                      onChange={(e) =>
                        setFormData({ ...formData, agreedTerms: e.target.checked })
                      }
                      className="mt-0.5 w-4 h-4 rounded text-[#00D0B4] focus:ring-[#00D0B4] accent-[#00D0B4]"
                    />
                    <span>
                      I confirm that all information provided is accurate. I agree to the{" "}
                      <strong className="text-[#072F2A]">SaaS Terms of Service</strong>, privacy policy, and understand that my hotel account will be immediately active under a <strong className="text-[#072F2A]">30-Day Free Trial</strong> with admin credentials sent to my email.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading || !formData.agreedTerms}
                    className="w-full py-4 rounded-full bg-gradient-to-r from-[#00D0B4] to-[#058B79] hover:from-[#00BFA5] hover:to-[#047867] text-[#072F2A] font-extrabold text-sm sm:text-base transition-all shadow-lg shadow-[#00D0B4]/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Registering Property...</span>
                      </>
                    ) : (
                      <span>Register Hotel &amp; Start 30-Day Free Trial →</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
