import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trabalhe Conosco | LDC Capital",
  description: "Faça parte da equipe LDC Capital. Oportunidades de carreira em consultoria de investimentos.",
};

export default function TrabalheConoscoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}








