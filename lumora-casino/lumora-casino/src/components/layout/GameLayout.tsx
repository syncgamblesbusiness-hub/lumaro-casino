import { ReactNode } from "react";

export function GameLayout({
  title,
  subtitle,
  controls,
  stage,
  below,
}: {
  title: string;
  subtitle: string;
  controls: ReactNode;
  stage: ReactNode;
  below?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold text-text-primary">{title}</h1>
        <p className="text-sm text-text-muted">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className="order-2 lg:order-1">{controls}</div>
        <div className="order-1 lg:order-2">{stage}</div>
      </div>
      {below && <div className="mt-4">{below}</div>}
    </div>
  );
}
