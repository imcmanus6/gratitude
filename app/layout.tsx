import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Gratitude Circles by NAI",
  description:
    "Notice the good, together. A quiet space for everyday gratitude.",
  icons: { icon: "/gratitude-logo.svg", apple: "/icons/gratitude-192.png" },
  appleWebApp: {
    capable: true,
    title: "Gratitude Circles",
    statusBarStyle: "default",
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
