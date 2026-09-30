import Link from "next/link";

const SECTIONS = [
  { href: "/incoming", label: "Incoming" },
  { href: "/off-air", label: "Off Air" },
  { href: "/rated", label: "Rated" },
  { href: "/hot-air", label: "Hot Air" },
  { href: "/ranked", label: "Ranked" },
];

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrap">
      <header className="masthead">
        <Link className="wordmark" href="/" aria-label="Dead Air, home">
          Dead <span>Air</span>
        </Link>
        <p className="tag-line">Fill the silence.</p>
        <nav className="nav" aria-label="Sections">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href}>{s.label}</Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer>Dead Air</footer>
    </div>
  );
}
