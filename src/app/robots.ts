import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || "https://<your-vercel-domain>";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/explore", "/explore/map", "/login", "/register", "/forgot-password"],
        disallow: ["/citizen/", "/authority/", "/admin/", "/api/", "/403"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

