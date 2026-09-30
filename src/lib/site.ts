// Where the site lives. Set SITE_URL on Railway once deadair.com.au is attached.
export function siteUrl(): string {
  const explicit = process.env.SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return "http://localhost:3000";
}

// Search engines are kept out until you set SITE_INDEXING=on on Railway (launch day).
export const indexingOn = () => process.env.SITE_INDEXING === "on";
