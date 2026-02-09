"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Building2, CheckCircle2, XCircle, HelpCircle, ChevronRight } from "lucide-react";
import type { SuccessionItem } from "@/types/wealth-planning-v2";

interface SuccessionChecklistProps {
  items?: SuccessionItem[];
  onUpdate?: (items: SuccessionItem[]) => void;
  className?: string;
}

const DEFAULT_SUCCESSION_ITEMS: SuccessionItem[] = [
  {
    id: "testament",
    label: "Testamento",
    question: "Tem testamento atualizado?",
    answer: null,
    actionIfNo: "Providenciar testamento com advogado especializado em direito sucessório",
  },
  {
    id: "beneficiaries",
    label: "Beneficiários",
    question: "Beneficiários de seguros e previdência estão atualizados?",
    answer: null,
    actionIfNo: "Revisar e atualizar beneficiários junto à seguradora e plano de previdência",
  },
  {
    id: "life_insurance",
    label: "Seguro de Vida",
    question: "Tem seguro de vida adequado ao patrimônio e dependentes?",
    answer: null,
    actionIfNo: "Avaliar necessidade de seguro de vida com cobertura compatível com a proteção familiar",
  },
  {
    id: "inventory",
    label: "Inventário",
    question: "Já organizou um inventário patrimonial completo?",
    answer: null,
    actionIfNo: "Organizar inventário de todos os bens, investimentos e documentos importantes",
  },
  {
    id: "company",
    label: "Empresa",
    question: "Tem participação societária com acordo de sócios?",
    answer: null,
    actionIfNo: "Avaliar acordo de sócios, cláusulas de sucessão e governança corporativa",
    relevanceThreshold: 0, // Relevante se tiver empresa
  },
  {
    id: "holding",
    label: "Holding / Estrutura",
    question: "Patrimônio justifica estrutura de holding ou planejamento tributário?",
    answer: null,
    actionIfNo: "Consultar especialista para avaliar viabilidade de holding familiar ou planejamento tributário",
    relevanceThreshold: 5_000_000,
  },
];

export function SuccessionChecklist({
  items: initialItems,
  onUpdate,
  className,
}: SuccessionChecklistProps) {
  const [items, setItems] = useState<SuccessionItem[]>(
    initialItems || DEFAULT_SUCCESSION_ITEMS
  );

  const handleAnswer = (id: string, answer: boolean) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, answer } : item
    );
    setItems(updated);
    onUpdate?.(updated);
  };

  const answeredCount = items.filter((i) => i.answer !== null).length;
  const noCount = items.filter((i) => i.answer === false).length;
  const yesCount = items.filter((i) => i.answer === true).length;

  // Ações necessárias (itens respondidos com "Não")
  const pendingActions = items.filter((i) => i.answer === false);

  return (
    <div className={cn("space-y-5", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-[#262d3d]" />
        <h3 className="text-lg font-bold text-[#262d3d] font-sans">
          Planejamento Sucessório
        </h3>
        <span className="text-xs text-[#577171] font-sans">
          Checklist básico de sucessão
        </span>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 text-xs font-sans">
        <span className="flex items-center gap-1 text-[#577171]">
          {answeredCount}/{items.length} respondidas
        </span>
        {yesCount > 0 && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-3 w-3" /> {yesCount} ok
          </span>
        )}
        {noCount > 0 && (
          <span className="flex items-center gap-1 text-red-500">
            <XCircle className="h-3 w-3" /> {noCount} pendente{noCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "rounded-lg border-2 p-4 transition-all duration-200",
              item.answer === true
                ? "bg-green-50 border-green-200"
                : item.answer === false
                ? "bg-red-50 border-red-200"
                : "bg-white border-[#e3e3e3]"
            )}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="mt-0.5 flex-shrink-0">
                {item.answer === true ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : item.answer === false ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <HelpCircle className="h-5 w-5 text-[#e3e3e3]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-[#262d3d] font-sans text-sm">
                    {item.question}
                  </h4>
                </div>

                {/* Botões Sim/Não */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleAnswer(item.id, true)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold font-sans border transition-all",
                      item.answer === true
                        ? "bg-green-500 text-white border-green-500"
                        : "bg-white text-[#577171] border-[#e3e3e3] hover:border-green-300 hover:text-green-600"
                    )}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAnswer(item.id, false)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold font-sans border transition-all",
                      item.answer === false
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-white text-[#577171] border-[#e3e3e3] hover:border-red-300 hover:text-red-600"
                    )}
                  >
                    Não
                  </button>
                </div>

                {/* Ação sugerida quando "Não" */}
                {item.answer === false && (
                  <div className="mt-3 flex items-start gap-2 bg-red-100/50 rounded-lg p-3">
                    <ChevronRight className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 font-sans">
                      <span className="font-semibold">Ação:</span> {item.actionIfNo}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumo de ações pendentes */}
      {pendingActions.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
          <h4 className="font-semibold text-orange-700 font-sans text-sm mb-2">
            📋 Próximas ações de sucessão ({pendingActions.length})
          </h4>
          <ol className="space-y-1.5">
            {pendingActions.map((action, idx) => (
              <li key={action.id} className="text-xs text-orange-700 font-sans flex items-start gap-2">
                <span className="font-bold">{idx + 1}.</span>
                <span>{action.actionIfNo}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
