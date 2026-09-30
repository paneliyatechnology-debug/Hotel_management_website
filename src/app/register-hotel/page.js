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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-[#00D0B4] selection:text-[#072F2A]">
      <Navbar />

      {/* ───────────────────────────────────────────────────────────
          1. HERO HEADER
      ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-24 lg:pt-16 lg:pb-32 overflow-hidden bg-[#072F2A] text-white">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&q=85"
            alt="Luxury Hotel Resort"
            className="w-full h-full object-cover object-right opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#072F2A] via-[#072F2A]/90 to-[#072F2A]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#072F2A] via-transparent to-[#072F2A]/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
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
          2. REGISTRATION FORM CARD MATCHING IMAGE & FIELDS 100%
      ─────────────────────────────────────────────────────────── */}
      <section className="relative z-20 -mt-16 sm:-mt-24 pb-20 lg:pb-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl border border-[#A7F3D0]/60 p-6 sm:p-10 lg:p-12 text-[#0F172A]">
            {submitted ? (
              <div className="text-center py-10 space-y-6">
                <div className="w-16 h-16 rounded-full bg-[#00D0B4]/20 text-[#058B79] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-[#058B79]" />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-[#0B1E28]">
                    Registration Successful!
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
                    Thank you for registering{" "}
                    <strong>{formData.hotelName || "your hotel"}</strong>. Your admin credentials have been set and emailed to you.
                  </p>
                </div>

                {registeredCredentials && (
                  <div className="bg-[#EFF7F5] border border-[#00D0B4]/40 rounded-2xl p-5 max-w-md mx-auto text-left shadow-sm">
                    <div className="text-xs font-bold text-[#058B79] uppercase tracking-wider mb-2">
                      Your Admin Credentials
                    </div>
                    <div className="space-y-1.5 text-xs text-[#0B1E28]">
                      <div>
                        <span className="text-slate-500">Login Email:</span>{" "}
                        <strong className="font-mono text-sm select-all">
                          {registeredCredentials.email}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Password:</span>{" "}
                        <strong className="font-mono text-sm select-all bg-white px-2 py-0.5 rounded border border-[#00D0B4]/30 text-[#072F2A]">
                          {registeredCredentials.password}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#00D0B4] text-[#072F2A] font-extrabold text-xs shadow-md shadow-[#00D0B4]/30 hover:scale-[1.02] transition-all"
                  >
                    Go to Login Portal →
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                    {error}
                  </div>
                )}

                {/* ───────────────────────────────────────────────────────────
                    SECTION 1: PROPERTY & HOTEL DETAILS
                ─────────────────────────────────────────────────────────── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#A16207] font-bold text-xs sm:text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
                    <Building className="w-4 h-4 text-[#A16207]" />
                    <span>1. PROPERTY &amp; HOTEL DETAILS</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-7">
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wide mb-1.5">
                        HOTEL / RESORT NAME *
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. The Grand Royale Luxury Hotel"
                          value={formData.hotelName}
                          onChange={(e) =>
                            setFormData({ ...formData, hotelName: e.target.value })
                          }
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2E8F0] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wide mb-1.5">
                        HOTEL TYPE *
                      </label>
                      <div className="relative">
                        <select
                          value={formData.hotelType}
                          onChange={(e) =>
                            setFormData({ ...formData, hotelType: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none bg-[#F8FAFC] text-slate-700 appearance-none pr-10"
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
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wide mb-1.5">
                        OFFICIAL WEBSITE (OPTIONAL)
                      </label>
                      <input
                        type="url"
                        placeholder="https://grandroyalehotel.com"
                        value={formData.website}
                        onChange={(e) =>
                          setFormData({ ...formData, website: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                      />
                    </div>
                  </div>
                </div>

                {/* ───────────────────────────────────────────────────────────
                    SECTION 2: OWNER & ADMINISTRATOR INFORMATION
                ─────────────────────────────────────────────────────────── */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-[#A16207] font-bold text-xs sm:text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
                    <User className="w-4 h-4 text-[#A16207]" />
                    <span>2. OWNER &amp; ADMINISTRATOR INFORMATION</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wide mb-1.5">
                        OWNER FULL NAME *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Jatin Kakadiya"
                          value={formData.ownerName}
                          onChange={(e) =>
                            setFormData({ ...formData, ownerName: e.target.value })
                          }
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2E8F0] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wide mb-1.5">
                        OWNER LOGIN EMAIL(CREDENTIALS) *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                          type="email"
                          required
                          placeholder="owner@hotel.com"
                          value={formData.ownerEmail}
                          onChange={(e) =>
                            setFormData({ ...formData, ownerEmail: e.target.value })
                          }
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2E8F0] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wide mb-1.5">
                        MOBILE NUMBER *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                          type="tel"
                          required
                          placeholder="+91 98765 43210"
                          value={formData.ownerPhone}
                          onChange={(e) =>
                            setFormData({ ...formData, ownerPhone: e.target.value })
                          }
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2E8F0] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ───────────────────────────────────────────────────────────
                    SECTION 3: LOCATION & ADDRESS
                ─────────────────────────────────────────────────────────── */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-[#A16207] font-bold text-xs sm:text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
                    <MapPin className="w-4 h-4 text-[#A16207]" />
                    <span>3. LOCATION &amp; ADDRESS</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wide mb-1.5">
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
                        className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wide mb-1.5">
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
                          className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wide mb-1.5">
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
                          className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wide mb-1.5">
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
                          className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wide mb-1.5">
                          COUNTRY
                        </label>
                        <input
                          type="text"
                          disabled
                          readOnly
                          value="India"
                          className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-slate-500 bg-[#F1F5F9] cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ───────────────────────────────────────────────────────────
                    SECTION 4: TAXATION & REGULATORY INFORMATION (OPTIONAL)
                ─────────────────────────────────────────────────────────── */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-[#A16207] font-bold text-xs sm:text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
                    <FileText className="w-4 h-4 text-[#A16207]" />
                    <span>4. TAXATION &amp; REGULATORY INFORMATION (OPTIONAL)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wide mb-1.5">
                        GST NUMBER
                      </label>
                      <input
                        type="text"
                        placeholder="24ABCDE1234F1Z5"
                        value={formData.gstNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, gstNumber: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#334155] uppercase tracking-wide mb-1.5">
                        PAN NUMBER
                      </label>
                      <input
                        type="text"
                        placeholder="ABCDE1234F"
                        value={formData.panNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, panNumber: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-xs font-medium focus:ring-2 focus:ring-[#00D0B4] outline-none transition-all placeholder:text-slate-400 bg-[#F8FAFC]"
                      />
                    </div>
                  </div>
                </div>

                {/* ───────────────────────────────────────────────────────────
                    TERMS CHECKBOX & SUBMIT BUTTON
                ─────────────────────────────────────────────────────────── */}
                <div className="pt-4 border-t border-slate-100 space-y-6">
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
                    className="w-full py-4 rounded-full bg-[#00D0B4] hover:bg-[#00BFA5] text-[#072F2A] font-extrabold text-sm sm:text-base transition-all shadow-lg shadow-[#00D0B4]/30 flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
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
