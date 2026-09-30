import "server-only";
import { db } from "@/lib/db";
import { RUBRIC_VERSION, computeTotal } from "@/lib/rubric";

// Invented artists. Every row is flagged isExample so it can be removed in one click.
const REVIEWS = [
  { artist: "Artist X", title: "Second Album", type: "ALBUM", label: "Example Records", listened: "2026-08-12",
    s: [20, 19, 12, 11, 9], take: "Louder than the first one and not as clever.",
    l: ["Yes. Annoyingly.", "Loud drums, thin vocals, one great chorus. The lyrics are lazy.", "A 7-minute closer with no chorus. Respect.", "Track three would ruin a wedding in the best way.", "Still humming the bridge. Not the song. The bridge."] },
  { artist: "Artist X", title: "Debut", type: "ALBUM", label: "Example Records", listened: "2026-02-03",
    s: [14, 18, 9, 10, 9], take: "Ten songs. They all start the same.",
    l: ["Fine. Then fine again.", "Clean and careful. Nobody sounds nervous.", "Nothing that could go wrong did.", "Good at a barbecue. Bad in a club.", "Forgot the name by Thursday."] },
  { artist: "Artist Y", title: "Late Bloom", type: "ALBUM", label: "Waiting Room", listened: "2026-07-01",
    s: [10, 15, 6, 8, 9], take: "Good voice. Nothing to say.",
    l: ["Wanted to like it. Didn't.", "Sounds like a very expensive waiting room.", "One risk. It was a key change.", "Works with headphones and a nap.", "Came back for one song. Just the one."] },
  { artist: "Artist Y", title: "Early Bird", type: "EP", label: "Waiting Room", listened: "2026-03-20",
    s: [12, 17, 8, 9, 9], take: "Four songs. Three of them are the same song.",
    l: ["Pleasant. Like a lift.", "Warm mix. Thin ideas.", "It tried a horn. Once.", "Fine at a picnic.", "Hummed the horn. Not the song."] },
  { artist: "Artist Z", title: "Untitled EP", type: "EP", label: "Loud Room", listened: "2026-09-05",
    s: [22, 26, 13, 14, 13], take: "Four songs, no filler.",
    l: ["Played it three times in a row.", "The bass is doing something illegal.", "Ends mid-sentence. On purpose.", "Play it at a volume you'd regret.", "Still on my phone. Still on repeat."] },
  { artist: "Artist Z", title: "Second Try", type: "SINGLE", label: "Loud Room", listened: "2026-06-10",
    s: [19, 24, 11, 13, 12], take: "One song. Does the job.",
    l: ["Yes.", "Tight and dirty in the right places.", "The drop is late. Brave.", "You can already see the room.", "Came back twice. Wanted to."] },
];

const PRESS = [
  { artist: "Artist X", title: "Third Album", type: "ALBUM", label: "Example Records", date: "2026-11-06",
    body: "Artist X return with their third album, recorded over eleven days in a converted shed.\n\nThe record follows the release of Second Album earlier this year and will be available on all platforms." },
  { artist: "Artist Z", title: "Night Shift", type: "SINGLE", label: "Loud Room", date: "2026-10-16",
    body: "Artist Z release a new single, Night Shift, out Friday 16 October.\n\nThe track was written on the road and finished in one take." },
];

const INTERVIEW = {
  artist: "Artist X", subtitle: "Second Album", date: "2026-08-20",
  qa: [
    { question: "You recorded your first album in a garage and your second in a proper studio. What did the studio take away?", answer: "honestly nothing, it gave us a door that shut. the shed was louder tho" },
    { question: "Your closer runs seven minutes with no chorus. What made you leave the hook out?", answer: "we didnt have one. we tried, it was bad, so we just kept going" },
    { question: "You've said you hate playing track six live. What is the hardest part of making it work in a room?", answer: "its too slow!! nobody moves. we play it anyway because our mum likes it" },
  ],
};

const OPINIONS = [
  { title: "Nobody needs a 20-track album.",
    body: "Most albums are too long. Yours is too. Cut the last four songs and watch it get better.\n\nNobody listens to song eighteen. The people who say they do are lying or on a train.\n\nTen songs is a record. Twenty is a folder." },
  { title: "Stop putting the single first.",
    body: "The single is the song everyone already heard. Putting it first is a waste of a good spot.\n\nOpen with something they haven't heard. Save the single for track four. Let people earn it." },
];

export async function addExamples() {
  if ((await db.release.count({ where: { isExample: true } })) > 0) return false;
  const now = new Date();
  const day = 86_400_000;
  for (const [i, r] of REVIEWS.entries()) {
    const release = await db.release.create({
      data: { slug: `example-${i}-${r.artist}-${r.title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"), artist: r.artist, title: r.title, type: r.type as "ALBUM", label: r.label, releaseDate: new Date(r.listened), isExample: true },
    });
    const [bias, craft, nerve, crowd, replay] = r.s;
    await db.review.create({
      data: {
        slug: release.slug, releaseId: release.id, rubricVersion: RUBRIC_VERSION, take: r.take,
        biasLine: r.l[0], craftLine: r.l[1], nerveLine: r.l[2], crowdLine: r.l[3], replayLine: r.l[4],
        bias, craft, nerve, crowd, replay, total: computeTotal({ bias, craft, nerve, crowd, replay }),
        listenedAt: new Date(r.listened), status: "PUBLISHED", publishedAt: new Date(now.getTime() - i * day), isExample: true,
      },
    });
  }
  for (const [i, p] of PRESS.entries()) {
    const release = await db.release.create({
      data: { slug: `example-press-${i}-${p.title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"), artist: p.artist, title: p.title, type: p.type as "ALBUM", label: p.label, releaseDate: new Date(p.date), isExample: true },
    });
    await db.pressRelease.create({
      data: { slug: release.slug, releaseId: release.id, body: p.body, receivedFrom: "Example PR", receivedAt: now, status: "PUBLISHED", publishedAt: new Date(now.getTime() - i * day), isExample: true },
    });
  }
  await db.interview.create({
    data: {
      slug: "example-artist-x-second-album", artist: INTERVIEW.artist, subtitle: INTERVIEW.subtitle, date: new Date(INTERVIEW.date),
      status: "PUBLISHED", publishedAt: now, isExample: true,
      qa: { create: INTERVIEW.qa.map((q, position) => ({ ...q, position })) },
    },
  });
  for (const [i, o] of OPINIONS.entries()) {
    await db.opinion.create({
      data: { slug: `example-${o.title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, ""), title: o.title, body: o.body, status: "PUBLISHED", publishedAt: new Date(now.getTime() - i * day), isExample: true },
    });
  }
  return true;
}

export async function removeExamples() {
  // Releases cascade to their press releases and reviews.
  const a = await db.release.deleteMany({ where: { isExample: true } });
  const b = await db.interview.deleteMany({ where: { isExample: true } });
  const c = await db.opinion.deleteMany({ where: { isExample: true } });
  return a.count + b.count + c.count;
}
