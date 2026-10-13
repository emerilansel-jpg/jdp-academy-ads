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
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('pesat_theme_preference') || 'light';
                if (t === 'dark') document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen antialiased selection:bg-purple-500 selection:text-white transition-colors duration-150">
        {children}
      </body>
    </html>
  );
}
