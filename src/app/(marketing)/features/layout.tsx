import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Real-time monitoring, smart alerts, public status pages, SSL monitoring, incident tracking, and more. Everything you need to keep your sites online.",
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
