import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso | LDC Capital",
  description: "Termos de uso e condições de utilização do site da LDC Capital",
};

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold text-[#262d3d] mb-8">
          Termos de Uso
        </h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600">
            Esta página está em construção. Em breve, disponibilizaremos nossos termos de uso completos.
          </p>
        </div>
      </div>
    </div>
  );
}
