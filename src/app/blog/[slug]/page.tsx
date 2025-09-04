import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, User, ArrowLeft, Share2 } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import CTAButton from "../../components/CTAButton";
import { getBlogPostBySlug, getBlogPosts, getRelatedPosts } from "../../lib/mdx";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

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
      authors: [post.author],
      images: post.cover ? [post.cover] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(post.slug, post.category, 3);

  return (
    <main>
      <Header />
      
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
                {post.author}
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
            <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-[#262d3d] prose-a:text-[#98ab44] prose-a:no-underline hover:prose-a:underline">
              <MDXRemote source={post.content} />
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
