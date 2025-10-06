import { Metadata } from "next";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, BookOpen, Download } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CTAButton from "../components/CTAButton";
import DownloadButton from "../components/DownloadButton";
import { getMaterials, getMaterialCategories } from "../lib/materials";

export const metadata: Metadata = {
  title: "Materiais Gratuitos - LDC Capital",
  description: "E-books, guias e cartilhas gratuitas sobre investimentos e planejamento financeiro. Conteúdo especializado para ajudar você a tomar melhores decisões financeiras.",
};

export default async function MateriaisPage() {
  const materials = await getMaterials();
  const categories = await getMaterialCategories();

  return (
    <main>
      <Header />
      
      {/* Hero Section Premium */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background com cor uniforme conforme print */}
        <div className="absolute inset-0 bg-[#262d3d]">
          {/* Padrão sutil para textura */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20% 20%, rgba(152, 171, 68, 0.1) 2px, transparent 2px),
                               radial-gradient(circle at 80% 80%, rgba(190, 204, 106, 0.05) 2px, transparent 2px)`,
              backgroundSize: '60px 60px'
            }}></div>
          </div>
          
          {/* Elementos decorativos flutuantes */}
          <div className="absolute top-20 right-10 w-32 h-32 border-2 border-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-48 h-48 border border-white/5 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-10 w-24 h-24 border border-white/20 rounded-full animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="text-center max-w-5xl mx-auto">
            
            {/* Título com gradiente */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8 leading-tight animate-slide-up delay-200 px-2 sm:px-0">
              <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                Materiais 
              </span>
              <span className="text-white"> Gratuitos</span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-12 text-gray-100 max-w-4xl mx-auto leading-relaxed font-light animate-slide-up delay-300 px-2 sm:px-0">
              E-books, guias e cartilhas para aprimorar seu conhecimento sobre investimentos
            </p>

            {/* Stats premium */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 animate-slide-up delay-500 max-w-3xl mx-auto px-4 sm:px-0">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
                <div className="text-2xl sm:text-3xl font-bold text-[#98ab44] mb-2">100%</div>
                <div className="text-white/80 text-sm sm:text-base">Gratuito</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
                <div className="text-2xl sm:text-3xl font-bold text-[#98ab44] mb-2">Especializado</div>
                <div className="text-white/80 text-sm sm:text-base">Por consultores</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
                <div className="text-2xl sm:text-3xl font-bold text-[#98ab44] mb-2">Prático</div>
                <div className="text-white/80 text-sm sm:text-base">Aplicação imediata</div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Categories */}
      <section className="py-8 bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="outline" className="text-[#98ab44] border-[#98ab44]">
              Todos
            </Badge>
            {categories.map((category) => (
              <Badge key={category} variant="outline">
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Materials Grid Premium */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {materials.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-[#98ab44]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-12 h-12 text-[#98ab44]" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">Materiais em breve...</h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
                Estamos preparando conteúdos exclusivos para você. Volte em breve!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
              {materials.map((material) => (
                <Card key={material.slug} className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg overflow-hidden bg-white rounded-2xl sm:rounded-3xl">
                  <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                    {material.cover ? (
                      <Image
                        src={material.cover}
                        alt={material.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#98ab44] to-[#becc6a] flex items-center justify-center relative">
                        <BookOpen className="w-20 h-20 text-white/90" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/10"></div>
                      </div>
                    )}
                    
                    {/* Type Badge Premium */}
                    <div className="absolute top-6 left-6">
                      <Badge className="bg-[#262d3d]/90 backdrop-blur-md text-white px-3 py-1 text-sm font-medium border border-white/20">
                        {material.type}
                      </Badge>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-8 pt-4 sm:pt-8">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <Badge variant="secondary" className="text-xs sm:text-sm bg-[#98ab44]/10 text-[#98ab44] border-[#98ab44]/20">
                        {material.category}
                      </Badge>
                      {material.pages && (
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          {material.pages} páginas
                        </span>
                      )}
                    </div>
                    
                    <CardTitle className="font-serif text-lg sm:text-xl lg:text-2xl text-[#262d3d] group-hover:text-[#98ab44] transition-colors duration-300 line-clamp-2 leading-tight">
                      {material.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="pt-0 px-4 sm:px-8 pb-4 sm:pb-8">
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 line-clamp-3">
                      {material.description}
                    </p>
                    
                    <DownloadButton material={material} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#262d3d] mb-4">
              Por que baixar nossos materiais?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Conteúdo desenvolvido por especialistas para acelerar seu aprendizado
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#98ab44] to-[#becc6a] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <BookOpen className="w-10 w-10 text-white" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
                Conteúdo Especializado
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Material desenvolvido por consultores com mais de 400M sob gestão e consultoria
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#becc6a] to-[#98ab44] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Download className="w-10 w-10 text-white" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
                100% Gratuito
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Acesso livre a todos os materiais, sem custos ocultos ou pegadinhas
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#98ab44] to-[#becc6a] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FileText className="w-10 w-10 text-white" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
                Aplicação Prática
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Guias com passo a passo e ferramentas para aplicar imediatamente
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-[#262d3d] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold mb-6">
            Quer ir além dos materiais?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Nossa consultoria personalizada pode acelerar ainda mais seus resultados com estratégias sob medida.
          </p>
          
          <CTAButton
            size="lg"
            className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white px-8 py-4 text-lg font-semibold"
          >
            Fale com um Consultor
          </CTAButton>
          
          <p className="text-sm text-gray-400 mt-4">
            Análise gratuita • Sem compromisso • Atendimento personalizado
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
