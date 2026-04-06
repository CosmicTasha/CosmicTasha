import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.BASE_URL || "https://cosmictasha.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/intake/results"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
