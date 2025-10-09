import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Informações Regulatórias | LDC Capital",
  description: "Documentos regulatórios e políticas de compliance da LDC Capital",
};

export default function InformacoesRegulatorias({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}










