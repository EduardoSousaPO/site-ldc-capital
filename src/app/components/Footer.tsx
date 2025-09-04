import Link from "next/link";
import Image from "next/image";
import { Youtube, Instagram, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#262d3d] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Demais Informações */}
          <div>
            <h3 className="font-serif text-lg font-semibold mb-4 text-white">
              Demais Informações
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/trabalhe-conosco"
                  className="text-gray-300 hover:text-[#98ab44] transition-colors"
                >
                  Trabalhe Conosco
                </Link>
              </li>
              <li>
                <Link
                  href="/compliance"
                  className="text-gray-300 hover:text-[#98ab44] transition-colors"
                >
                  Compliance
                </Link>
              </li>
              <li>
                <Link
                  href="/politica-privacidade"
                  className="text-gray-300 hover:text-[#98ab44] transition-colors"
                >
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Demais Páginas */}
          <div>
            <h3 className="font-serif text-lg font-semibold mb-4 text-white">
              Demais Páginas
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-gray-300 hover:text-[#98ab44] transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/consultoria"
                  className="text-gray-300 hover:text-[#98ab44] transition-colors"
                >
                  Consultoria
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-gray-300 hover:text-[#98ab44] transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/materiais"
                  className="text-gray-300 hover:text-[#98ab44] transition-colors"
                >
                  Materiais
                </Link>
              </li>
              <li>
                <Link
                  href="/contato"
                  className="text-gray-300 hover:text-[#98ab44] transition-colors"
                >
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Redes Sociais */}
          <div>
            <h3 className="font-serif text-lg font-semibold mb-4 text-white">
              Redes Sociais
            </h3>
            <div className="flex space-x-4 mb-6">
              <a
                href="https://www.youtube.com/@luciano.herzog"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-[#98ab44] transition-colors"
                title="YouTube"
              >
                <Youtube className="h-6 w-6" />
              </a>
              <div className="text-gray-500 cursor-not-allowed" title="Instagram - Em breve">
                <Instagram className="h-6 w-6" />
              </div>
              <div className="text-gray-500 cursor-not-allowed" title="LinkedIn - Em breve">
                <Linkedin className="h-6 w-6" />
              </div>
              <a
                href="mailto:contato@ldccapital.com.br"
                className="text-gray-300 hover:text-[#98ab44] transition-colors"
                title="E-mail"
              >
                <Mail className="h-6 w-6" />
              </a>
            </div>

            {/* Logo */}
            <div className="mb-4">
              <Image
                src="/images/logo-ldc-branca.png"
                alt="LDC Capital"
                width={280}
                height={70}
                className="h-16 w-auto"
                priority
              />
            </div>
            <p className="text-sm text-gray-400 italic">
              &ldquo;Mais do que finanças, direção.&rdquo;
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="text-sm text-gray-400 space-y-2">
            <p>
              <strong>CNPJ:</strong> 00.000.000/0001-00 (placeholder)
            </p>
            <p>
              <strong>Registro CVM:</strong> 000000 (placeholder)
            </p>
            <p>
              <strong>Endereço:</strong> Rua Exemplo, 123 - Bairro - Cidade/UF - CEP 00000-000
            </p>
            <p className="text-xs mt-4">
              © {new Date().getFullYear()} LDC Capital. Todos os direitos reservados.
            </p>
            <p className="text-xs">
              Este material é de caráter meramente informativo e não constitui oferta ou solicitação de investimento.
              Rentabilidade passada não representa garantia de rentabilidade futura.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
