import { Metadata } from "next";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, BookOpen, Download } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CTAButton from "../components/CTAButton";
import DownloadButton from "../components/DownloadButton";
import { getMaterials, getMaterialCategories } from "../lib/mdx";

export const metadata: Metadata = {
  title: "Materiais Gratuitos - LDC Capital",
  description: "E-books, guias e cartilhas gratuitas sobre investimentos e planejamento financeiro. Conteúdo especializado para ajudar você a tomar melhores decisões financeiras.",
};

export default function MateriaisPage() {
  const materials = getMaterials();
  const categories = getMaterialCategories();

  return (
    <main>
      <Header />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 lg:pt-32 lg:pb-24 bg-gradient-to-br from-[#262d3d] to-[#344645] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Materiais Gratuitos
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
              E-books, guias e cartilhas para aprimorar seu conhecimento sobre investimentos
            </p>
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

      {/* Materials Grid */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {materials.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Materiais em breve...</p>
              <p className="text-gray-500 mt-2">
                Estamos preparando conteúdos exclusivos para você. Volte em breve!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {materials.map((material) => (
                <Card key={material.slug} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
                  <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                    {material.cover ? (
                      <Image
                        src={material.cover}
                        alt={material.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#98ab44] to-[#becc6a] flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-white" />
                      </div>
                    )}
                    
                    {/* Type Badge */}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-[#262d3d] text-white">
                        {material.type}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {material.category}
                      </Badge>
                      {material.pages && (
                        <span className="text-xs text-gray-500">
                          {material.pages} páginas
                        </span>
                      )}
                    </div>
                    
                    <CardTitle className="font-serif text-xl text-[#262d3d] group-hover:text-[#98ab44] transition-colors line-clamp-2">
                      {material.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="text-gray-600 text-sm line-clamp-3 mb-6">
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
            <div className="text-center">
              <div className="w-16 h-16 bg-[#98ab44]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-[#98ab44]" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-[#262d3d] mb-3">
                Conteúdo Especializado
              </h3>
              <p className="text-gray-600">
                Material desenvolvido por consultores com mais de 400M sob gestão
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#98ab44]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-[#98ab44]" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-[#262d3d] mb-3">
                100% Gratuito
              </h3>
              <p className="text-gray-600">
                Acesso livre a todos os materiais, sem custos ocultos ou pegadinhas
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#98ab44]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-[#98ab44]" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-[#262d3d] mb-3">
                Aplicação Prática
              </h3>
              <p className="text-gray-600">
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
