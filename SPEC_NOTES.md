# Dead Air: spec notes (saved as we go)

## Look (from Georgina's screenshots, treated as the palette and fonts)
Colours (design tokens, not hard-coded):
- Blush Cream  #F8EDEB  (light background)
- Butter Yellow #FFD166 (accent)
- Lavender Haze #CDB4DB (accent 2)
- Keep near-black text (#121212) for contrast. Dark mode still needed.

Fonts (pairing guide: sans serif + condensed display + script for small details):
- Helvetica Neue (body). Fallback: Helvetica, Arial.
- Thunder (tall, tight, bold display). Use for wordmark and big scores.
- Aaleyah (script). Small details only, e.g. the "&".
- To check: font licences for web use.

## Rubric (draft 3)
Bias 25, Craft 30, Nerve 15, Crowd 15, Replay 15 = 100. Whole numbers.
Ties go to higher Bias. Artists need 2+ scored releases.
Sub-lists: Most Nerve, Best Crowd, Biggest Replay (and Bias, Craft).
Review = take + five lines (one per category). Replay is scored days later.
Rubric fixed for the year. Store rubricVersion on each review.
If a fan of the artist, say so in the review.

## Voice
See BRAND voice guide. Voice check is warnings only.
Empty state: "Nothing here yet." Error: "That page is gone."

## Blocked on
Empty GitHub repo `dead-air` connected to Claude Code on the web.

## Search engines (added with SEO step)
- Site is hidden from search engines until SITE_INDEXING=on is set on Railway (launch day).
- Set SITE_URL=https://deadair.com.au once the domain is attached (used in sitemap, canonical links, share images).
- Example content shows (tagged) until HIDE_EXAMPLES=1 is set. Remove examples from the admin Overview page.
- Share images use Archivo Black as a placeholder font. Swap when Thunder is cleared for web use.
