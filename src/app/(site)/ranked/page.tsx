import type { Metadata } from "next";
import Link from "next/link";
import { Empty, RankRow, SecHead } from "@/components/blocks";
import { scoredReviews } from "@/lib/content";
import { rankArtists, sortReleases, SORT_KEYS, type SortKey } from "@/lib/ranked";
import { TYPE_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ranked", description: "The year so far, sorted by score." };

type Props = { searchParams: Promise<{ view?: string; by?: string }> };

export default async function Ranked({ searchParams }: Props) {
  const sp = await searchParams;
  const view = sp.view === "artists" ? "artists" : "releases";
  const by: SortKey = SORT_KEYS.some((k) => k.key === sp.by) ? (sp.by as SortKey) : "total";
  const scored = await scoredReviews();
  return (
    <section className="sec">
      <SecHead title="Ranked" />
      <p className="note">The year so far, sorted by score.</p>
      <div className="controls">
        <Link href="/ranked" aria-current={view === "releases"}>Releases</Link>
        <Link href="/ranked?view=artists" aria-current={view === "artists"}>Artists</Link>
        {view === "releases" && <>
          <span className="gap" />
          {SORT_KEYS.map((k) => (
            <Link key={k.key} href={k.key === "total" ? "/ranked" : `/ranked?by=${k.key}`} aria-current={by === k.key}>{k.label}</Link>
          ))}
        </>}
      </div>
      {view === "artists" ? (() => {
        const list = rankArtists(scored);
        return list.length
          ? list.map((a, i) => <RankRow key={a.artist} n={i + 1} name={a.artist} sub={`${a.count} releases, average score`} score={a.average} />)
          : <Empty>Artists need 2 or more scored releases to be ranked.</Empty>;
      })() : (() => {
        const list = sortReleases(scored, by);
        return list.length
          ? list.map((r, i) => <RankRow key={r.slug} n={i + 1} name={`${r.artist} – ${r.title}`} sub={TYPE_LABEL[r.type]} score={by === "total" ? r.total : r[by]} />)
          : <Empty />;
      })()}
    </section>
  );
}
