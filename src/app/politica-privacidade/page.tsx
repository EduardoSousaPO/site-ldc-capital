import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | LDC Capital",
  description: "Política de privacidade e proteção de dados da LDC Capital",
};

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold text-[#262d3d] mb-8">
          Política de Privacidade
        </h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600">
            Esta página está em construção. Em breve, disponibilizaremos nossa política de privacidade completa.
          </p>
        </div>
      </div>
    </div>
  );
}
