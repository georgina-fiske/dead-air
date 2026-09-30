import type { MetadataRoute } from "next";
import { indexingOn, siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  // Until SITE_INDEXING=on, keep every search engine out.
  if (!indexingOn()) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/media"] }, sitemap: `${siteUrl()}/sitemap.xml` };
}
