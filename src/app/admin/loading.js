export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="relative flex items-center justify-center">
        {/* Glowing Admin Spinner */}
        <div className="w-16 h-16 rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin"></div>
        <div className="absolute w-8 h-8 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center text-[var(--color-accent)] font-bold text-[10px]">
          ADMIN
        </div>
      </div>

      <div className="mt-5 space-y-1.5">
        <h3 className="text-sm font-bold text-[var(--color-text-main)] tracking-wide">
          Loading Hotel Admin Management Panel...
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] max-w-xs animate-pulse">
          Fetching revenue analytics, collections, room status & staff team records.
        </p>
      </div>

      {/* Admin Panel Skeleton grid preview */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-3 w-full max-w-2xl opacity-60">
        <div className="h-20 bg-[var(--color-border)] rounded-xl animate-pulse"></div>
        <div className="h-20 bg-[var(--color-border)] rounded-xl animate-pulse"></div>
        <div className="h-20 bg-[var(--color-border)] rounded-xl animate-pulse"></div>
        <div className="h-20 bg-[var(--color-border)] rounded-xl animate-pulse"></div>
      </div>
    </div>
  );
}
