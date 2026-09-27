import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "sat-x",
  description: "A social network for satellite-building teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
