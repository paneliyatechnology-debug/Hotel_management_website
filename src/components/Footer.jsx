"use client";

import Link from "next/link";
import { Hotel, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#091F1C] text-[#94A3B8] border-t border-[#143B36]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F766E] text-white">
                <Hotel className="h-4 w-4 stroke-[2.2]" />
              </div>
              <span className="font-serif text-lg font-bold tracking-wider text-white">
                GRAND <span className="text-[#14B8A6]">ROYALE</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-[#94A3B8]">
              Complete hotel management solution designed for modern hoteliers. Streamline operations, elevate guest experiences, and grow revenue effortlessly.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/features" className="hover:text-[#14B8A6] transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-[#14B8A6] transition-colors">Pricing</Link></li>
              <li><Link href="/about" className="hover:text-[#14B8A6] transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-[#14B8A6] transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Support</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/contact" className="hover:text-[#14B8A6] transition-colors">Help Center</Link></li>
              <li><Link href="/terms" className="hover:text-[#14B8A6] transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-[#14B8A6] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/contact" className="hover:text-[#14B8A6] transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>support@grandroyale.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>Ahmedabad, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Social & Copyright */}
        <div className="mt-12 pt-8 border-t border-[#143B36] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>© {new Date().getFullYear()} Grand Royale. All rights reserved.</div>
          <div className="flex items-center gap-6 text-[#94A3B8]">
            <Link href="/privacy" className="hover:text-[#14B8A6] transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-[#14B8A6] transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-[#14B8A6] transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
