import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidade | LDC Capital",
  description: "Política de Privacidade da LDC Capital - Consultoria em Investimentos",
};

export default function PoliticaPrivacidade() {
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
              Política de Privacidade
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
            Na LDC Capital Consultoria de Investimentos, adotamos o compromisso de respeitar e proteger os dados 
            pessoais de todos os visitantes e usuários que acessam nosso site ou utilizam nossos serviços.
          </p>
        </div>

        {/* Seções da Política */}
        <div className="space-y-8">
          
          {/* 1. Coleta e uso de informações */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              Coleta e uso de informações
            </h2>
            <div className="text-gray-600 font-sans leading-relaxed space-y-4">
              <p>
                Solicitamos informações pessoais apenas quando são realmente necessárias para oferecer nossos 
                serviços de forma adequada. Sempre que houver coleta de dados, ela será feita de maneira transparente, 
                legal e com o seu consentimento. Também informamos a finalidade dessa coleta e como os dados serão utilizados.
              </p>
              <p>
                As informações fornecidas são utilizadas exclusivamente para o cumprimento de obrigações legais, 
                regulamentares ou para garantir a melhor experiência na utilização de nossos serviços.
              </p>
            </div>
          </section>

          {/* 2. Armazenamento e proteção de dados */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              Armazenamento e proteção de dados
            </h2>
            <div className="text-gray-600 font-sans leading-relaxed space-y-4">
              <p>
                Mantemos as informações pessoais apenas pelo tempo necessário para atender às finalidades propostas. 
                Adotamos medidas técnicas e organizacionais de segurança para proteger os dados contra acessos não 
                autorizados, uso indevido, alteração, divulgação ou destruição.
              </p>
              <p>
                Não compartilhamos informações pessoais de identificação com terceiros, exceto quando houver 
                obrigação legal ou regulatória.
              </p>
            </div>
          </section>

          {/* 3. Links externos */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              Links externos
            </h2>
            <p className="text-gray-600 font-sans leading-relaxed">
              Nosso site pode conter links para páginas de terceiros que não são operados pela LDC Capital. 
              Ressaltamos que não temos controle sobre o conteúdo ou políticas desses sites e não nos responsabilizamos 
              pelas práticas de privacidade adotadas por eles.
            </p>
          </section>

          {/* 4. Direitos do usuário */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              Direitos do usuário
            </h2>
            <div className="text-gray-600 font-sans leading-relaxed space-y-4">
              <p>
                Você tem o direito de recusar o fornecimento de dados pessoais, entendendo que, em alguns casos, 
                essa recusa poderá limitar o acesso a determinados serviços.
              </p>
              <p>
                O uso continuado de nosso site será considerado como aceitação desta Política de Privacidade.
              </p>
            </div>
          </section>

          {/* 5. Compromisso do Usuário */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              Compromisso do Usuário
            </h2>
            <p className="text-gray-600 font-sans leading-relaxed mb-4">
              O usuário se compromete a utilizar corretamente os conteúdos e serviços disponibilizados pela 
              LDC Capital, abstendo-se de:
            </p>
            <ol className="list-decimal list-inside text-gray-600 font-sans space-y-2 ml-4">
              <li>Praticar atividades ilícitas ou contrárias à boa fé e à ordem pública;</li>
              <li>Divulgar conteúdos de caráter discriminatório, ofensivo, ilegal ou que atentem contra direitos humanos;</li>
              <li>Causar danos a sistemas físicos (hardware) ou lógicos (software) da LDC Capital, de fornecedores 
                  ou terceiros, inclusive pela disseminação de vírus ou códigos maliciosos.</li>
            </ol>
          </section>

          {/* 6. Cookies e outras tecnologias */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              Cookies e outras tecnologias
            </h2>
            <p className="text-gray-600 font-sans leading-relaxed">
              Nosso site pode utilizar cookies e tecnologias semelhantes para melhorar sua experiência de navegação. 
              Você pode, a qualquer momento, configurar seu navegador para recusar cookies, embora isso possa 
              impactar algumas funcionalidades do site.
            </p>
          </section>

          {/* 7. Contato */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              Contato
            </h2>
            <p className="text-gray-600 font-sans leading-relaxed">
              Se tiver dúvidas sobre esta Política de Privacidade ou sobre a forma como tratamos seus dados pessoais, 
              entre em contato conosco pelo e-mail:{" "}
              <a href="mailto:contato@ldccapital.com.br" className="text-[#98ab44] hover:text-[#262d3d] underline">
                contato@ldccapital.com.br
              </a>.
            </p>
          </section>

          {/* 8. Vigência */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-serif text-2xl font-bold text-[#262d3d] mb-4">
              Vigência
            </h2>
            <p className="text-gray-600 font-sans leading-relaxed">
              Esta Política de Privacidade entra em vigor a partir de janeiro de 2026.
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

        {/* Botões de ação */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/contato"
            className="inline-flex items-center justify-center bg-[#98ab44] hover:bg-[#262d3d] text-white px-8 py-3 rounded-lg font-sans font-medium transition-colors"
          >
            Fale Conosco
          </Link>
          <Link 
            href="/termos-de-uso"
            className="inline-flex items-center justify-center border-2 border-[#98ab44] text-[#98ab44] hover:bg-[#98ab44] hover:text-white px-8 py-3 rounded-lg font-sans font-medium transition-colors"
          >
            Ver Termos de Uso
          </Link>
        </div>
      </div>
    </div>
  );
}























