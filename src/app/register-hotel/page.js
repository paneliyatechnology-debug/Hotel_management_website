"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Hotel,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { API_ENDPOINTS, apiRequest } from "@/config/api";

export default function RegisterHotelPage() {
  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    gstNumber: "",
    panNumber: "",
    hotelType: "Luxury Boutique Hotel",
    website: "",
    agreeTerms: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.name ||
      !formData.ownerName ||
      !formData.ownerEmail ||
      !formData.ownerPhone ||
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.pincode
    ) {
      setError("Please fill out all mandatory fields.");
      return;
    }

    if (!formData.agreeTerms) {
      setError("Please accept the terms and SaaS conditions to proceed.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest(API_ENDPOINTS.HOTELS.REGISTER, {
        method: "POST",
        body: formData,
      });

      setSuccessData(data.data || { name: formData.name, ownerEmail: formData.ownerEmail });
    } catch (err) {
      setError(
        err.message ||
        "Unable to connect to the backend server. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-theme-main">
      <Navbar />

      <main className="flex-1 py-12 px-6">
        <div className="mx-auto max-w-4xl">
          {/* Header Banner */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full theme-badge px-4 py-1.5 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant 30-Day Free Trial Activation</span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-theme-main tracking-wide">
              Register Your <span className="text-theme-gradient">Hotel &amp; Resort</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-theme-muted max-w-xl mx-auto">
              Get instant access to your hotel management system. Your 30-day free trial starts immediately and credentials are sent to your inbox.
            </p>
          </div>

          {/* Success State Screen */}
          {successData ? (
            <div className="bg-white rounded-3xl p-8 md:p-12 text-center border border-emerald-200 shadow-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-5">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-theme-main mb-2">
                Hotel Registered &amp; Activated!
              </h2>
              <p className="text-xs sm:text-sm text-theme-muted max-w-lg mx-auto mb-6">
                Your hotel <strong className="text-theme-dark">{successData.name}</strong> is now live with:
              </p>

              <div className="inline-block bg-emerald-50 border border-emerald-300 rounded-xl px-6 py-2.5 mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                  🎉 Status: ACTIVE (30-Day Free Trial Started)
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left max-w-xl mx-auto mb-8 space-y-2 text-xs text-slate-700">
                <p className="font-bold text-theme-main text-sm">Your Admin Account is Ready:</p>
                <ul className="list-disc list-inside space-y-1.5 text-theme-muted">
                  <li>Temporary login credentials have been emailed to <strong className="text-theme-main">{successData.ownerEmail}</strong>.</li>
                  <li>You can login right now and configure your room inventory and categories.</li>
                  <li>No payment or credit card is required during your 30-day evaluation.</li>
                </ul>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/"
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 px-6 py-3 text-xs font-bold text-theme-main transition-all"
                >
                  Return to Home
                </Link>
                <a
                  href="http://localhost:3001"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-theme-btn px-7 py-3 text-xs font-bold shadow-md hover:scale-105 transition-all inline-flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Login to Admin Portal Now</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="theme-card rounded-3xl p-8 md:p-10">
              {error && (
                <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1: Hotel General Details */}
              <div className="mb-8">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8c6636] mb-4 border-b border-slate-100 pb-2">
                  <Building2 className="w-4 h-4" />
                  <span>1. Property &amp; Hotel Details</span>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Hotel / Resort Name *
                    </label>
                    <div className="relative">
                      <Hotel className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. The Grand Royale Luxury Hotel"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#b48c5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#b48c5a]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Hotel Type *
                    </label>
                    <select
                      name="hotelType"
                      value={formData.hotelType}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-[#b48c5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#b48c5a]"
                    >
                      <option value="Luxury Boutique Hotel">Luxury Boutique Hotel</option>
                      <option value="5-Star Resort & Spa">5-Star Resort &amp; Spa</option>
                      <option value="Business & Conference Hotel">Business &amp; Conference Hotel</option>
                      <option value="Heritage Palace Hotel">Heritage Palace Hotel</option>
                      <option value="Bed & Breakfast / Homestay">Bed &amp; Breakfast / Homestay</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Official Website (Optional)
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://grandroyalehotel.com"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#b48c5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#b48c5a]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Owner & Administrative Contact */}
              <div className="mb-8">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8c6636] mb-4 border-b border-slate-100 pb-2">
                  <User className="w-4 h-4" />
                  <span>2. Owner &amp; Administrator Information</span>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Owner Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        name="ownerName"
                        value={formData.ownerName}
                        onChange={handleChange}
                        placeholder="e.g. Jatin Kakadiya"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#b48c5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#b48c5a]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Owner Login Email(Credentials) *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        name="ownerEmail"
                        value={formData.ownerEmail}
                        onChange={handleChange}
                        placeholder="owner@hotel.com"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#b48c5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#b48c5a]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        name="ownerPhone"
                        value={formData.ownerPhone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#b48c5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#b48c5a]"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Physical Address & Location */}
              <div className="mb-8">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8c6636] mb-4 border-b border-slate-100 pb-2">
                  <MapPin className="w-4 h-4" />
                  <span>3. Location &amp; Address</span>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Complete Property Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="742 Ocean Drive, Coastal Highway"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#b48c5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#b48c5a]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Ahmedabad"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#b48c5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#b48c5a]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Gujarat"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#b48c5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#b48c5a]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Pincode / Postal Code *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="380015"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#b48c5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#b48c5a]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-700"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Taxation & Business Identifiers */}
              <div className="mb-8">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8c6636] mb-4 border-b border-slate-100 pb-2">
                  <FileText className="w-4 h-4" />
                  <span>4. Taxation &amp; Regulatory Information (Optional)</span>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      GST Number
                    </label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleChange}
                      placeholder="24ABCDE1234F1Z5"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#b48c5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#b48c5a]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleChange}
                      placeholder="ABCDE1234F"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#b48c5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#b48c5a]"
                    />
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="mb-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4 border border-slate-200">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  id="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#b48c5a] focus:ring-[#b48c5a]"
                />
                <label htmlFor="agreeTerms" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                  I confirm that all information provided is accurate. I agree to the <strong>SaaS Terms of Service</strong>, privacy policy, and understand that my hotel account will be immediately active under a <strong>30-Day Free Trial</strong> with admin credentials sent to my email.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-theme-btn py-3.5 text-xs font-bold text-white shadow-md hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Registering Hotel &amp; Sending Credentials...</span>
                ) : (
                  <>
                    <span>Register Hotel &amp; Start 30-Day Free Trial</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
