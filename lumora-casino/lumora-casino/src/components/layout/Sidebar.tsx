"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./NavLinks";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-surface-line bg-surface/60 px-4 py-6 md:flex">
      <Link href="/" className="mb-8 flex items-center gap-2 px-2">
        <span className="text-gradient-aurora font-display text-2xl font-bold tracking-tight">
          LUMORA
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-violet/15 text-text-primary"
                  : "text-text-muted hover:bg-surface-raised hover:text-text-primary"
              }`}
            >
              <span
                aria-hidden
                className={`flex h-6 w-6 items-center justify-center text-base ${
                  active ? "text-cyan" : "text-text-faint group-hover:text-cyan"
                }`}
              >
                {item.icon}
              </span>
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan" />}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-xl border border-surface-line bg-surface-raised/60 p-3 text-xs text-text-muted">
        <p className="font-display font-semibold text-text-primary">Play-money only</p>
        <p className="mt-1 leading-relaxed">
          Every credit on Lumora is a free demo token. No deposits, no withdrawals, no real-money
          wagers — ever.
        </p>
      </div>
    </aside>
  );
}
