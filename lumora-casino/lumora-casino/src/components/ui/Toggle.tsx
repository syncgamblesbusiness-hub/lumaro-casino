"use client";

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-surface-line bg-surface-raised px-3 py-2.5 text-sm font-medium text-text-primary transition disabled:opacity-40"
    >
      <span>{label}</span>
      <span
        aria-hidden
        className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-violet" : "bg-surface-line"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
