import { MetadataRoute } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ldccapital.com.br";
  const baseUrl = siteUrl.replace(/\/$/, "");

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/consultoria`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/materiais`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contato`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/diagnostico-gratuito`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/trabalhe-conosco`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/informacoes-regulatorias`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/politica-privacidade`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/termos-de-uso`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    const supabase = createSupabaseAdminClient();

    const { data: postsData } = await supabase
      .from("BlogPost")
      .select("slug, updatedAt, publishedAt, published")
      .order("updatedAt", { ascending: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blogPages: MetadataRoute.Sitemap =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((postsData || []) as any[])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((post: any) => post && post.published)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((post: any) => ({
          url: `${baseUrl}/blog/${post.slug}`,
          lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(post.updatedAt || new Date()),
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }));

    const { data: materialsData } = await supabase
      .from("Material")
      .select("slug, updatedAt, publishedAt, published")
      .order("updatedAt", { ascending: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const materialPages: MetadataRoute.Sitemap =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((materialsData || []) as any[])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((material: any) => material && material.published)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((material: any) => ({
          url: `${baseUrl}/materiais/${material.slug}`,
          lastModified: material.publishedAt ? new Date(material.publishedAt) : new Date(material.updatedAt || new Date()),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }));

    return [...staticPages, ...blogPages, ...materialPages];
  } catch (error) {
    console.error("Erro ao gerar sitemap via Supabase:", error);
    return staticPages;
  }
}
