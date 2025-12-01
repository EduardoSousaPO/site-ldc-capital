import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trabalhe Conosco | LDC Capital",
  description: "Venha fazer parte da equipe LDC Capital",
};

export default function TrabalheConoscoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
