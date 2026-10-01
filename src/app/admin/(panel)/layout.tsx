import Link from "next/link";
import { requireAdmin } from "@/lib/adminAuth";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

export const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/rated", label: "Rated" },
  { href: "/admin/incoming", label: "Incoming" },
  { href: "/admin/off-air", label: "Off Air" },
  { href: "/admin/hot-air", label: "Hot Air" },
  { href: "/admin/releases", label: "Releases" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/icons", label: "Icons" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="wrap">
      <header className="masthead admin-head">
        <Link className="admin-mark" href="/admin">Dead <span>Air</span> <small>admin</small></Link>
        <nav className="nav" aria-label="Admin">
          {NAV.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
        </nav>
        <form action={logoutAction} className="admin-who">
          <span>{user.email}</span>
          <button type="submit">Log out</button>
        </form>
      </header>
      <main>{children}</main>
    </div>
  );
}
