import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Termos de Uso | LDC Capital",
  description: "Termos de Uso da LDC Capital - Consultoria em Investimentos",
};

export default function TermosDeUso() {
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
              Termos de Uso
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
          <p className="text-gray-600 font-sans leading-relaxed">
            Bem-vindo à LDC Capital! Ao utilizar nosso site e serviços, você concorda com os seguintes Termos de Uso. 
            Por favor, leia com atenção antes de continuar a navegação.
          </p>
        </div>

        {/* Seções dos Termos */}
        <div className="space-y-8">
          
          {/* 1. Aceitação dos Termos */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              1. Aceitação dos Termos
            </h2>
            <p className="text-gray-600 font-sans leading-relaxed">
              Ao acessar ou utilizar os serviços oferecidos pela LDC Capital, você concorda em cumprir e estar 
              legalmente vinculado a estes Termos de Uso. Caso não concorde com algum dos termos, recomendamos 
              que não utilize nosso site.
            </p>
          </section>

          {/* 2. Modificações nos Termos */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              2. Modificações nos Termos
            </h2>
            <p className="text-gray-600 font-sans leading-relaxed">
              A LDC Capital reserva-se o direito de alterar ou atualizar estes Termos de Uso a qualquer momento, 
              sem aviso prévio. É sua responsabilidade revisar esta página regularmente para estar ciente de 
              possíveis modificações. O uso contínuo do site após qualquer alteração constitui a aceitação das mudanças.
            </p>
          </section>

          {/* 3. Uso do Site */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              3. Uso do Site
            </h2>
            <p className="text-gray-600 font-sans leading-relaxed mb-4">
              Você concorda em utilizar o site da LDC Capital de maneira responsável e em conformidade com todas 
              as leis e regulamentos aplicáveis. É proibido:
            </p>
            <ul className="list-disc list-inside text-gray-600 font-sans space-y-2 ml-4">
              <li>Usar o site para fins ilegais ou não autorizados.</li>
              <li>Introduzir vírus, malwares ou qualquer outro código nocivo.</li>
              <li>Infringir os direitos de propriedade intelectual da LDC Capital ou de terceiros.</li>
              <li>Tentar obter acesso não autorizado a qualquer parte do site ou sistemas relacionados.</li>
            </ul>
          </section>

          {/* 4. Propriedade Intelectual */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              4. Propriedade Intelectual
            </h2>
            <p className="text-gray-600 font-sans leading-relaxed">
              Todo o conteúdo disponível no site da LDC Capital, incluindo textos, gráficos, logotipos, ícones, 
              imagens e vídeos, é de propriedade exclusiva da LDC Capital ou de seus licenciadores, protegido 
              por leis de direitos autorais e marcas registradas. Qualquer uso não autorizado pode resultar em ação judicial.
            </p>
          </section>

          {/* 5. Serviços de Consultoria */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              5. Serviços de Consultoria
            </h2>
            <p className="text-gray-600 font-sans leading-relaxed">
              Os serviços de consultoria em investimentos oferecidos pela LDC Capital são prestados por profissionais 
              qualificados e registrados nos órgãos competentes. As informações fornecidas têm caráter educativo e 
              não constituem recomendação de investimento. Rentabilidade passada não representa garantia de rentabilidade futura.
            </p>
          </section>

          {/* 6. Limitação de Responsabilidade */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              6. Limitação de Responsabilidade
            </h2>
            <p className="text-gray-600 font-sans leading-relaxed">
              A LDC Capital não se responsabiliza por quaisquer danos diretos, indiretos, incidentais ou consequentes 
              que possam resultar do uso ou da incapacidade de utilizar os serviços oferecidos em nosso site. 
              O uso dos serviços é feito por sua conta e risco.
            </p>
          </section>

          {/* 7. Links para Terceiros */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              7. Links para Terceiros
            </h2>
            <p className="text-gray-600 font-sans leading-relaxed">
              Nosso site pode conter links para sites de terceiros. Esses links são fornecidos apenas para conveniência, 
              e a LDC Capital não se responsabiliza pelo conteúdo ou pelas práticas desses sites. Ao acessar sites de 
              terceiros, você estará sujeito aos termos e políticas desses sites.
            </p>
          </section>

          {/* 8. Privacidade */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              8. Privacidade
            </h2>
            <p className="text-gray-600 font-sans leading-relaxed">
              Sua privacidade é importante para nós. Consulte nossa{" "}
              <Link href="/politica-privacidade" className="text-[#98ab44] hover:text-[#262d3d] underline">
                Política de Privacidade
              </Link>{" "}
              para entender como coletamos, utilizamos e protegemos suas informações pessoais.
            </p>
          </section>

          {/* 9. Rescisão */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              9. Rescisão
            </h2>
            <p className="text-gray-600 font-sans leading-relaxed">
              Reservamo-nos o direito de suspender ou encerrar o seu acesso ao site a qualquer momento, sem aviso prévio, 
              caso viole estes Termos de Uso ou se engaje em atividades consideradas inadequadas pela LDC Capital.
            </p>
          </section>

          {/* 10. Legislação Aplicável */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              10. Legislação Aplicável
            </h2>
            <p className="text-gray-600 font-sans leading-relaxed">
              Estes Termos de Uso serão regidos e interpretados de acordo com as leis do Brasil. Qualquer disputa ou 
              controvérsia relacionada a estes Termos será resolvida nos tribunais competentes de Taquara, Rio Grande do Sul, Brasil.
            </p>
          </section>

          {/* 11. Informações Regulatórias */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              11. Informações Regulatórias
            </h2>
            <p className="text-gray-600 font-sans leading-relaxed mb-4">
              A LDC Capital é uma empresa devidamente registrada e autorizada para prestar serviços de consultoria 
              em investimentos:
            </p>
            <ul className="list-disc list-inside text-gray-600 font-sans space-y-2 ml-4">
              <li><strong>CNPJ:</strong> 58.321.323/0001-67</li>
              <li><strong>Registro CVM:</strong> Em processo de regularização</li>
              <li><strong>Endereço:</strong> Rua Rio Branco, 2393, sala 02, Centro - Taquara/RS - CEP 95600-074</li>
            </ul>
          </section>

          {/* 12. Contato */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              12. Contato
            </h2>
            <p className="text-gray-600 font-sans leading-relaxed">
              Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco através do e-mail{" "}
              <a href="mailto:contato@ldccapital.com.br" className="text-[#98ab44] hover:text-[#262d3d] underline">
                contato@ldccapital.com.br
              </a>{" "}
              ou através da nossa{" "}
              <Link href="/contato" className="text-[#98ab44] hover:text-[#262d3d] underline">
                página de contato
              </Link>.
            </p>
          </section>

        </div>

        {/* Data de atualização */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 font-sans">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Botão de ação */}
        <div className="mt-8 text-center">
          <Link 
            href="/contato"
            className="inline-flex items-center bg-[#98ab44] hover:bg-[#262d3d] text-white px-8 py-3 rounded-lg font-sans font-medium transition-colors"
          >
            Fale Conosco
          </Link>
        </div>
      </div>
    </div>
  );
}



