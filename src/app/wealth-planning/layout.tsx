import { Metadata } from "next";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Wealth Planning — LDC Capital",
  description: "Simulador de Independência Financeira para consultores LDC Capital",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WealthPlanningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
