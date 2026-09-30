"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, CreditCard, Building2, PhoneCall } from "lucide-react";

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
        className="pointer-events-auto flex items-center gap-1 px-2 py-1.5 rounded-[22px] bg-[#072F2A]/95 backdrop-blur-xl border border-[#0F4A42] shadow-2xl transition-all duration-300 w-full max-w-[420px] justify-around"
      >
        {tabs.map((tab) => {
          const isActive = tab.href === "/" ? pathname === "/" : (pathname === tab.href || pathname?.startsWith(tab.href + "/"));
          const Icon = tab.icon;

          if (tab.highlight) {
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all duration-200 ${
                  isActive
                    ? "bg-[#00D0B4] text-[#072F2A] shadow-md scale-105"
                    : "bg-[#00D0B4]/20 text-[#00D0B4] hover:bg-[#00D0B4]/30 border border-[#00D0B4]/40"
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2.4]" />
                <span className="whitespace-nowrap">{tab.name}</span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-[#00D0B4]/20 text-[#00D0B4] font-bold scale-[1.03]"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "stroke-[2.4]" : "stroke-[2]"}`} />
              <span className="whitespace-nowrap">{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

