import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mutalia — Jumeau pédagogique complémentaire santé",
  description:
    "Prototype Mutalia : formation et simulation d'un back-office de complémentaire santé particuliers (Harmonie Mutuelle 2026, données fictives).",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
