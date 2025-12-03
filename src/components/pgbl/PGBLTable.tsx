"use client";

import { formatCurrency } from "@/lib/pgbl/calculations";
import type { ProjecaoAnual } from "@/lib/pgbl/calculations";

interface PGBLTableProps {
  data: ProjecaoAnual[];
}

export default function PGBLTable({ data }: PGBLTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b-2 border-[#e3e3e3]">
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#577171] uppercase tracking-wide font-sans">
              Ano
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[#577171] uppercase tracking-wide font-sans">
              Aporte
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[#577171] uppercase tracking-wide font-sans">
              Rentabilidade
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[#577171] uppercase tracking-wide font-sans">
              Saldo Bruto
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[#577171] uppercase tracking-wide font-sans">
              IR Resgate
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[#577171] uppercase tracking-wide font-sans">
              Saldo Líquido
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[#577171] uppercase tracking-wide font-sans">
              Benefício Fiscal
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[#577171] uppercase tracking-wide font-sans">
              Economia Acumulada
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={item.ano}
              className={`border-b border-[#e3e3e3] hover:bg-gray-50 transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
              }`}
            >
              <td className="px-4 py-3 text-sm font-medium text-[#262d3d] font-sans">
                {item.ano}
              </td>
              <td className="px-4 py-3 text-sm text-right text-[#262d3d] font-sans">
                {formatCurrency(item.aporte)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-[#262d3d] font-sans">
                {formatCurrency(item.rentabilidade)}
              </td>
              <td className="px-4 py-3 text-sm text-right font-semibold text-[#262d3d] font-sans">
                {formatCurrency(item.saldoBruto)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-[#dc2626] font-sans">
                {formatCurrency(item.irResgate)}
              </td>
              <td className="px-4 py-3 text-sm text-right font-semibold text-[#98ab44] font-sans">
                {formatCurrency(item.saldoLiquido)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-[#98ab44] font-sans">
                {formatCurrency(item.beneficioFiscal)}
              </td>
              <td className="px-4 py-3 text-sm text-right font-medium text-[#98ab44] font-sans">
                {formatCurrency(item.economiaFiscalAcumulada)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

