export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="w-20 h-20 rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin"></div>
        {/* Inner brand emblem */}
        <div className="absolute w-10 h-10 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center text-[var(--color-accent)] font-bold text-xs shadow-md">
          PMS
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-main)] tracking-wide">
          Loading MYOWNPMS Portal...
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] max-w-xs animate-pulse">
          Synchronizing hotel room inventory, guest folios & real-time updates.
        </p>
      </div>

      {/* Shimmer loading skeleton preview cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl opacity-60">
        <div className="h-16 bg-[var(--color-border)] rounded-xl animate-pulse"></div>
        <div className="h-16 bg-[var(--color-border)] rounded-xl animate-pulse"></div>
        <div className="h-16 bg-[var(--color-border)] rounded-xl animate-pulse"></div>
      </div>
    </div>
  );
}
