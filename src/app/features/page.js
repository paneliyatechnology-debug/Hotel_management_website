"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  Building,
  ShieldCheck,
  Users,
  CreditCard,
  Layers,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle,
  Database,
  UserCheck,
  Lock,
} from "lucide-react";

export default function FeaturesPage() {
  const modules = [
    {
      badge: "Master Control Hub",
      title: "Super Admin Platform Engine",
      description:
        "Complete enterprise oversight of all registered hotel tenants, approval pipelines, trial periods, and account governance.",
      icon: <ShieldCheck className="w-7 h-7 text-purple-700" />,
      points: [
        "Instant hotel registration review & one-click approval",
        "Automated credential dispatch via secure SMTP Email",
        "Subscription & 30-day free trial extension engine",
        "Immediate hotel suspension/disable with custom reason notification",
        "Global audit trail monitoring all sensitive actions",
      ],
      cardBg: "bg-purple-50/50 border-purple-200",
    },
    {
      badge: "Property Management",
      title: "Hotel Admin Operational Workspace",
      description:
        "Customized configuration for individual hotels with room inventory, category definitions, pricing controls, and receptionist staffing.",
      icon: <Building className="w-7 h-7 text-[#8c6636]" />,
      points: [
        "Create custom Room Types (Deluxe, Presidential Suite, Executive Villa)",
        "Assign room numbers, floors, and base night tariffs",
        "Manage receptionist team with temporary password provisioning",
        "Live dashboard tracking current occupancy & revenue totals",
        "Hotel profile & GST/PAN tax configuration",
      ],
      cardBg: "bg-amber-50/50 border-amber-200",
    },
    {
      badge: "Front Desk Suite",
      title: "Receptionist Front Desk Terminal",
      description:
        "High-efficiency front-desk flow built to handle high-traffic check-ins, guest document verification, and point-of-sale service billing.",
      icon: <Users className="w-7 h-7 text-blue-700" />,
      points: [
        "Rapid guest profile search & instant check-in",
        "Mandatory Government ID (Aadhaar / Passport) verification status",
        "Real-time available room selector with floor filters",
        "On-the-fly add-on charges (In-room Dining, Spa, Laundry, Minibar)",
        "One-click check-out with calculated tax invoice generation",
      ],
      cardBg: "bg-blue-50/50 border-blue-200",
    },
    {
      badge: "Financial Engine",
      title: "Automated Billing & Revenue Folio",
      description:
        "Eliminate checkout delays and billing errors with integrated itemized receipts and tax calculations.",
      icon: <CreditCard className="w-7 h-7 text-emerald-700" />,
      points: [
        "Itemized folio tracking every charge with timestamps",
        "Multi-method payment collection (Cash, Card, UPI, NetBanking)",
        "Automated GST calculation with itemized tax splits",
        "Print-ready checkout receipts and invoices",
        "Exportable transaction logs for accounting audits",
      ],
      cardBg: "bg-emerald-50/50 border-emerald-200",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      {/* Page Header */}
      <section className="relative pt-16 pb-12 px-6 text-center bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#b48c5a]/30 bg-[#b48c5a]/10 px-4 py-1.5 text-xs font-semibold text-[#8c6636] mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>Multi-Tenant Architecture &amp; Capabilities</span>
          </div>

          <h1 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 tracking-wide">
            Enterprise Features Built for{" "}
            <span className="gold-text-gradient">World-Class Hospitality</span>
          </h1>

          <p className="mt-3 text-sm md:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Discover the powerful modules that make Grand Royale the preferred choice for boutique hotels, luxury resorts, and hotel chains.
          </p>
        </div>
      </section>

      {/* Deep Dive Modules */}
      <section className="py-8 px-6">
        <div className="mx-auto max-w-6xl space-y-8">
          {modules.map((m, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-8 md:p-10 border ${m.cardBg} bg-white shadow-sm hover:shadow-md transition-all`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                      {m.icon}
                    </div>
                    <span className="text-xs font-bold tracking-widest text-[#8c6636] uppercase">
                      {m.badge}
                    </span>
                  </div>

                  <h2 className="font-serif text-2xl font-bold text-slate-900 mb-2">
                    {m.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                    {m.description}
                  </p>

                  <Link
                    href="/register-hotel"
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#8c6636] hover:text-[#b48c5a] transition-colors"
                  >
                    <span>Register to test this module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="lg:col-span-7 bg-slate-50 rounded-2xl p-6 border border-slate-200/80">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Key Highlights &amp; Capabilities
                  </h3>
                  <div className="space-y-3">
                    {m.points.map((pt, pidx) => (
                      <div key={pidx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Security & Multi-Tenant Isolation Callout */}
      <section className="py-16 px-6 bg-white border-t border-slate-200 mt-10">
        <div className="mx-auto max-w-5xl text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b48c5a]/15 text-[#8c6636] border border-[#b48c5a]/30 shadow-sm">
              <Database className="w-7 h-7" />
            </div>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            Zero-Leak Multi-Tenant Data Isolation
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed mb-8">
            Every hotel tenant is completely isolated with strict database-level query scopes and token encryption. Your guest records, financial folios, and staff credentials remain 100% private to your hotel.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <Lock className="w-5 h-5 text-[#8c6636] mb-2" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">Encrypted JWT Tokens</h3>
              <p className="text-xs text-slate-600">Tokens strictly bound to your hotel ID. Cross-tenant access is blocked at the gateway.</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <UserCheck className="w-5 h-5 text-[#8c6636] mb-2" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">Automatic Password Reset</h3>
              <p className="text-xs text-slate-600">Temporary passwords must be updated upon first login for all staff members.</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <FileSpreadsheet className="w-5 h-5 text-[#8c6636] mb-2" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">Permanent Audit Trail</h3>
              <p className="text-xs text-slate-600">Every check-in, payment, charge, and approval is logged with IP address &amp; timestamp.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-6 bg-slate-50">
        <div className="mx-auto max-w-4xl bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm">
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-2">
            Experience These Features First-Hand
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-lg mx-auto mb-5">
            Register your hotel today to get immediate access to all enterprise modules during your 30-day trial.
          </p>
          <Link
            href="/register-hotel"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#b48c5a] to-[#8c6636] px-7 py-3 text-xs font-bold text-white shadow-md hover:scale-105 transition-all"
          >
            <span>Register Hotel Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
