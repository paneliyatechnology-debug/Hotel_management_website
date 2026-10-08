export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFA] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="w-20 h-20 rounded-full border-4 border-teal-200/50 border-t-[#00D0B4] animate-spin"></div>
        {/* Inner brand emblem */}
        <div className="absolute w-10 h-10 rounded-full bg-[#072F2A] flex items-center justify-center text-[#00D0B4] font-bold text-xs shadow-md">
          PMS
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <h3 className="text-sm sm:text-base font-bold text-[#0F172A] tracking-wide">
          Loading MYOWNPMS Portal...
        </h3>
        <p className="text-xs text-slate-500 max-w-xs animate-pulse">
          Synchronizing hotel room inventory, guest folios & real-time updates.
        </p>
      </div>

      {/* Shimmer loading skeleton preview cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl opacity-60">
        <div className="h-16 bg-slate-200/60 rounded-xl animate-pulse"></div>
        <div className="h-16 bg-slate-200/60 rounded-xl animate-pulse"></div>
        <div className="h-16 bg-slate-200/60 rounded-xl animate-pulse"></div>
      </div>
    </div>
  );
}
