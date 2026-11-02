import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.APP_URL || "https://civicpulse.vercel.app";
  const now = new Date();

  const publicRoutes = [
    { url: `${baseUrl}`, lastModified: now, changeFrequency: "daily" as const, priority: 1.0 },
    { url: `${baseUrl}/explore`, lastModified: now, changeFrequency: "hourly" as const, priority: 0.9 },
    { url: `${baseUrl}/explore/map`, lastModified: now, changeFrequency: "hourly" as const, priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/register`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/forgot-password`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.3 },
  ];

  return publicRoutes;
}

