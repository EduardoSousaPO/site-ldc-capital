"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ListChecks, ArrowUpCircle, Shield, Building, Wallet, Bookmark } from "lucide-react";
import type { ActionItem } from "@/types/wealth-planning-v2";

interface ActionPlanProps {
  actions: ActionItem[];
  onToggle?: (id: string) => void;
  className?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  investment: <ArrowUpCircle className="h-4 w-4" />,
  protection: <Shield className="h-4 w-4" />,
  succession: <Building className="h-4 w-4" />,
  debt: <Wallet className="h-4 w-4" />,
  general: <Bookmark className="h-4 w-4" />,
};

const categoryLabels: Record<string, string> = {
  investment: "Investimento",
  protection: "Proteção",
  succession: "Sucessão",
  debt: "Dívidas",
  general: "Geral",
};

const priorityColors: Record<string, string> = {
  high: "text-red-600 bg-red-50 border-red-200",
  medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
  low: "text-green-600 bg-green-50 border-green-200",
};

const priorityLabels: Record<string, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

export function ActionPlan({ actions: initialActions, onToggle, className }: ActionPlanProps) {
  const [actions, setActions] = useState(initialActions);

  const handleToggle = (id: string) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a))
    );
    onToggle?.(id);
  };

  const completedCount = actions.filter((a) => a.completed).length;
  const totalCount = actions.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Ordenar: high → medium → low, não completados primeiro
  const sorted = [...actions].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-[#262d3d]" />
          <h3 className="text-lg font-bold text-[#262d3d] font-sans">
            Plano de Ação
          </h3>
        </div>
        <span className="text-sm text-[#577171] font-sans">
          {completedCount}/{totalCount} concluídas
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[#e3e3e3] rounded-full h-2">
        <div
          className="bg-[#98ab44] h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Items */}
      <div className="space-y-3">
        {sorted.map((action) => (
          <div
            key={action.id}
            className={cn(
              "rounded-lg border-2 p-4 transition-all duration-200 cursor-pointer",
              action.completed
                ? "bg-gray-50 border-gray-200 opacity-60"
                : "bg-white border-[#e3e3e3] hover:border-[#98ab44]/50"
            )}
            onClick={() => handleToggle(action.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleToggle(action.id);
              }
            }}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <div className="mt-0.5 flex-shrink-0">
                {action.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-[#98ab44]" />
                ) : (
                  <Circle className="h-5 w-5 text-[#e3e3e3]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4
                    className={cn(
                      "font-semibold font-sans text-sm",
                      action.completed ? "line-through text-gray-400" : "text-[#262d3d]"
                    )}
                  >
                    {action.title}
                  </h4>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-semibold font-sans border",
                      priorityColors[action.priority]
                    )}
                  >
                    {priorityLabels[action.priority]}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-[#577171] font-sans">
                    {categoryIcons[action.category]}
                    {categoryLabels[action.category]}
                  </span>
                </div>
                <p className={cn(
                  "text-xs font-sans",
                  action.completed ? "text-gray-400" : "text-[#577171]"
                )}>
                  {action.description}
                </p>
                {action.impact && !action.completed && (
                  <p className="text-xs text-[#98ab44] font-sans font-medium mt-1">
                    ↳ {action.impact}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
