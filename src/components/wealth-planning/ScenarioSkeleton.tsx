export function ScenarioSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-[#e3e3e3] rounded-lg p-6"
          >
            <div className="h-3 bg-[#e3e3e3] rounded w-2/3 mb-3" />
            <div className="h-8 bg-[#e3e3e3] rounded w-full" />
          </div>
        ))}
      </div>

      {/* Termômetro */}
      <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
        <div className="h-4 bg-[#e3e3e3] rounded w-48 mb-4" />
        <div className="h-12 bg-[#e3e3e3] rounded w-full" />
      </div>

      {/* Gráfico */}
      <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
        <div className="h-4 bg-[#e3e3e3] rounded w-64 mb-6" />
        <div className="h-64 bg-[#e3e3e3] rounded w-full" />
      </div>

      {/* Tabela */}
      <div className="bg-white border border-[#e3e3e3] rounded-lg p-6">
        <div className="h-4 bg-[#e3e3e3] rounded w-56 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#e3e3e3] rounded w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

