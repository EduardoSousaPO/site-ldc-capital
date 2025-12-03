import { Metadata } from "next";
import { ToastProvider } from "@/components/ui/toast";
import SupabaseListener from "@/components/SupabaseListener";

export const metadata: Metadata = {
  title: "Simulador PGBL - LDC Capital",
  description: "Simulador de Plano Gerador de Benefício Livre",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PGBLLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <SupabaseListener />
      {children}
    </ToastProvider>
  );
}

