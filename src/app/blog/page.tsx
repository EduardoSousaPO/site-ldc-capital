import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, Clock, Search, ArrowRight } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getBlogPosts, getBlogCategories } from "../lib/mdx";

export const metadata: Metadata = {
  title: "Blog - LDC Capital",
  description: "Artigos e insights sobre investimentos, planejamento financeiro e consultoria. Conteúdo especializado para ajudar você a tomar melhores decisões financeiras.",
};

export default function BlogPage() {
  const posts = getBlogPosts();
  const categories = getBlogCategories();
  const featuredPosts = posts.slice(0, 3); // Posts mais lidos

  return (
    <main>
      <Header />
      
      {/* Hero Section - Inspirado na Musa */}
      <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 bg-gradient-to-br from-[#98ab44] to-[#becc6a] text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 2px, transparent 2px)`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        {/* Elementos decorativos circulares */}
        <div className="absolute top-10 right-10 w-32 h-32 border-2 border-white/20 rounded-full"></div>
        <div className="absolute bottom-10 right-20 w-48 h-48 border-2 border-white/10 rounded-full"></div>
        <div className="absolute top-1/2 right-5 w-24 h-24 border border-white/30 rounded-full"></div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block px-4 py-2 bg-white/20 text-white text-sm font-medium rounded-full border border-white/30 mb-6">
              BLOG LDC CAPITAL
            </div>
            
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Confira nosso Blog
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Insights e conhecimento sobre investimentos, planejamento financeiro e consultoria
            </p>
          </div>
        </div>
      </section>

      {/* Main Content - Layout com Sidebar */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Posts Grid - 3/4 da largura */}
            <div className="lg:col-span-3">
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Nenhum post encontrado.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {posts.map((post) => (
                      <Card key={post.slug} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden bg-white">
                        <div className="aspect-[16/10] bg-gray-200 relative overflow-hidden">
                          {post.cover ? (
                            <Image
                              src={post.cover}
                              alt={post.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#98ab44] to-[#becc6a] flex items-center justify-center">
                              <span className="text-white text-4xl font-bold">
                                {post.title.charAt(0)}
                              </span>
                            </div>
                          )}
                          
                          {/* Category Badge */}
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-[#98ab44] text-white hover:bg-[#98ab44]/90 text-xs font-medium px-3 py-1">
                              {post.category.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        
                        <CardContent className="p-6">
                          <h2 className="font-serif text-xl font-bold text-[#262d3d] group-hover:text-[#98ab44] transition-colors mb-3 line-clamp-2 leading-tight">
                            <Link href={`/blog/${post.slug}`}>
                              {post.title}
                            </Link>
                          </h2>
                          
                          <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                            {post.summary}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center">
                              <CalendarDays className="w-3 h-3 mr-1" />
                              {format(new Date(post.date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {post.readingTime}
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <Link 
                              href={`/blog/${post.slug}`}
                              className="text-[#98ab44] hover:text-[#98ab44]/80 font-medium text-sm flex items-center group/link"
                            >
                              LEIA MAIS
                              <ArrowRight className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Paginação */}
                  <div className="flex justify-center items-center space-x-2">
                    <Button variant="outline" size="sm" className="text-[#98ab44] border-[#98ab44] hover:bg-[#98ab44] hover:text-white">
                      Anterior
                    </Button>
                    <Button size="sm" className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white min-w-[40px]">
                      1
                    </Button>
                    <Button variant="outline" size="sm" className="text-gray-600 hover:text-[#98ab44] min-w-[40px]">
                      2
                    </Button>
                    <Button variant="outline" size="sm" className="text-gray-600 hover:text-[#98ab44] min-w-[40px]">
                      3
                    </Button>
                    <span className="text-gray-500">...</span>
                    <Button variant="outline" size="sm" className="text-gray-600 hover:text-[#98ab44] min-w-[40px]">
                      5
                    </Button>
                    <Button variant="outline" size="sm" className="text-[#98ab44] border-[#98ab44] hover:bg-[#98ab44] hover:text-white">
                      Próximo
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Sidebar - 1/4 da largura */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Campo de Pesquisa */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Pesquisar"
                      className="pr-12 border-gray-200 focus:border-[#98ab44] focus:ring-[#98ab44]"
                    />
                    <Button 
                      size="sm"
                      className="absolute right-1 top-1 bg-[#98ab44] hover:bg-[#98ab44]/90 h-8 w-8 p-0"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Categorias */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <h3 className="font-serif text-lg font-bold text-[#262d3d]">Categorias</h3>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center">
                        <div className="w-2 h-2 bg-[#98ab44] rounded-full mr-3"></div>
                        <Link 
                          href={`/blog?categoria=${category}`}
                          className="text-gray-700 hover:text-[#98ab44] transition-colors text-sm"
                        >
                          {category}
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Card de Consultoria */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-[#98ab44] to-[#becc6a] text-white overflow-hidden relative">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.2) 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                  }}></div>
                </div>
                
                <CardContent className="p-6 relative z-10 text-center">
                  <h3 className="font-serif text-xl font-bold mb-3">
                    Consultoria de Investimentos LDC Capital
                  </h3>
                  
                  <p className="text-white/90 text-sm mb-4 leading-relaxed">
                    O modelo de gestão de patrimônio mais eficiente do mundo, agora ao seu alcance.
                  </p>
                  
                  <Button 
                    className="bg-white text-[#98ab44] hover:bg-white/90 font-semibold w-full"
                    asChild
                  >
                    <Link href="/consultoria">
                      Saber mais
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* As mais lidas */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <h3 className="font-serif text-lg font-bold text-[#262d3d]">As mais lidas:</h3>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  {featuredPosts.map((post) => (
                    <div key={post.slug} className="flex space-x-3 group">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {post.cover ? (
                          <Image
                            src={post.cover}
                            alt={post.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#98ab44] to-[#becc6a] flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {post.title.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-[#262d3d] group-hover:text-[#98ab44] transition-colors line-clamp-2 leading-tight mb-1">
                          <Link href={`/blog/${post.slug}`}>
                            {post.title}
                          </Link>
                        </h4>
                        
                        <div className="text-xs text-gray-500 flex items-center">
                          <CalendarDays className="w-3 h-3 mr-1" />
                          {format(new Date(post.date), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                        
                        <Link 
                          href={`/blog/${post.slug}`}
                          className="text-[#98ab44] hover:text-[#98ab44]/80 text-xs font-medium inline-flex items-center mt-2 group/link"
                        >
                          Leia Mais
                          <ArrowRight className="w-3 h-3 ml-1 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}