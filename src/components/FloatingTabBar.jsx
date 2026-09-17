"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, CreditCard, Building2, PhoneCall, ShieldCheck } from "lucide-react";

export default function FloatingTabBar() {
  const pathname = usePathname();

  const tabs = [
    { name: "Home", href: "/", icon: Home },
    { name: "Features", href: "/features", icon: Sparkles },
    { name: "Pricing", href: "/pricing", icon: CreditCard },
    { name: "Register", href: "/register-hotel", icon: Building2, highlight: true },
    { name: "Contact", href: "/contact", icon: PhoneCall },
  ];

  return (
    <div className="md:hidden fixed bottom-3 left-0 right-0 z-50 flex justify-center px-3 pointer-events-none">
      <nav
        aria-label="Floating Mobile Navigation"
        className="pointer-events-auto flex items-center gap-1 px-2 py-1.5 rounded-[22px] bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_14px_35px_-6px_rgba(12,39,59,0.22),0_4px_12px_rgba(0,0,0,0.06),inset_0_1px_1px_#FFFFFF] transition-all duration-300 w-full max-w-[420px] justify-around"
      >
        {tabs.map((tab) => {
          const isActive = tab.href === "/" ? pathname === "/" : (pathname === tab.href || pathname?.startsWith(tab.href + "/"));
          const Icon = tab.icon;

          if (tab.highlight) {
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`relative flex flex-col md:flex-row items-center gap-0.5 md:gap-1.5 px-3 md:px-4 py-1 md:py-1.5 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-[0_4px_14px_rgba(5,150,105,0.4)] scale-105"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:scale-[1.03] border border-emerald-200/70"
                }`}
              >
                <Icon className="w-4 h-4 md:w-3.5 md:h-3.5 stroke-[2.4]" />
                <span className="whitespace-nowrap">{tab.name}</span>
                <span className="hidden md:inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </Link>
            );
          }

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col md:flex-row items-center gap-0.5 md:gap-1.5 px-2.5 md:px-3.5 py-1 md:py-1.5 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-slate-900 text-white shadow-[0_4px_12px_rgba(15,23,42,0.35)] font-bold scale-[1.03]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 hover:scale-[1.02]"
              }`}
            >
              <Icon className={`w-4 h-4 md:w-3.5 md:h-3.5 ${isActive ? "stroke-[2.4]" : "stroke-[2]"}`} />
              <span className="whitespace-nowrap">{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
