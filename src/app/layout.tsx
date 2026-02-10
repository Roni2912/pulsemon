import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "PulseMon - Website Monitoring Made Simple",
    template: "%s | PulseMon",
  },
  description:
    "Monitor your websites 24/7 and get instant alerts when they go down. Track uptime, response times, and incidents with PulseMon.",
  keywords: [
    "website monitoring",
    "uptime monitoring",
    "downtime alerts",
    "status page",
    "incident tracking",
    "response time",
  ],
  authors: [{ name: "PulseMon" }],
  openGraph: {
    title: "PulseMon - Website Monitoring Made Simple",
    description:
      "Monitor your websites 24/7 and get instant alerts when they go down. Track uptime, response times, and incidents.",
    type: "website",
    siteName: "PulseMon",
  },
  twitter: {
    card: "summary_large_image",
    title: "PulseMon - Website Monitoring Made Simple",
    description:
      "Monitor your websites 24/7 and get instant alerts when they go down.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={plusJakartaSans.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
