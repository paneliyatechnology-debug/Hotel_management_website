"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldCheck, Lock, EyeOff, Database, FileText, UserCheck, Server, AlertCircle } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFA] text-[#0F172A] font-sans selection:bg-[#00D0B4] selection:text-white">
      <Navbar />

      {/* Header Banner */}
      <section className="bg-[#072F2A] text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00D0B4_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00D0B4]/15 border border-[#00D0B4]/30 text-[#00D0B4] text-xs font-bold tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4" />
            Legal & Data Compliance
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
            Privacy Policy & Data Protection
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            How MYOWNPMS protects your hotel property records, staff operations, guest KYC credentials, and booking transactions with bank-grade security.
          </p>
          <div className="text-xs text-slate-400 font-mono pt-2">
            Effective Date: January 1, 2026 • Version 2.4 (Hotel PMS Multi-Tenant Standard)
          </div>
        </div>
      </section>

      {/* Quick Key Guarantees */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-[#DDE8E6] shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-50 text-[#0F766E] shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A]">256-Bit Encryption</h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">TLS 1.3 in-transit and AES-256 at-rest encryption.</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#DDE8E6] shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-50 text-[#0F766E] shrink-0">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A]">Zero Data Selling</h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">Your guest directory is 100% private to your hotel.</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#DDE8E6] shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-50 text-[#0F766E] shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A]">Isolated Tenant DB</h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">Logical partition for every property property account.</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#DDE8E6] shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-50 text-[#0F766E] shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A]">Secure Guest KYC</h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">OCR ID documents stored with access-controlled logs.</p>
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
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F766E]">Navigation</h3>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                <li><a href="#collection" className="hover:text-[#00D0B4] transition-colors block py-1">1. Information We Collect</a></li>
                <li><a href="#usage" className="hover:text-[#00D0B4] transition-colors block py-1">2. How We Use Data</a></li>
                <li><a href="#kyc-ocr" className="hover:text-[#00D0B4] transition-colors block py-1">3. Guest Identity & OCR Privacy</a></li>
                <li><a href="#security" className="hover:text-[#00D0B4] transition-colors block py-1">4. Multi-Tenant Security</a></li>
                <li><a href="#thirdparty" className="hover:text-[#00D0B4] transition-colors block py-1">5. Third-Party Integrations</a></li>
                <li><a href="#retention" className="hover:text-[#00D0B4] transition-colors block py-1">6. Data Retention & Erasure</a></li>
                <li><a href="#contact-dpo" className="hover:text-[#00D0B4] transition-colors block py-1">7. Contact Compliance DPO</a></li>
              </ul>
            </div>
          </aside>

          {/* Policy Body */}
          <div className="flex-1 bg-white rounded-2xl p-6 sm:p-10 border border-[#DDE8E6] shadow-sm space-y-10 text-xs sm:text-sm text-slate-700 leading-relaxed">

            {/* Section 1 */}
            <section id="collection" className="scroll-mt-8 space-y-3">
              <div className="flex items-center gap-2 text-[#0F766E] font-bold text-base border-b border-slate-100 pb-2">
                <FileText className="w-5 h-5" />
                <h2>1. Information We Collect</h2>
              </div>
              <p>
                MYOWNPMS operates a multi-tenant cloud-based Hotel Property Management Software (PMS). To deliver operational hotel features including room inventory, check-in wizards, digital billing, housekeeping tracking, and real-time dashboards, we collect the following categories of information:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong className="text-slate-900">Hotel Merchant Account Data:</strong> Hotel property name, business registration, tax identifiers (GST/VAT), owner/manager email, billing address, and authorized staff credentials.</li>
                <li><strong className="text-slate-900">Guest Profiles & Reservations:</strong> Full name, contact phone number, email address, physical address, check-in/out timestamps, room numbers, occupancy details, and special guest preferences.</li>
                <li><strong className="text-slate-900">Guest Identification Documents (KYC):</strong> Government-issued ID scans (Passport, National ID, Aadhaar, Driver’s License) provided during check-in for legal compliance and OCR extraction.</li>
                <li><strong className="text-slate-900">Financial & Billing Records:</strong> Transaction logs, room charges, payment modes, folio items, tax invoices, and payment gateway reference codes.</li>
                <li><strong className="text-slate-900">Operational & System Telemetry:</strong> Real-time room status updates, housekeeping completion timestamps, WebSocket synchronization events, device IP addresses, and application error logs.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section id="usage" className="scroll-mt-8 space-y-3">
              <div className="flex items-center gap-2 text-[#0F766E] font-bold text-base border-b border-slate-100 pb-2">
                <Server className="w-5 h-5" />
                <h2>2. How We Use Hotel & Guest Data</h2>
              </div>
              <p>
                Data collected within MYOWNPMS is processed strictly to fulfill contractual hotel management functions and provide smooth software operation. Specifically:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-slate-900 text-xs mb-1">Reservation & Check-in Fulfillment</h4>
                  <p className="text-[11px] text-slate-600">Facilitating room allocation, digital check-in/check-out wizard, and producing guest booking receipts.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-slate-900 text-xs mb-1">Automated Operations</h4>
                  <p className="text-[11px] text-slate-600">Running background housekeeping turnaround timer routines, folio calculation, and room status sync.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-slate-900 text-xs mb-1">Transactional Notifications</h4>
                  <p className="text-[11px] text-slate-600">Sending booking confirmations, digital receipts, and password reset codes via automated transactional email APIs.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-slate-900 text-xs mb-1">Security & Audit Trails</h4>
                  <p className="text-[11px] text-slate-600">Logging staff actions (receptionist, admin, super-admin) to maintain full auditability for hotel management.</p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="kyc-ocr" className="scroll-mt-8 space-y-3">
              <div className="flex items-center gap-2 text-[#0F766E] font-bold text-base border-b border-slate-100 pb-2">
                <UserCheck className="w-5 h-5" />
                <h2>3. Guest Identity Verification & OCR Processing</h2>
              </div>
              <p>
                Hospitality regulations require hotels to maintain verified guest registers. MYOWNPMS incorporates optical character recognition (OCR) and document preview features to streamline guest onboarding:
              </p>
              <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200/60 space-y-2">
                <h4 className="font-bold text-[#0F766E] text-xs">Security Standards for Guest Identity Documents:</h4>
                <p className="text-xs text-slate-700">
                  - Scanned identity documents are uploaded directly to secured, private cloud storage with restricted presigned URLs.<br />
                  - Extracted document text (such as name, document number, and nationality) is bound exclusively to the guest reservation record.<br />
                  - Access is restricted via Role-Based Access Control (RBAC) so that only authorized hotel staff (Receptionist, Hotel Admin, Super Admin) can view documents.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="security" className="scroll-mt-8 space-y-3">
              <div className="flex items-center gap-2 text-[#0F766E] font-bold text-base border-b border-slate-100 pb-2">
                <Lock className="w-5 h-5" />
                <h2>4. Multi-Tenant Architecture & Data Isolation</h2>
              </div>
              <p>
                MYOWNPMS employs strict tenant separation mechanisms. Each hotel property operates within a logically isolated database context. 
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong className="text-slate-900">Tenant Scoping:</strong> All database queries are automatically scoped to the logged-in hotel tenant (`hotelId`), preventing cross-hotel data leakage.</li>
                <li><strong className="text-slate-900">Data Transmission Encryption:</strong> All client-to-server and server-to-server traffic is enforced via HTTPS using TLS 1.3 protocol.</li>
                <li><strong className="text-slate-900">Credential Hashing:</strong> Staff and guest passwords are protected using bcrypt hashing algorithms with salt rounds; plaintext passwords are never stored.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="thirdparty" className="scroll-mt-8 space-y-3">
              <div className="flex items-center gap-2 text-[#0F766E] font-bold text-base border-b border-slate-100 pb-2">
                <EyeOff className="w-5 h-5" />
                <h2>5. Third-Party Integrations & Sub-Processors</h2>
              </div>
              <p>
                We collaborate with vetted cloud sub-processors strictly required to maintain PMS infrastructure. We never sell, monetize, or rent guest or hotel data to ad networks or third-party marketers.
              </p>
              <div className="overflow-x-auto border border-slate-200 rounded-lg mt-3">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-50 text-slate-900 font-bold">
                    <tr>
                      <th className="px-4 py-3">Partner Service</th>
                      <th className="px-4 py-3">Purpose</th>
                      <th className="px-4 py-3">Data Handled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-800">Brevo / Transactional Email</td>
                      <td className="px-4 py-3">Sending guest booking confirmation receipts & notification emails</td>
                      <td className="px-4 py-3">Recipient Email & Name</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-800">Cloudinary</td>
                      <td className="px-4 py-3">Secure image storage for hotel branding, room photos, and ID documents</td>
                      <td className="px-4 py-3">Encrypted Image Files</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-800">MongoDB Cloud Cluster</td>
                      <td className="px-4 py-3">Primary production database host</td>
                      <td className="px-4 py-3">Encrypted Application Database</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 6 */}
            <section id="retention" className="scroll-mt-8 space-y-3">
              <div className="flex items-center gap-2 text-[#0F766E] font-bold text-base border-b border-slate-100 pb-2">
                <Database className="w-5 h-5" />
                <h2>6. Data Retention & Account Deletion</h2>
              </div>
              <p>
                Hotel merchant data is retained for the active subscription period. Upon hotel account termination or written request, hotel databases and uploaded files will be archived or permanently purged within 30 days, subject to mandatory statutory tax and hospitality guest register retention requirements mandated by law.
              </p>
            </section>

            {/* Section 7 */}
            <section id="contact-dpo" className="scroll-mt-8 space-y-3">
              <div className="flex items-center gap-2 text-[#0F766E] font-bold text-base border-b border-slate-100 pb-2">
                <AlertCircle className="w-5 h-5" />
                <h2>7. Contact Our Data Protection Officer (DPO)</h2>
              </div>
              <p>
                If you have questions, data subject access requests (DSAR), or privacy inquiries regarding your hotel property or guest records, please reach out to our privacy compliance office:
              </p>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-1.5 font-medium">
                <div className="text-slate-900 font-bold text-sm">MYOWNPMS Data Protection & Compliance Team</div>
                <div className="text-slate-600">Email: <a href="mailto:privacy@myownpms.com" className="text-[#0F766E] font-bold hover:underline">privacy@myownpms.com</a></div>
                <div className="text-slate-600">Support Hotline: +91 98765 43210</div>
                <div className="text-slate-500">Address: Grand Royale Tech Park, S.G. Highway, Ahmedabad, Gujarat, India</div>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
