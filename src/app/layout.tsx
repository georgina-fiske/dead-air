import type { Metadata } from "next";
import { indexingOn, siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Dead Air", template: "%s | Dead Air" },
  description: "Fill the silence.",
  openGraph: { siteName: "Dead Air", locale: "en_AU", type: "website" },
  twitter: { card: "summary_large_image" },
  robots: indexingOn() ? undefined : { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
