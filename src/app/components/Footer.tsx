import Link from "next/link";
import Image from "next/image";
import { Youtube, Instagram, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#262d3d] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo - Lado Esquerdo */}
          <div className="lg:col-span-1 text-center lg:text-left">
            <div className="mb-4">
              <Image
                src="/images/LDC Capital - Logo Final_Aplicação Branca + Colorida.png"
                alt="LDC Capital"
                width={640}
                height={160}
                className="h-36 lg:h-44 xl:h-52 2xl:h-60 w-auto mx-auto lg:mx-0"
                priority
              />
            </div>
          </div>

          {/* Navegação - Links Legais */}
          <div className="mt-4">
            <h3 className="font-serif text-lg font-semibold mb-4 text-white">
              Navegação
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/termos-de-uso"
                  className="text-gray-300 hover:text-[#98ab44] transition-colors font-sans"
                >
                  Termos de uso
                </Link>
              </li>
              <li>
                <Link
                  href="/politica-privacidade"
                  className="text-gray-300 hover:text-[#98ab44] transition-colors font-sans"
                >
                  Política de privacidade
                </Link>
              </li>
              <li>
                <Link
                  href="/informacoes-regulatorias"
                  className="text-gray-300 hover:text-[#98ab44] transition-colors font-sans"
                >
                  Informações regulatórias
                </Link>
              </li>
              <li>
                <Link
                  href="/trabalhe-conosco"
                  className="text-gray-300 hover:text-[#98ab44] transition-colors font-sans"
                >
                  Trabalhe conosco
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Úteis - Páginas do Site */}
          <div className="mt-4">
            <h3 className="font-serif text-lg font-semibold mb-4 text-white">
              Links Úteis
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/consultoria"
                  className="text-gray-300 hover:text-[#98ab44] transition-colors font-sans"
                >
                  Consultoria
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-gray-300 hover:text-[#98ab44] transition-colors font-sans"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/materiais"
                  className="text-gray-300 hover:text-[#98ab44] transition-colors font-sans"
                >
                  Materiais
                </Link>
              </li>
            </ul>
          </div>

          {/* Redes Sociais e Contato */}
          <div className="mt-4">
            <h3 className="font-serif text-lg font-semibold mb-4 text-white">
              Redes
            </h3>
            <div className="flex space-x-6 justify-center lg:justify-start mb-6">
              <a
                href="https://www.youtube.com/@luciano.herzog"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-[#98ab44] transition-all duration-300 transform hover:scale-110"
                title="YouTube"
              >
                <Youtube className="h-10 w-10" />
              </a>
              <div className="text-gray-500 cursor-not-allowed transition-all duration-300 transform hover:scale-110" title="Instagram - Em breve">
                <Instagram className="h-10 w-10" />
              </div>
              <div className="text-gray-500 cursor-not-allowed transition-all duration-300 transform hover:scale-110" title="LinkedIn - Em breve">
                <Linkedin className="h-10 w-10" />
              </div>
            </div>
            
            {/* Email de contato */}
            <div className="text-center lg:text-left">
              <p className="text-sm text-gray-400 mb-1 font-sans">Email</p>
              <a 
                href="mailto:contato@ldccapital.com.br" 
                className="text-[#98ab44] hover:text-[#becc6a] transition-colors font-medium font-sans text-sm"
              >
                contato@ldccapital.com.br
              </a>
            </div>
          </div>
        </div>

      </div>
      
      {/* Linha de Separação */}
      <div className="max-w-7xl mx-auto">
        <div className="border-t border-white/10"></div>
      </div>
      
      {/* Seção de Informações Legais - Fundo Azul Escuro */}
      <div className="bg-[#262d3d] py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-white space-y-1 font-sans">
            <p className="text-[10px]">
              <strong>CNPJ:</strong> 58.321.323/0001-67 | 
              <strong> Registro CVM:</strong> 000000 (placeholder)
            </p>
            <p className="text-[10px]">
              <strong>Endereço:</strong> Rua Rio Branco, 2393, sal 02, Centro de Taquara-RS - CEP 95600-074
            </p>
            <p className="text-xs mt-3 font-sans">
              © {new Date().getFullYear()} LDC Capital. Todos os direitos reservados.
            </p>
            <p className="text-xs font-sans">
              Este material é de caráter meramente informativo e não constitui oferta ou solicitação de investimento.
              Rentabilidade passada não representa garantia de rentabilidade futura.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
