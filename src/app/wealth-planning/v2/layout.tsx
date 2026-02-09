import { Metadata } from "next";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Simulador IF v2 — LDC Capital",
  description: "Simulador de Independência Financeira — Modo Reunião",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WealthPlanningV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Header minimalista */}
        <header className="border-b border-[#e3e3e3] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-[#98ab44] font-serif tracking-wide">
                LDC Capital
              </span>
              <span className="text-xs text-[#577171] font-sans border-l border-[#e3e3e3] pl-3">
                Simulador IF v2
              </span>
            </div>
            <span className="text-xs text-[#577171] font-sans hidden sm:block">
              Modo Reunião
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="py-8 px-4">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
