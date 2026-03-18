import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, User, ArrowLeft, Share2 } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import CTAButton from "../../components/CTAButton";
import { getBlogPostBySlug, getBlogPosts } from "../../lib/blog";
import { getArticleSchema } from "@/lib/schema";
import JsonLd from "@/components/JsonLd";

interface Props {
  params: Promise<{ slug: string }>;
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#262d3d] mt-10 mb-4 leading-tight">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#262d3d] mt-10 mb-4 leading-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-serif text-xl md:text-2xl font-semibold text-[#262d3d] mt-8 mb-3 leading-tight">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-base md:text-lg leading-8 text-[#344645] mb-6 whitespace-pre-line">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-6 space-y-2 text-base md:text-lg text-[#344645]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-6 space-y-2 text-base md:text-lg text-[#344645]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-8">{children}</li>,
  hr: () => <hr className="my-8 border-gray-200" />,
  blockquote: ({ children }) => (
    <blockquote className="my-8 border-l-4 border-[#98ab44] bg-[#f7f8f3] px-5 py-3 italic text-[#344645]">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => {
    const isExternal = typeof href === "string" && /^https?:\/\//i.test(href);

    return (
      <a
        href={href}
        className="text-[#98ab44] font-medium underline-offset-4 hover:underline"
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  },
  strong: ({ children }) => <strong className="font-semibold text-[#262d3d]">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element -- URLs do conteúdo são dinâmicas e podem ser externas
    <img
      src={src ?? ""}
      alt={alt ?? "Imagem do post"}
      className="w-full rounded-xl my-6"
      loading="lazy"
    />
  ),
  code: ({ className, children }) => {
    const isCodeBlock = Boolean(className && className.includes("language-"));

    if (isCodeBlock) {
      return <code className={className}>{children}</code>;
    }

    return (
      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm text-[#262d3d]">{children}</code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-6 overflow-x-auto rounded-xl bg-[#262d3d] p-4 text-sm text-white">
      {children}
    </pre>
  ),
};

// Removido generateStaticParams para evitar consultas ao banco durante build
// A página será renderizada dinamicamente no servidor

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Post não encontrado - LDC Capital",
    };
  }

  return {
    title: `${post.title} - LDC Capital`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.date,
      authors: post.author.name ? [post.author.name] : [],
      images: post.cover ? [post.cover] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Get related posts (simplified for now)
  const allPosts = await getBlogPosts();
  const relatedPosts = allPosts
    .filter(p => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3);

  const articleSchema = getArticleSchema(
    post.title,
    post.summary || post.title,
    post.cover,
    post.date,
    post.updatedAt || post.date
  );

  return (
    <main>
      <Header />
      <JsonLd data={articleSchema} />
      
      <article className="pt-20">
        {/* Hero Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-[#262d3d] to-[#344645] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <Link
                href="/blog"
                className="inline-flex items-center text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Blog
              </Link>
            </div>
            
            <div className="mb-6">
              <Badge className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white">
                {post.category}
              </Badge>
            </div>
            
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-gray-300">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                {post.author.name || "Autor"}
              </div>
              <div className="flex items-center">
                <CalendarDays className="w-4 h-4 mr-2" />
                {format(new Date(post.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {post.readingTime}
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-none">
              <ReactMarkdown components={markdownComponents}>{post.content}</ReactMarkdown>
            </div>

            {/* Share Section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold text-[#262d3d]">
                  Compartilhe este artigo
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[#98ab44] border-[#98ab44] hover:bg-[#98ab44] hover:text-white"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="font-serif text-2xl lg:text-3xl font-bold text-[#262d3d] mb-8 text-center">
                Artigos Relacionados
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Card key={relatedPost.slug} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                    <div className="aspect-video bg-gray-200 relative overflow-hidden">
                      {relatedPost.cover ? (
                        <Image
                          src={relatedPost.cover}
                          alt={relatedPost.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#98ab44] to-[#becc6a] flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">
                            {relatedPost.title.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <Badge variant="secondary" className="text-xs mb-2">
                        {relatedPost.category}
                      </Badge>
                      
                      <h3 className="font-serif text-lg font-semibold text-[#262d3d] group-hover:text-[#98ab44] transition-colors line-clamp-2 mb-2">
                        <Link href={`/blog/${relatedPost.slug}`}>
                          {relatedPost.title}
                        </Link>
                      </h3>
                      
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {relatedPost.summary}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 bg-[#262d3d] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-2xl lg:text-3xl font-bold mb-4">
              Gostou do conteúdo?
            </h2>
            <p className="text-xl text-gray-200 mb-8">
              Converse com nossa equipe e descubra como podemos ajudar você a alcançar seus objetivos financeiros.
            </p>
            
            <CTAButton
              size="lg"
              className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white px-8 py-4 text-lg font-semibold"
            >
              Fale Conosco
            </CTAButton>
          </div>
        </section>
      </article>

      <Footer />
    </main>
  );
}
