import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pesat - AI Ads Growth Loop MVP",
  description: "Multi-tenant AI ads workspace connecting creative generation, Meta publishing, performance analytics and learning into one closed loop.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-purple-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
