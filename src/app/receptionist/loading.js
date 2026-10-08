export default function ReceptionistLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFA] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="relative flex items-center justify-center">
        {/* Glowing Frontdesk Spinner */}
        <div className="w-16 h-16 rounded-full border-4 border-teal-200/60 border-t-[#00D0B4] animate-spin"></div>
        <div className="absolute w-8 h-8 rounded-full bg-[#072F2A] flex items-center justify-center text-[#00D0B4] font-bold text-[10px]">
          DESK
        </div>
      </div>

      <div className="mt-5 space-y-1.5">
        <h3 className="text-sm font-bold text-[#0F172A] tracking-wide">
          Loading Front-Desk Receptionist Console...
        </h3>
        <p className="text-xs text-slate-500 max-w-xs animate-pulse">
          Syncing check-in wizard, in-house guest folios & room housekeeping status.
        </p>
      </div>

      {/* Frontdesk Skeleton grid preview */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl opacity-60">
        <div className="h-16 bg-slate-200/70 rounded-xl animate-pulse"></div>
        <div className="h-16 bg-slate-200/70 rounded-xl animate-pulse"></div>
        <div className="h-16 bg-slate-200/70 rounded-xl animate-pulse"></div>
      </div>
    </div>
  );
}
