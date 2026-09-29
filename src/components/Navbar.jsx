"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hotel, Menu, X, ArrowRight } from "lucide-react";
import { getAdminUrl } from "@/config/api";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#0D2825]/95 backdrop-blur-md border-b border-[#1A4540]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F766E] text-white shadow-md transition-transform group-hover:scale-105">
            <Hotel className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-serif text-base sm:text-lg font-bold tracking-wider text-white">
              GRAND <span className="text-[#14B8A6]">ROYALE</span>
            </span>
            <span className="hidden xs:block text-[9px] font-semibold tracking-widest text-[#94A3B8] uppercase">
              Hotel Management
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-[#14B8A6] ${
                  isActive ? "text-[#14B8A6] font-semibold" : "text-[#E2E8F0]"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-medium text-[#E2E8F0] hover:text-white px-3 py-2 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register-hotel"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-[#0F766E]/30"
          >
            Register Hotel
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center gap-2">
          <Link
            href="/register-hotel"
            className="px-3 py-1.5 rounded-lg bg-[#0F766E] text-white font-semibold text-xs"
          >
            Register
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white hover:text-[#14B8A6]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0D2825] border-b border-[#1A4540] px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-200 hover:text-[#14B8A6] py-1"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#1A4540] flex items-center justify-between">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-200"
            >
              Login
            </Link>
            <Link
              href="/register-hotel"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 rounded-lg bg-[#0F766E] text-white text-xs font-semibold"
            >
              Register Hotel
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
