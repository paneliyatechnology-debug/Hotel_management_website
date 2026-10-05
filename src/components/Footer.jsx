"use client";

import Link from "next/link";
import { Crown, Phone, Mail, MapPin, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#072F2A] text-slate-300 border-t border-[#0F4A42]/60 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand & Socials */}
          <div className="md:col-span-4 space-y-5">
            <Link href="/" className="flex items-center gap-3 group">
              <img src="/logo.png" alt="MYOWNPMS Logo" className="h-10 w-10 object-contain rounded-lg transition-transform group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="font-sans text-base sm:text-lg font-black tracking-wider text-white uppercase leading-none">
                  MYOWNPMS
                </span>
                <span className="text-[9.5px] font-sans font-bold tracking-[0.22em] text-[#00D0B4] uppercase leading-snug mt-0.5">
                  HOTEL MANAGEMENT
                </span>
              </div>
            </Link>

            <p className="text-xs font-semibold text-[#00D0B4] tracking-wide">
              Smarter Hotels. Happier Guests.
            </p>

            <p className="text-xs leading-relaxed text-slate-300/80 max-w-sm">
              Complete hotel management solution designed for modern hoteliers. Streamline operations, elevate guest experiences, and grow revenue effortlessly.
            </p>

            {/* Social Icons Row */}
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-8 h-8 rounded-full border border-[#00D0B4]/30 hover:border-[#00D0B4] hover:bg-[#00D0B4]/10 text-slate-300 hover:text-[#00D0B4] flex items-center justify-center transition-colors" aria-label="Website">
                <Globe className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-[#00D0B4]/30 hover:border-[#00D0B4] hover:bg-[#00D0B4]/10 text-slate-300 hover:text-[#00D0B4] flex items-center justify-center transition-colors" aria-label="Twitter">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-[#00D0B4]/30 hover:border-[#00D0B4] hover:bg-[#00D0B4]/10 text-slate-300 hover:text-[#00D0B4] flex items-center justify-center transition-colors" aria-label="LinkedIn">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26Z"/>
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-[#00D0B4]/30 hover:border-[#00D0B4] hover:bg-[#00D0B4]/10 text-slate-300 hover:text-[#00D0B4] flex items-center justify-center transition-colors" aria-label="Instagram">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-white mb-4">Product</h4>
            <ul className="space-y-3 text-xs font-medium">
              <li><Link href="/features" className="hover:text-[#00D0B4] transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-[#00D0B4] transition-colors">Pricing</Link></li>
              <li><Link href="/about" className="hover:text-[#00D0B4] transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-[#00D0B4] transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-white mb-4">Support</h4>
            <ul className="space-y-3 text-xs font-medium">
              <li><Link href="/contact" className="hover:text-[#00D0B4] transition-colors">Help Center</Link></li>
              <li><Link href="/terms" className="hover:text-[#00D0B4] transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-[#00D0B4] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/contact" className="hover:text-[#00D0B4] transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-xs font-medium">
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#00D0B4]" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#00D0B4]" />
                <span>support@myownpms.com</span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#00D0B4]" />
                <span>Ahmedabad, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Social & Copyright */}
        <div className="mt-12 pt-8 border-t border-[#0F4A42]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-400">
          <div>© {new Date().getFullYear()} MYOWNPMS. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}


