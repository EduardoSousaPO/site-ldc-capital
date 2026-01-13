import Link from 'next/link';
import Image from 'next/image';
import { Youtube, Instagram, Linkedin } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="bg-[#262d3d] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo - Tamanho maior */}
          <Link href="/" className="-ml-4 sm:-ml-6">
            <div className="relative w-[280px] sm:w-[340px] lg:w-[400px] h-[100px] sm:h-[120px] lg:h-[140px]">
              <Image
                src="/images/LDC Capital - Logo Final_Aplicação Branca + Colorida.png"
                alt="LDC Capital"
                fill
                className="object-contain object-left"
              />
            </div>
          </Link>

          {/* Redes Sociais */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.youtube.com/@luciano.herzog"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#98ab44] transition-colors"
              title="YouTube"
            >
              <Youtube className="h-6 w-6" />
            </a>
            <a
              href="https://www.instagram.com/ldc.capital/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#98ab44] transition-colors"
              title="Instagram"
            >
              <Instagram className="h-6 w-6" />
            </a>
            <span className="text-gray-600" title="LinkedIn - Em breve">
              <Linkedin className="h-6 w-6" />
            </span>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-gray-500 text-xs font-sans">
            © {new Date().getFullYear()} LDC Capital. Todos os direitos reservados.
          </p>
          <p className="text-gray-600 text-[10px] mt-2 font-sans max-w-2xl mx-auto">
            Este material é de caráter meramente informativo e não constitui oferta ou solicitação de investimento.
          </p>
        </div>
      </div>
    </footer>
  );
}
