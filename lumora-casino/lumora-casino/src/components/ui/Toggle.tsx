"use client";

import clsx from "clsx";

type ToggleIcon = "turbo" | "auto" | "cashout";

export function Toggle({
  checked,
  onChange,
  label,
  description,
  icon,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  icon?: ToggleIcon;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-[border-color,background-color,box-shadow,transform] duration-200",
        "enabled:hover:-translate-y-0.5 enabled:hover:border-text-faint enabled:hover:bg-surface-raised/90 enabled:active:translate-y-0",
        "disabled:cursor-not-allowed disabled:opacity-45",
        checked
          ? "border-violet/60 bg-violet/10 shadow-[inset_0_0_0_1px_rgba(124,92,255,0.08)]"
          : "border-surface-line bg-surface-raised/55",
      )}
    >
      {icon && (
        <span
          aria-hidden="true"
          className={clsx(
            "grid size-9 shrink-0 place-items-center rounded-xl border transition-colors duration-200",
            checked
              ? "border-violet/40 bg-violet text-white"
              : "border-surface-line bg-surface text-text-muted group-enabled:group-hover:text-text-primary",
          )}
        >
          <ToggleGlyph icon={icon} />
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          {label}
          <span
            className={clsx(
              "rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-[0.16em] transition-colors",
              checked ? "bg-violet/20 text-violet-soft" : "bg-surface-line/70 text-text-faint",
            )}
          >
            {checked ? "ON" : "OFF"}
          </span>
        </span>
        {description && <span className="mt-0.5 block text-[11px] leading-4 text-text-muted">{description}</span>}
      </span>

      <span
        aria-hidden="true"
        className={clsx(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200",
          checked ? "border-violet-soft/40 bg-violet" : "border-surface-line bg-void/70",
        )}
      >
        <span
          className={clsx(
            "absolute left-1 top-1 size-4 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked && "translate-x-5",
          )}
        />
      </span>
    </button>
  );
}

function ToggleGlyph({ icon }: { icon: ToggleIcon }) {
  if (icon === "turbo") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.9">
        <path d="M13.5 2.75 5.8 13h5.7l-1 8.25L18.2 11h-5.7l1-8.25Z" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === "cashout") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.9">
        <path d="M5 16.5 10 11l3.25 3.25L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.5 7.5H19V12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.9">
      <path d="M7.25 7.5h8.25a3.75 3.75 0 0 1 0 7.5H13" strokeLinecap="round" />
      <path d="m14.75 4.75-2.5 2.75 2.5 2.75M9.25 19.25l2.5-2.75-2.5-2.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
