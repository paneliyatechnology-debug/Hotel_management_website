"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, CreditCard, Building2, PhoneCall } from "lucide-react";

export default function FloatingTabBar() {
  const pathname = usePathname();

  // Hide on dashboard / app panels & auth routes
  if (
    pathname?.startsWith("/app") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/receptionist") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/forgot-password")
  ) {
    return null;
  }

  const tabs = [
    { name: "Home", href: "/", icon: Home },
    { name: "Features", href: "/features", icon: Sparkles },
    { name: "Pricing", href: "/pricing", icon: CreditCard },
    { name: "Register", href: "/register-hotel", icon: Building2 },
    { name: "Contact", href: "/contact", icon: PhoneCall },
  ];

  const isTabActive = (href) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || (pathname?.startsWith(href + "/") && href !== "/");
  };

  return (
    <div className="md:hidden fixed bottom-3 left-0 right-0 z-50 flex justify-center px-3 pointer-events-none">
      <nav
        aria-label="Floating Mobile Navigation"
        className="pointer-events-auto flex items-center gap-1 px-2 py-1.5 rounded-[22px] bg-[#072F2A]/95 backdrop-blur-xl border border-[#0F4A42] shadow-2xl transition-all duration-300 w-full max-w-[420px] justify-around"
      >
        {tabs.map((tab) => {
          const isActive = isTabActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-[#00D0B4]/20 text-[#00D0B4] border border-[#00D0B4]/40 font-bold scale-[1.04]"
                  : "text-slate-300 hover:text-white border border-transparent hover:bg-white/5"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "stroke-[2.4] text-[#00D0B4]" : "stroke-[1.8] text-slate-300"}`} />
              <span className="whitespace-nowrap">{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

