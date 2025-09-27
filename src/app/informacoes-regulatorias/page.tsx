"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Download, ExternalLink } from "lucide-react";

const documentos = [
  {
    id: 1,
    titulo: "Manual de Compliance e de Controles Internos",
    descricao: "Documento que estabelece as diretrizes de compliance e controles internos da LDC Capital.",
    arquivo: "/documentos/regulatorios/codigo-etica-conduta.pdf",
    categoria: "Compliance"
  },
  {
    id: 2,
    titulo: "Código de Ética",
    descricao: "Princípios éticos e de conduta que norteiam as atividades da LDC Capital.",
    arquivo: "/documentos/regulatorios/codigo-etica-conduta.pdf",
    categoria: "Ética"
  },
  {
    id: 3,
    titulo: "Política de Suitability",
    descricao: "Política para verificação da adequação dos produtos e serviços aos perfis dos clientes.",
    arquivo: "/documentos/regulatorios/politica-suitability.pdf",
    categoria: "Investimentos"
  },
  {
    id: 4,
    titulo: "Formulário de Referência",
    descricao: "Informações detalhadas sobre a estrutura, atividades e governança da LDC Capital.",
    arquivo: "/documentos/regulatorios/FORMULÁRIO_DE_REFERÊNCIA_LDC_OFICIAL[1].pdf",
    categoria: "Governança"
  },
  {
    id: 5,
    titulo: "Política de Investimento Pessoal",
    descricao: "Diretrizes para investimentos pessoais de colaboradores e pessoas relacionadas.",
    arquivo: "/documentos/regulatorios/POLÍTICA_DE_NEGOCIAÇÃO_DE_VALORES_MOBILIÁRIOS_LDC_OFICIAL[1].pdf",
    categoria: "Investimentos"
  }
];

export default function InformacoesRegulatorias() {
  const handleDownload = (arquivo: string, titulo: string) => {
    // Abrir em nova aba
    window.open(arquivo, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com gradiente azul */}
      <div className="bg-gradient-to-r from-[#262d3d] to-[#3a4356] text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-sans tracking-wider uppercase mb-4 opacity-90">
              LDC CAPITAL
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">
              Informações Regulatórias
            </h1>
            
            {/* Lista de documentos no header */}
            <div className="max-w-2xl mx-auto text-left space-y-3 mt-8">
              <div className="text-white/90 font-sans">
                <p className="mb-4 text-lg">Documentos disponíveis:</p>
                <ul className="space-y-2 text-base">
                  <li className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-[#98ab44]" />
                    Manual de Compliance e de Controles Internos
                  </li>
                  <li className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-[#98ab44]" />
                    Código de Ética
                  </li>
                  <li className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-[#98ab44]" />
                    Política de Suitability
                  </li>
                  <li className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-[#98ab44]" />
                    Formulário de Referência
                  </li>
                  <li className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-[#98ab44]" />
                    Política de Investimento Pessoal
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Botão Voltar */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-[#98ab44] hover:text-[#262d3d] transition-colors font-sans"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao início
          </Link>
        </div>

        {/* Introdução */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
            Transparência e Compliance
          </h2>
          <p className="text-gray-600 font-sans leading-relaxed">
            A LDC Capital mantém o compromisso com a transparência e o cumprimento das normas regulatórias. 
            Abaixo você encontra nossos principais documentos de compliance, políticas internas e informações 
            regulatórias. Todos os documentos estão disponíveis para consulta e download.
          </p>
        </div>

        {/* Grid de Documentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documentos.map((doc) => (
            <div key={doc.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="p-6">
                {/* Categoria */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#98ab44]/10 text-[#98ab44]">
                    {doc.categoria}
                  </span>
                  <FileText className="h-8 w-8 text-[#262d3d]" />
                </div>

                {/* Título */}
                <h3 className="font-serif text-lg font-bold text-[#262d3d] mb-3 line-clamp-2">
                  {doc.titulo}
                </h3>

                {/* Descrição */}
                <p className="text-gray-600 font-sans text-sm leading-relaxed mb-4 line-clamp-3">
                  {doc.descricao}
                </p>

                {/* Botão de Download */}
                <button
                  onClick={() => handleDownload(doc.arquivo, doc.titulo)}
                  className="w-full flex items-center justify-center bg-[#98ab44] hover:bg-[#262d3d] text-white px-4 py-2 rounded-lg font-sans font-medium transition-colors duration-300"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visualizar PDF
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Informações Adicionais */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
            Informações Regulatórias
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#262d3d] mb-3">
                Dados da Empresa
              </h3>
              <ul className="space-y-2 text-gray-600 font-sans">
                <li><strong>Razão Social:</strong> LDC Capital Consultoria de Investimentos</li>
                <li><strong>CNPJ:</strong> 58.321.323/0001-67</li>
                <li><strong>Registro CVM:</strong> Em processo de regularização</li>
                <li><strong>Endereço:</strong> Rua Rio Branco, 2393, sala 02, Centro - Taquara/RS</li>
                <li><strong>CEP:</strong> 95600-074</li>
              </ul>
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#262d3d] mb-3">
                Contato Regulatório
              </h3>
              <ul className="space-y-2 text-gray-600 font-sans">
                <li><strong>Email:</strong> <a href="mailto:contato@ldccapital.com.br" className="text-[#98ab44] hover:text-[#262d3d] underline">contato@ldccapital.com.br</a></li>
                <li><strong>Telefone:</strong> Em breve</li>
                <li><strong>Ouvidoria:</strong> Em implementação</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Aviso Legal */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-serif text-lg font-semibold text-[#262d3d] mb-3">
            Aviso Legal
          </h3>
          <p className="text-gray-600 font-sans text-sm leading-relaxed">
            Os documentos disponibilizados nesta seção são de caráter informativo e regulatório. 
            A LDC Capital reserva-se o direito de atualizar estes documentos conforme necessário 
            para manter a conformidade com as normas vigentes. Para dúvidas específicas sobre 
            compliance ou questões regulatórias, entre em contato através dos canais oficiais.
          </p>
        </div>

        {/* Botões de ação */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/contato"
            className="inline-flex items-center justify-center bg-[#98ab44] hover:bg-[#262d3d] text-white px-8 py-3 rounded-lg font-sans font-medium transition-colors"
          >
            Fale Conosco
          </Link>
          <Link 
            href="/politica-privacidade"
            className="inline-flex items-center justify-center border-2 border-[#98ab44] text-[#98ab44] hover:bg-[#98ab44] hover:text-white px-8 py-3 rounded-lg font-sans font-medium transition-colors"
          >
            Política de Privacidade
          </Link>
        </div>
      </div>
    </div>
  );
}
