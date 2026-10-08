"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Scale, CheckCircle2, ShieldAlert, CreditCard, Layers, Clock, HelpCircle, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFA] text-[#0F172A] font-sans selection:bg-[#00D0B4] selection:text-white">
      <Navbar />

      {/* Header Banner */}
      <section className="bg-[#072F2A] text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00D0B4_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00D0B4]/15 border border-[#00D0B4]/30 text-[#00D0B4] text-xs font-bold tracking-wide uppercase">
            <Scale className="w-4 h-4" />
            Terms of Service & Operational Agreement
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
            Terms & Conditions of Service
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Governing the access, subscription plans, data rights, and operations of hoteliers using MYOWNPMS Cloud Platform.
          </p>
          <div className="text-xs text-slate-400 font-mono pt-2">
            Effective Date: January 1, 2026 • Version 2.4 (Hotel PMS SaaS Master Agreement)
          </div>
        </div>
      </section>

      {/* Quick Key Service Highlights */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-[#DDE8E6] shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-50 text-[#0F766E] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A]">99.9% Uptime Commitment</h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">Reliable front-desk & reservation synchronization.</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#DDE8E6] shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-50 text-[#0F766E] shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A]">Full Data Ownership</h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">Hotels retain 100% ownership of guest & revenue data.</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#DDE8E6] shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-50 text-[#0F766E] shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A]">Transparent Billing</h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">Clear monthly/annual plan terms with no hidden fees.</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#DDE8E6] shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-50 text-[#0F766E] shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A]">Seamless Onboarding</h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">Instant activation for hotel admins & reception staff.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Legal Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Side Sticky Navigation */}
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-8 bg-white p-5 rounded-xl border border-[#DDE8E6] shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F766E]">Navigation Index</h3>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                <li><a href="#acceptance" className="hover:text-[#00D0B4] transition-colors block py-1">1. Acceptance & Service Scope</a></li>
                <li><a href="#accounts" className="hover:text-[#00D0B4] transition-colors block py-1">2. Account & Staff Credentials</a></li>
                <li><a href="#billing" className="hover:text-[#00D0B4] transition-colors block py-1">3. Subscriptions & Billing</a></li>
                <li><a href="#acceptable-use" className="hover:text-[#00D0B4] transition-colors block py-1">4. Acceptable Use Policy</a></li>
                <li><a href="#ownership" className="hover:text-[#00D0B4] transition-colors block py-1">5. IP & Hotel Data Ownership</a></li>
                <li><a href="#sla" className="hover:text-[#00D0B4] transition-colors block py-1">6. SLA & Support Level</a></li>
                <li><a href="#liability" className="hover:text-[#00D0B4] transition-colors block py-1">7. Liability & Warranties</a></li>
                <li><a href="#termination" className="hover:text-[#00D0B4] transition-colors block py-1">8. Termination & Export</a></li>
                <li><a href="#governing-law" className="hover:text-[#00D0B4] transition-colors block py-1">9. Legal Jurisdiction</a></li>
              </ul>
            </div>
          </aside>

          {/* Terms Body */}
          <div className="flex-1 bg-white rounded-2xl p-6 sm:p-10 border border-[#DDE8E6] shadow-sm space-y-10 text-xs sm:text-sm text-slate-700 leading-relaxed">

            {/* Section 1 */}
            <section id="acceptance" className="scroll-mt-8 space-y-3">
              <div className="flex items-center gap-2 text-[#0F766E] font-bold text-base border-b border-slate-100 pb-2">
                <FileText className="w-5 h-5" />
                <h2>1. Acceptance of Terms & Service Scope</h2>
              </div>
              <p>
                By registering, subscribing, or operating the MYOWNPMS platform (including the Web Portal, Hotel Admin Portal, Receptionist Desk, and Super Admin Management Console), your hotel enterprise agrees to comply with these Terms of Service.
              </p>
              <p>
                MYOWNPMS grants subscribing hoteliers a non-exclusive, non-transferable, cloud-based software subscription to manage room inventories, room categories, booking calendars, check-in wizards, guest KYC documents, digital billing folios, and housekeeping schedules.
              </p>
            </section>

            {/* Section 2 */}
            <section id="accounts" className="scroll-mt-8 space-y-3">
              <div className="flex items-center gap-2 text-[#0F766E] font-bold text-base border-b border-slate-100 pb-2">
                <Layers className="w-5 h-5" />
                <h2>2. Hotel Account Security & Role-Based Access</h2>
              </div>
              <p>
                Hoteliers are responsible for assigning appropriate access credentials to staff members. The platform enforces multi-role access controls:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong className="text-slate-900">Super Admin:</strong> Full operational and subscription configuration control over platform infrastructure.</li>
                <li><strong className="text-slate-900">Hotel Admin:</strong> Full control over hotel room types, room rates, staff creation, revenue reports, and billing settings.</li>
                <li><strong className="text-slate-900">Receptionist / Front Desk:</strong> Access to check-in/out wizards, reservation calendar, guest document upload, and guest folio generation.</li>
              </ul>
              <p className="pt-1">
                You are responsible for safeguarding login passwords and API authorization tokens. MYOWNPMS is not liable for unauthorized actions taken using valid hotel staff credentials.
              </p>
            </section>

            {/* Section 3 */}
            <section id="billing" className="scroll-mt-8 space-y-3">
              <div className="flex items-center gap-2 text-[#0F766E] font-bold text-base border-b border-slate-100 pb-2">
                <CreditCard className="w-5 h-5" />
                <h2>3. Subscription Plans, Billing & Cancellation</h2>
              </div>
              <p>
                MYOWNPMS is offered on tiered subscription models (e.g. Starter, Professional, Enterprise) based on room count and feature set.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-slate-900 text-xs mb-1">Billing Cycle</h4>
                  <p className="text-[11px] text-slate-600">Subscriptions are billed in advance on a recurring monthly or annual basis depending on your selected plan.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-slate-900 text-xs mb-1">Taxes & Invoicing</h4>
                  <p className="text-[11px] text-slate-600">Invoices will include applicable statutory taxes (such as GST/VAT) based on your hotel location.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-slate-900 text-xs mb-1">Plan Upgrades & Downgrades</h4>
                  <p className="text-[11px] text-slate-600">Hotels can upgrade subscription tiers at any time; pro-rated charges will apply automatically.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-slate-900 text-xs mb-1">Cancellation Policy</h4>
                  <p className="text-[11px] text-slate-600">You may cancel your subscription at any time. Services remain active until the end of the paid billing period.</p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="acceptable-use" className="scroll-mt-8 space-y-3">
              <div className="flex items-center gap-2 text-[#0F766E] font-bold text-base border-b border-slate-100 pb-2">
                <ShieldAlert className="w-5 h-5" />
                <h2>4. Acceptable Use Policy</h2>
              </div>
              <p>
                Hoteliers and authorized staff agree NOT to:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>Reverse engineer, decompile, or attempt to extract source code from MYOWNPMS binaries or APIs.</li>
                <li>Use the platform to store or process fraudulent guest IDs or engage in illegal money laundering activities.</li>
                <li>Bypass rate limits, perform unauthorized penetration testing, or flood WebSocket servers with malicious requests.</li>
                <li>Share subscription access with unauthorized third-party hotel properties outside your account quota.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="ownership" className="scroll-mt-8 space-y-3">
              <div className="flex items-center gap-2 text-[#0F766E] font-bold text-base border-b border-slate-100 pb-2">
                <CheckCircle2 className="w-5 h-5" />
                <h2>5. Intellectual Property & Hotel Data Ownership</h2>
              </div>
              <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200/60 space-y-2">
                <h4 className="font-bold text-[#0F766E] text-xs">Hotel Data Ownership Guarantee:</h4>
                <p className="text-xs text-slate-700">
                  The subscribing hotel retains complete, exclusive ownership of all guest registers, reservation history, pricing strategies, room photos, and financial folios entered into MYOWNPMS. We claim no ownership over hotel proprietary records.
                </p>
              </div>
              <p className="pt-1">
                MYOWNPMS retains all rights, title, and interest in and to the software code, interface design, branding, system algorithms, and database architecture.
              </p>
            </section>

            {/* Section 6 */}
            <section id="sla" className="scroll-mt-8 space-y-3">
              <div className="flex items-center gap-2 text-[#0F766E] font-bold text-base border-b border-slate-100 pb-2">
                <Clock className="w-5 h-5" />
                <h2>6. Service Level Agreement (SLA) & Technical Support</h2>
              </div>
              <p>
                MYOWNPMS targets a 99.9% service uptime for core reservation APIs and reception desk modules. Scheduled maintenance is conducted during off-peak hours with minimum 24-hour advance notice to hotel admins. Support is available via ticketing and email at <a href="mailto:support@myownpms.com" className="text-[#0F766E] font-bold underline">support@myownpms.com</a>.
              </p>
            </section>

            {/* Section 7 */}
            <section id="liability" className="scroll-mt-8 space-y-3">
              <div className="flex items-center gap-2 text-[#0F766E] font-bold text-base border-b border-slate-100 pb-2">
                <ShieldAlert className="w-5 h-5" />
                <h2>7. Limitation of Liability</h2>
              </div>
              <p>
                To the maximum extent permitted by applicable law, MYOWNPMS shall not be liable for indirect, incidental, or consequential damages, including loss of hotel profits, booking interruptions caused by third-party internet outages, or hardware failures at the hotel premises. Total liability shall not exceed the subscription fees paid by the hotel in the preceding 12 months.
              </p>
            </section>

            {/* Section 8 */}
            <section id="termination" className="scroll-mt-8 space-y-3">
              <div className="flex items-center gap-2 text-[#0F766E] font-bold text-base border-b border-slate-100 pb-2">
                <HelpCircle className="w-5 h-5" />
                <h2>8. Termination & Data Export Options</h2>
              </div>
              <p>
                Upon account termination or plan non-renewal, MYOWNPMS provides a 30-day grace period allowing hotel administrators to export full guest lists, reservation logs, and transaction reports in standard JSON/CSV format before data purging.
              </p>
            </section>

            {/* Section 9 */}
            <section id="governing-law" className="scroll-mt-8 space-y-3">
              <div className="flex items-center gap-2 text-[#0F766E] font-bold text-base border-b border-slate-100 pb-2">
                <Scale className="w-5 h-5" />
                <h2>9. Governing Law & Dispute Resolution</h2>
              </div>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of India. Any legal disputes or claims arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts located in Ahmedabad, Gujarat, India.
              </p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
