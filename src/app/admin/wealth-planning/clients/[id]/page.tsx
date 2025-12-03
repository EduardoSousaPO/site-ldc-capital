"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Plus, TrendingUp, Calendar, Trash2 } from "lucide-react";
import AdminLayout from "../../../components/AdminLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  scenarios: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteScenarioId, setDeleteScenarioId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/admin/wealth-planning/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data);
      } else {
        alert("Cliente não encontrado");
        router.push("/admin/wealth-planning");
      }
    } catch (error) {
      console.error("Erro ao carregar cliente:", error);
      alert("Erro ao carregar cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (scenarioId: string) => {
    setDeleteScenarioId(scenarioId);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteScenarioId) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(
        `/api/admin/wealth-planning/scenarios/${deleteScenarioId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setDeleteDialogOpen(false);
        setDeleteScenarioId(null);
        await fetchClient();
      } else {
        const errorData = await response.json();
        setDeleteError(errorData.error || "Erro ao excluir cenário");
      }
    } catch (error) {
      console.error("Erro ao excluir cenário:", error);
      setDeleteError("Erro ao excluir cenário. Tente novamente.");
    } finally {
      setIsDeleting(false);
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

  if (!client) {
    return null;
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
          <div className="flex-1">
            <h1 className="font-serif text-3xl font-bold text-[#262d3d] mb-2">
              {client.name}
            </h1>
            <p className="text-gray-600 font-sans">
              Cliente cadastrado em {new Date(client.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <Link href={`/admin/wealth-planning/clients/${clientId}/edit`}>
            <Button className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl text-[#262d3d]">
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 font-sans">
              {client.email && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-[#262d3d]">{client.email}</p>
                </div>
              )}
              {client.phone && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Telefone</p>
                  <p className="text-[#262d3d]">{client.phone}</p>
                </div>
              )}
              {client.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Observações</p>
                  <p className="text-[#262d3d] whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl text-[#262d3d]">
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 font-sans">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Cenários</p>
                <p className="text-2xl font-bold text-[#98ab44]">{client.scenarios.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Cenários Publicados</p>
                <p className="text-2xl font-bold text-[#262d3d]">
                  {client.scenarios.filter((s) => s.status === "published").length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cenários */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-xl text-[#262d3d]">
                Cenários de Wealth Planning
              </CardTitle>
              <Link href={`/admin/wealth-planning/scenarios/new?clientId=${clientId}`}>
                <Button className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cenário
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {client.scenarios.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-sans mb-4">
                  Nenhum cenário criado para este cliente
                </p>
                <Link href={`/admin/wealth-planning/scenarios/new?clientId=${clientId}`}>
                  <Button className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Cenário
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {client.scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#262d3d] font-sans mb-1">
                        {scenario.title}
                      </h3>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={scenario.status === "published" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {scenario.status === "published" ? "Publicado" : "Rascunho"}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500 font-sans">
                          <Calendar className="h-3 w-3" />
                          {new Date(scenario.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/wealth-planning/scenarios/${scenario.id}/results`}>
                        <Button variant="outline" size="sm" className="font-sans">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Ver Resultados
                        </Button>
                      </Link>
                      <Link href={`/admin/wealth-planning/scenarios/${scenario.id}/edit`}>
                        <Button variant="outline" size="sm" className="font-sans">
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 font-sans"
                        onClick={() => handleDeleteClick(scenario.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteError ? (
                  <span className="text-red-600 font-semibold">{deleteError}</span>
                ) : (
                  "Tem certeza que deseja excluir este cenário? Esta ação não pode ser desfeita."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              {!deleteError && (
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              )}
              {deleteError && (
                <AlertDialogAction onClick={() => setDeleteDialogOpen(false)}>
                  OK
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

