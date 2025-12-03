"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AdminLayout from "../../../components/AdminLayout";
import ScenarioWizard from "@/components/wealth-planning/ScenarioWizard";
import type { ScenarioData } from "@/types/wealth-planning";

export default function NewScenarioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");

  const handleSave = async (data: ScenarioData, title: string) => {
    try {
      const response = await fetch("/api/admin/wealth-planning/scenarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          clientId: clientId || "",
          status: "draft",
          ...data,
        }),
      });

      if (response.ok) {
        const scenario = await response.json();
        router.push(`/admin/wealth-planning/scenarios/${scenario.id}/results`);
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao criar cenário");
      }
    } catch (error) {
      console.error("Erro ao criar cenário:", error);
      alert("Erro ao criar cenário");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={clientId ? `/admin/wealth-planning/clients/${clientId}` : "/admin/wealth-planning"}>
            <Button variant="outline" size="sm" className="font-sans">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#262d3d] mb-2">
              Novo Cenário de Wealth Planning
            </h1>
            <p className="text-gray-600 font-sans">
              Preencha os dados para criar um novo estudo de planejamento financeiro
            </p>
          </div>
        </div>

        <ScenarioWizard
          initialClientId={clientId || undefined}
          onSave={handleSave}
        />
      </div>
    </AdminLayout>
  );
}

