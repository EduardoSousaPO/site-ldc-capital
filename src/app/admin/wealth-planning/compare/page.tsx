"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, TrendingUp } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import ScenarioComparisonView from "@/components/wealth-planning/ScenarioComparisonView";

interface Scenario {
  id: string;
  title: string;
  client: {
    id: string;
    name: string;
  };
  status: string;
  createdAt: string;
}

export default function CompareScenariosPage() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await fetch("/api/admin/wealth-planning/scenarios");
      if (response.ok) {
        const data = await response.json();
        setScenarios(data);
      }
    } catch (error) {
      console.error("Erro ao carregar cenários:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleScenario = (scenarioId: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(scenarioId)
        ? prev.filter((id) => id !== scenarioId)
        : [...prev, scenarioId]
    );
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/wealth-planning">
            <Button variant="outline" size="sm" className="font-sans">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#262d3d] mb-2">
              Comparar Cenários
            </h1>
            <p className="text-gray-600 font-sans">
              Selecione até 3 cenários para comparar
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Seleção de Cenários */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl text-[#262d3d]">
                Selecionar Cenários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {scenarios.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 font-sans">
                    Nenhum cenário disponível
                  </p>
                ) : (
                  scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        id={scenario.id}
                        checked={selectedScenarios.includes(scenario.id)}
                        onCheckedChange={() => toggleScenario(scenario.id)}
                        disabled={
                          !selectedScenarios.includes(scenario.id) &&
                          selectedScenarios.length >= 3
                        }
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={scenario.id}
                          className="font-semibold text-[#262d3d] cursor-pointer font-sans"
                        >
                          {scenario.title}
                        </Label>
                        <p className="text-sm text-gray-600 font-sans">
                          Cliente: {scenario.client.name}
                        </p>
                        <p className="text-xs text-gray-500 font-sans">
                          {new Date(scenario.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {selectedScenarios.length > 0 && (
                <div className="mt-4 p-3 bg-[#98ab44]/10 rounded-lg">
                  <p className="text-sm font-sans">
                    <strong>{selectedScenarios.length}</strong> cenário(s) selecionado(s)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visualização da Comparação */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl text-[#262d3d]">
                Comparação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedScenarios.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-sans">
                    Selecione pelo menos um cenário para comparar
                  </p>
                </div>
              ) : (
                <ScenarioComparisonView scenarioIds={selectedScenarios} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

