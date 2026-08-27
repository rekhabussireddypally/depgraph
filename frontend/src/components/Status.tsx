export function Loading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-500 py-12 justify-center">
      <span className="w-4 h-4 rounded-full border-2 border-slate-600 border-t-indigo-400 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
      <p className="text-slate-300 font-medium">{title}</p>
      {hint && <p className="text-slate-500 text-sm mt-1">{hint}</p>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      <span className="font-medium">Something went wrong.</span> {message}
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    CRITICAL: "bg-red-500/15 text-red-300 border-red-500/30",
    HIGH: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    MODERATE: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    LOW: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  };
  return (
    <span className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${styles[severity] ?? styles.LOW}`}>
      {severity}
    </span>
  );
}

export function EcosystemBadge({ ecosystem }: { ecosystem: string }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-wide px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
      {ecosystem}
    </span>
  );
}
