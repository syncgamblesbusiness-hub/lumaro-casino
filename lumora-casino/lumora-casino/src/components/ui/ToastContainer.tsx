"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useToastStore } from "@/lib/store/toast";

const kindStyles: Record<string, string> = {
  success: "border-win/40 bg-win/10 text-win",
  error: "border-loss/40 bg-loss/10 text-loss",
  info: "border-cyan/40 bg-cyan/10 text-cyan",
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.18 }}
            className={`rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md ${kindStyles[t.kind]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-sm font-semibold text-text-primary">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs text-text-muted">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="text-text-muted transition hover:text-text-primary"
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
