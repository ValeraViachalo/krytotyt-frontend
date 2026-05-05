import { client } from "@/lib/sanity/client";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://krytotyt.com"
).replace(/\/$/, "");

export const revalidate = 3600;

const STATIC_ROUTES = ["", "/about", "/cases", "/services"];

export default async function sitemap() {
  const cases = await client.fetch(
    `*[_type == "projectDetails" && defined(slug.current)]{
       "slug": slug.current,
       "updatedAt": _updatedAt
     }`,
  );

  const now = new Date();

  const staticEntries = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));

  const caseEntries = (cases || []).map((c) => ({
    url: `${SITE_URL}/cases/${c.slug}`,
    lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...caseEntries];
}
