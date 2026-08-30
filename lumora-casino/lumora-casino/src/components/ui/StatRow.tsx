export function StatRow({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className={`mono-tabular font-medium text-text-primary ${valueClassName}`}>{value}</span>
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">{children}</div>;
}

export function StatTile({ label, value, tone }: { label: string; value: string; tone?: "win" | "loss" | "neutral" }) {
  const color =
    tone === "win" ? "text-win" : tone === "loss" ? "text-loss" : "text-text-primary";
  return (
    <div className="rounded-xl border border-surface-line bg-surface-raised/60 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wide text-text-muted">{label}</p>
      <p className={`mono-tabular mt-0.5 text-base font-semibold ${color}`}>{value}</p>
    </div>
  );
}
