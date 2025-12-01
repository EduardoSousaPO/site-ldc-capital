import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Informações Regulatórias | LDC Capital",
  description: "Documentos regulatórios e informações importantes sobre a LDC Capital",
};

export default function InformacoesRegulatoriasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
