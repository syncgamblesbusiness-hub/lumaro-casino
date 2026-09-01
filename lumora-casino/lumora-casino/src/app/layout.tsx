import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { FairnessBootstrap } from "@/components/fairness/FairnessBootstrap";

export const metadata: Metadata = {
  title: "Lumora",
  description:
    "Lumora is a casino with: Plinko, Dice and Ascent with a transparent provably-fair engine.",
};

// Fonts are loaded via a plain <link> tag (see below) instead of next/font,
// so the project builds even without network access at build time. With
// internet access at runtime the real Space Grotesk / Inter / JetBrains Mono
// load; otherwise the CSS fallback stack in globals.css is used.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-void text-text-primary antialiased">
        <FairnessBootstrap />
        <AppShell>{children}</AppShell>
        <ToastContainer />
      </body>
    </html>
  );
}
