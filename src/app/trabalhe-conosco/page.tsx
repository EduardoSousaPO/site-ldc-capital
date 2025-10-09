"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Send, User, Mail, Phone, FileText, Briefcase } from "lucide-react";
import { toast } from "sonner";

export default function TrabalheConosco() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cargo: "",
    experiencia: "",
    mensagem: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simular envio do formulário
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Candidatura enviada com sucesso! Entraremos em contato em breve.");
      
      // Limpar formulário
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        cargo: "",
        experiencia: "",
        mensagem: ""
      });
    } catch (error) {
      toast.error("Erro ao enviar candidatura. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com gradiente azul */}
      <div className="bg-gradient-to-r from-[#262d3d] to-[#3a4356] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-sans tracking-wider uppercase mb-4 opacity-90">
              LDC CAPITAL
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold">
              Trabalhe Conosco
            </h1>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
            Faça Parte da Nossa Equipe
          </h2>
          <p className="text-gray-600 font-sans leading-relaxed mb-4">
            Na LDC Capital, estamos sempre em busca de profissionais talentosos e comprometidos 
            com a excelência no mercado financeiro. Se você tem paixão por investimentos e deseja 
            fazer parte de uma equipe dinâmica e inovadora, queremos conhecê-lo!
          </p>
          <p className="text-gray-600 font-sans leading-relaxed">
            Preencha o formulário abaixo com suas informações e nos conte um pouco sobre sua 
            experiência e motivações. Analisaremos seu perfil e entraremos em contato caso 
            haja oportunidades compatíveis.
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="font-serif text-xl font-bold text-[#262d3d] mb-6">
            Formulário de Candidatura
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Nome Completo *
              </label>
              <input
                type="text"
                id="nome"
                required
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#98ab44] focus:border-transparent transition-colors"
                placeholder="Seu nome completo"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                E-mail *
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#98ab44] focus:border-transparent transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-1" />
                Telefone
              </label>
              <input
                type="tel"
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleInputChange("telefone", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#98ab44] focus:border-transparent transition-colors"
                placeholder="(11) 99999-9999"
              />
            </div>

            {/* Cargo de Interesse */}
            <div>
              <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="inline h-4 w-4 mr-1" />
                Cargo de Interesse *
              </label>
              <select
                id="cargo"
                required
                value={formData.cargo}
                onChange={(e) => handleInputChange("cargo", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#98ab44] focus:border-transparent transition-colors"
              >
                <option value="">Selecione uma opção</option>
                <option value="consultor-investimentos">Consultor de Investimentos</option>
                <option value="analista-financeiro">Analista Financeiro</option>
                <option value="gerente-relacionamento">Gerente de Relacionamento</option>
                <option value="assistente-comercial">Assistente Comercial</option>
                <option value="estagio">Estágio</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            {/* Experiência */}
            <div>
              <label htmlFor="experiencia" className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Experiência Profissional *
              </label>
              <textarea
                id="experiencia"
                required
                rows={4}
                value={formData.experiencia}
                onChange={(e) => handleInputChange("experiencia", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#98ab44] focus:border-transparent transition-colors resize-none"
                placeholder="Descreva sua experiência profissional, formação acadêmica e certificações relevantes..."
              />
            </div>

            {/* Mensagem */}
            <div>
              <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Mensagem
              </label>
              <textarea
                id="mensagem"
                rows={4}
                value={formData.mensagem}
                onChange={(e) => handleInputChange("mensagem", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#98ab44] focus:border-transparent transition-colors resize-none"
                placeholder="Conte-nos um pouco sobre suas motivações e por que gostaria de trabalhar na LDC Capital..."
              />
            </div>

            {/* Botão de Envio */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center bg-[#98ab44] hover:bg-[#262d3d] disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-sans font-medium transition-colors disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Candidatura
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-serif text-lg font-semibold text-[#262d3d] mb-3">
            Processo Seletivo
          </h3>
          <div className="text-gray-600 font-sans text-sm leading-relaxed space-y-2">
            <p>• Análise de currículo e perfil profissional</p>
            <p>• Entrevista inicial por videoconferência</p>
            <p>• Avaliação técnica (quando aplicável)</p>
            <p>• Entrevista final com a equipe</p>
            <p>• Feedback em até 15 dias úteis</p>
          </div>
        </div>

        {/* Benefícios */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-8">
          <h3 className="font-serif text-xl font-bold text-[#262d3d] mb-4">
            Por que Trabalhar na LDC Capital?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-serif font-semibold text-[#262d3d] mb-2">Desenvolvimento Profissional</h4>
              <ul className="text-gray-600 font-sans text-sm space-y-1">
                <li>• Treinamentos especializados</li>
                <li>• Certificações do mercado financeiro</li>
                <li>• Plano de carreira estruturado</li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif font-semibold text-[#262d3d] mb-2">Ambiente de Trabalho</h4>
              <ul className="text-gray-600 font-sans text-sm space-y-1">
                <li>• Equipe colaborativa e experiente</li>
                <li>• Flexibilidade de horários</li>
                <li>• Cultura de inovação</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/contato"
            className="inline-flex items-center justify-center border-2 border-[#98ab44] text-[#98ab44] hover:bg-[#98ab44] hover:text-white px-8 py-3 rounded-lg font-sans font-medium transition-colors"
          >
            Outros Contatos
          </Link>
          <Link 
            href="/consultoria"
            className="inline-flex items-center justify-center bg-[#98ab44] hover:bg-[#262d3d] text-white px-8 py-3 rounded-lg font-sans font-medium transition-colors"
          >
            Conheça Nossos Serviços
          </Link>
        </div>
      </div>
    </div>
  );
}










