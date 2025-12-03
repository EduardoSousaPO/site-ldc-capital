"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AdminLayout from "../../../../components/AdminLayout";
import ScenarioWizard from "@/components/wealth-planning/ScenarioWizard";
import type { ScenarioData } from "@/types/wealth-planning";

export default function EditScenarioPage() {
  const params = useParams();
  const router = useRouter();
  const scenarioId = params.id as string;
  const [scenario, setScenario] = useState<{ id: string; title: string; clientId: string; personalData: unknown; financialData: unknown; portfolio: unknown; assets: unknown; projects: unknown; debts: unknown; otherRevenues: unknown; assumptions: unknown } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScenario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  const fetchScenario = async () => {
    try {
      const response = await fetch(`/api/admin/wealth-planning/scenarios/${scenarioId}`);
      if (response.ok) {
        const data = await response.json();
        setScenario(data);
      } else {
        alert("Cenário não encontrado");
        router.push("/admin/wealth-planning");
      }
    } catch (error) {
      console.error("Erro ao carregar cenário:", error);
      alert("Erro ao carregar cenário");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: ScenarioData, title: string) => {
    try {
      const response = await fetch(`/api/admin/wealth-planning/scenarios/${scenarioId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          ...data,
        }),
      });

      if (response.ok) {
        router.push(`/admin/wealth-planning/scenarios/${scenarioId}/results`);
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao atualizar cenário");
      }
    } catch (error) {
      console.error("Erro ao atualizar cenário:", error);
      alert("Erro ao atualizar cenário");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#262d3d]/30 border-t-[#262d3d] rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!scenario) {
    return null;
  }

  const initialData: ScenarioData = {
    personalData: scenario.personalData,
    financialData: scenario.financialData,
    portfolio: scenario.portfolio,
    assets: scenario.assets,
    projects: scenario.projects,
    debts: scenario.debts,
    otherRevenues: scenario.otherRevenues,
    assumptions: scenario.assumptions,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/admin/wealth-planning/scenarios/${scenarioId}/results`}>
            <Button variant="outline" size="sm" className="font-sans">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#262d3d] mb-2">
              Editar Cenário: {scenario.title}
            </h1>
            <p className="text-gray-600 font-sans">
              Atualize os dados do estudo de planejamento financeiro
            </p>
          </div>
        </div>

        <ScenarioWizard
          initialData={initialData}
          initialClientId={scenario.clientId}
          initialTitle={scenario.title}
          onSave={handleSave}
        />
      </div>
    </AdminLayout>
  );
}

