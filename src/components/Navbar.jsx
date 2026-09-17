"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hotel, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full theme-header backdrop-blur-md border-b border-slate-200/60 bg-white/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3.5">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-theme-btn shadow-md transition-transform group-hover:scale-105">
            <Hotel className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="font-serif text-sm sm:text-lg font-bold tracking-wider text-theme-main whitespace-nowrap block">
              GRAND <span className="text-theme-primary">ROYALE</span>
            </span>
            <span className="hidden xs:block text-[9px] sm:text-[10px] font-semibold tracking-widest text-theme-muted uppercase whitespace-nowrap">
              Hotel Management Cloud
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-theme-primary ${
                  isActive ? "text-theme-primary font-bold" : "text-theme-muted"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Staff Login Link (Desktop & Tablet) */}
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-theme-main hover:text-theme-primary px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/80 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-theme-primary" />
            <span>Staff Login</span>
          </a>

          {/* Register Hotel Button */}
          <Link
            href="/register-hotel"
            className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-theme-btn px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">Register Hotel (Free Trial)</span>
            <span className="inline sm:hidden">Register</span>
            <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
