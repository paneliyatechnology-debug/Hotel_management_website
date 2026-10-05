"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, Menu, X } from "lucide-react";

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
    <nav className="sticky top-0 z-50 w-full bg-[#062925]/90 backdrop-blur-md border-b border-[#0F4A42]/50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Brand Logo */}
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

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-sans font-semibold transition-all hover:text-[#00D0B4] relative py-1 ${
                  isActive ? "text-[#00D0B4]" : "text-slate-200"
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#00D0B4] rounded-full shadow-[0_0_8px_#00D0B4]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-sans font-semibold text-white px-5 py-2 rounded-full border border-[#00D0B4]/60 hover:border-[#00D0B4] hover:bg-white/10 transition-all"
          >
            Staff Login
          </Link>
          <Link
            href="/register-hotel"
            className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-white hover:bg-slate-100 text-[#062925] font-sans font-extrabold text-xs sm:text-sm transition-all shadow-md hover:scale-[1.02]"
          >
            Register Hotel
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white hover:text-[#00D0B4] rounded-lg focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#062925] border-b border-[#0F4A42] px-4 py-5 space-y-4 shadow-xl">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-200 hover:text-[#00D0B4] py-1"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-[#0F4A42] flex items-center justify-between gap-3">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2.5 rounded-full border border-[#00D0B4]/60 text-white font-semibold text-xs"
            >
              Staff Login
            </Link>
            <Link
              href="/register-hotel"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2.5 rounded-full bg-white text-[#062925] font-extrabold text-xs shadow-md"
            >
              Register Hotel
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}


