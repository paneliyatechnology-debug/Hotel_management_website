"use client";

import Link from "next/link";
import { Hotel, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="theme-footer text-theme-muted">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-theme-primary text-white">
                <Hotel className="h-5 w-5" />
              </div>
              <span className="font-serif text-lg font-bold tracking-wider text-theme-main">
                GRAND <span className="text-theme-primary">ROYALE</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-theme-muted">
              Next-generation multi-tenant cloud property management system (PMS) designed for luxury boutique hotels, beach resorts, and hotel chains.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-main mb-3">
              Platform
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-theme-primary transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-theme-primary transition-colors">
                  All Features &amp; Modules
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-theme-primary transition-colors">
                  Pricing Plans &amp; Free Trial
                </Link>
              </li>
              <li>
                <Link href="/register-hotel" className="hover:text-theme-primary transition-colors font-semibold text-theme-primary">
                  Register Your Hotel
                </Link>
              </li>
            </ul>
          </div>

          {/* Hotel Roles */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-main mb-3">
              Role Workspaces
            </h3>
            <ul className="space-y-2 text-xs text-theme-muted">
              <li>Super Admin Master Control</li>
              <li>Hotel Admin Property Hub</li>
              <li>Receptionist Front Desk</li>
              <li>Instant Aadhaar/Passport Verification</li>
              <li>Automated Folio &amp; GST Invoicing</li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-main mb-3">
              Contact &amp; Support
            </h3>
            <ul className="space-y-2 text-xs text-theme-muted">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-theme-primary" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-theme-primary" />
                <span>support@grandroyalehotel.com</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-theme-primary" />
                <span>Ahmedabad, Gujarat, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Grand Royale Cloud PMS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
