import type { Metadata } from "next";

// Not linked from the public site. Kept out of search engines.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="admin">{children}</div>;
}
