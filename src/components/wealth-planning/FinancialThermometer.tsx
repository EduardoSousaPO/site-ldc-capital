"use client";

interface FinancialThermometerProps {
  value?: number; // 0-10 (opcional)
}

export default function FinancialThermometer({
  value,
}: FinancialThermometerProps) {
  // Garantir que value seja um número válido entre 0 e 10
  const safeValue = value !== undefined && !isNaN(value) ? Math.max(0, Math.min(10, value)) : 0;

  const getColor = () => {
    if (safeValue >= 10) return "bg-[#98ab44]"; // LDC Accent 1
    if (safeValue >= 7) return "bg-[#becc6a]"; // LDC Accent 2
    return "bg-[#262d3d]"; // LDC Primary (escuro para alerta)
  };

  const getLabel = () => {
    if (safeValue >= 10) return "Em linha para viver de renda";
    if (safeValue >= 7) return "Em linha para manter o padrão de vida desejado";
    return "Atenção, padrão de vida ameaçado";
  };

  const getDescription = () => {
    if (safeValue >= 10) {
      return "Seu capital projetado é suficiente para viver apenas dos rendimentos, sem consumir o principal.";
    }
    if (safeValue >= 7) {
      return "Seu capital projetado permite manter o padrão de vida desejado, mas pode ser necessário consumir parte do patrimônio.";
    }
    return "Seu capital projetado é insuficiente. Considere aumentar a poupança, adiar a aposentadoria ou ajustar suas expectativas.";
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Termômetro Financeiro</div>
      <div>
        <div className="space-y-4">
          <div className="relative">
            {/* Barra do termômetro */}
            <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${getColor()} transition-all duration-500 rounded-full flex items-center justify-end pr-2`}
                style={{ width: `${(safeValue / 10) * 100}%` }}
              >
                <span className="text-white font-bold text-sm">
                  {safeValue.toFixed(1)}
                </span>
              </div>
            </div>
            
            {/* Marcadores */}
            <div className="flex justify-between mt-2 text-xs text-gray-600 font-sans">
              <span>0</span>
              <span>7</span>
              <span>10</span>
            </div>
          </div>

          <div className="p-4 bg-[#e3e3e3]/30 rounded-lg border border-[#e3e3e3]">
            <div className="font-semibold text-lg mb-2 font-sans text-[#262d3d]">
              {getLabel()}
            </div>
            <p className="text-sm text-[#577171] font-sans">
              {getDescription()}
            </p>
          </div>

          {/* Legenda */}
          <div className="grid grid-cols-3 gap-2 text-xs font-sans">
            <div className="p-2 bg-[#98ab44]/10 rounded border border-[#98ab44]/30">
              <div className="font-semibold text-[#98ab44]">≥10</div>
              <div className="text-[#262d3d]">Em linha para viver de renda</div>
            </div>
            <div className="p-2 bg-[#becc6a]/10 rounded border border-[#becc6a]/30">
              <div className="font-semibold text-[#577171]">≥7</div>
              <div className="text-[#262d3d]">Em linha para manter padrão</div>
            </div>
            <div className="p-2 bg-[#262d3d]/10 rounded border border-[#262d3d]/30">
              <div className="font-semibold text-[#262d3d]">0</div>
              <div className="text-[#262d3d]">Atenção, padrão ameaçado</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

