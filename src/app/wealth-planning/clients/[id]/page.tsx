"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Plus, FileText, Trash2 } from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useToast } from "@/components/ui/toast";
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
  const { showToast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteScenarioId, setDeleteScenarioId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const clientId = params.id as string;

  const fetchClient = async () => {
    try {
      const response = await fetch(
        `/api/admin/wealth-planning/clients/${clientId}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setClient(data);
      } else {
        if (response.status === 401) {
          router.push("/wealth-planning");
          return;
        }
        showToast("Erro ao carregar cliente", "error");
        router.push("/wealth-planning/dashboard");
      }
    } catch (error) {
      console.error("Erro ao carregar cliente:", error);
      showToast("Erro ao carregar cliente", "error");
      router.push("/wealth-planning/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClient();
    }
  }, [clientId, router, showToast]);

  const handleDeleteClick = (scenarioId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setDeleteDialogOpen(false);
        setDeleteScenarioId(null);
        showToast("Cenário excluído com sucesso", "success");
        await fetchClient();
      } else {
        const errorData = await response.json();
        setDeleteError(errorData.error || "Erro ao excluir cenário");
        showToast("Erro ao excluir cenário", "error");
      }
    } catch (error) {
      console.error("Erro ao excluir cenário:", error);
      setDeleteError("Erro ao excluir cenário. Tente novamente.");
      showToast("Erro ao excluir cenário", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-[#262d3d]/30 border-t-[#262d3d] rounded-full animate-spin"></div>
        </main>
        <Footer />
      </>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-6">
            <Link href="/wealth-planning/dashboard">
              <Button variant="ghost" className="font-sans">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informações do Cliente */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-xl text-[#262d3d]">
                    {client.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {client.email && (
                    <div>
                      <p className="text-sm text-gray-600 font-sans mb-1">
                        Email
                      </p>
                      <p className="font-sans">{client.email}</p>
                    </div>
                  )}
                  {client.phone && (
                    <div>
                      <p className="text-sm text-gray-600 font-sans mb-1">
                        Telefone
                      </p>
                      <p className="font-sans">{client.phone}</p>
                    </div>
                  )}
                  {client.notes && (
                    <div>
                      <p className="text-sm text-gray-600 font-sans mb-1">
                        Observações
                      </p>
                      <p className="font-sans text-sm">{client.notes}</p>
                    </div>
                  )}
                  <Link href={`/wealth-planning/clients/${client.id}/edit`}>
                    <Button variant="outline" className="w-full font-sans">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Cliente
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Cenários */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle className="font-serif text-xl text-[#262d3d]">
                    Cenários ({client.scenarios.length})
                  </CardTitle>
                  <Link href={`/wealth-planning/scenarios/new?clientId=${client.id}`}>
                    <Button className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Cenário
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {client.scenarios.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 font-sans mb-4">
                        Nenhum cenário criado ainda
                      </p>
                      <Link
                        href={`/wealth-planning/scenarios/new?clientId=${client.id}`}
                      >
                        <Button className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans">
                          <Plus className="mr-2 h-4 w-4" />
                          Criar Primeiro Cenário
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {client.scenarios.map((scenario) => (
                        <div
                          key={scenario.id}
                          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <Link
                              href={`/wealth-planning/scenarios/${scenario.id}/results`}
                              className="flex-1"
                            >
                              <div>
                                <h3 className="font-semibold font-sans">
                                  {scenario.title}
                                </h3>
                                <p className="text-sm text-gray-600 font-sans mt-1">
                                  Criado em{" "}
                                  {new Date(scenario.createdAt).toLocaleDateString(
                                    "pt-BR"
                                  )}
                                </p>
                              </div>
                            </Link>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  scenario.status === "published"
                                    ? "default"
                                    : "outline"
                                }
                                className="font-sans"
                              >
                                {scenario.status === "published"
                                  ? "Publicado"
                                  : "Rascunho"}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 font-sans"
                                onClick={(e) => handleDeleteClick(scenario.id, e)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />

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
    </>
  );
}

