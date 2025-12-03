import { Metadata } from "next";
import { ToastProvider } from "@/components/ui/toast";
import SupabaseListener from "@/components/SupabaseListener";

export const metadata: Metadata = {
  title: "Wealth Planning - LDC Capital",
  description: "Ferramenta de planejamento financeiro para consultores LDC Capital",
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
      <SupabaseListener />
      {children}
    </ToastProvider>
  );
}

