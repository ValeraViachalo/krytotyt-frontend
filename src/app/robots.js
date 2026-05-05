const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://krytotyt.com"
).replace(/\/$/, "");

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/legal", "/api"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
