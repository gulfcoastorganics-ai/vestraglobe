import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Intelligence Premiere — Destin Villanueva",
  description: "A monochrome, WebGL-powered project sphere presenting Destin Villanueva's systems, experiments, and tools in true three-dimensional space.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
