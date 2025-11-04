import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url;
  
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/.data/",
          "/admin/",
          "/diagnostico-gratuito",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/.data/",
          "/admin/",
          "/diagnostico-gratuito",
        ],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: [
          "/api/",
          "/.data/",
          "/admin/",
          "/diagnostico-gratuito",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

