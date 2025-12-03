"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  UserPlus,
  TrendingUp,
  FileText,
  Calendar,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { getCurrentUser } from "@/lib/auth-supabase";
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
  createdAt: string;
  scenarios: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
}

export default function WealthPlanningPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteScenarioDialogOpen, setDeleteScenarioDialogOpen] = useState(false);
  const [deleteScenarioId, setDeleteScenarioId] = useState<string | null>(null);
  const [deleteScenarioError, setDeleteScenarioError] = useState<string | null>(null);
  const [isDeletingScenario, setIsDeletingScenario] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
          router.push("/admin/login");
          return;
        }
        await fetchClients();
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/admin/wealth-planning/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (clientId: string) => {
    setDeleteClientId(clientId);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteClientId) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/admin/wealth-planning/clients/${deleteClientId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDeleteDialogOpen(false);
        setDeleteClientId(null);
        await fetchClients();
      } else {
        const errorData = await response.json();
        setDeleteError(errorData.error || "Erro ao excluir cliente");
      }
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      setDeleteError("Erro ao excluir cliente. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteScenarioClick = (scenarioId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteScenarioId(scenarioId);
    setDeleteScenarioError(null);
    setDeleteScenarioDialogOpen(true);
  };

  const handleDeleteScenarioConfirm = async () => {
    if (!deleteScenarioId) return;

    setIsDeletingScenario(true);
    setDeleteScenarioError(null);

    try {
      const response = await fetch(
        `/api/admin/wealth-planning/scenarios/${deleteScenarioId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setDeleteScenarioDialogOpen(false);
        setDeleteScenarioId(null);
        await fetchClients();
      } else {
        const errorData = await response.json();
        setDeleteScenarioError(errorData.error || "Erro ao excluir cenário");
      }
    } catch (error) {
      console.error("Erro ao excluir cenário:", error);
      setDeleteScenarioError("Erro ao excluir cenário. Tente novamente.");
    } finally {
      setIsDeletingScenario(false);
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#262d3d] mb-2">
              Wealth Planning
            </h1>
            <p className="text-gray-600 font-sans">
              Gerencie clientes e crie estudos de planejamento financeiro
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/wealth-planning/clients/new">
              <Button className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans">
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </Link>
            <Link href="/admin/wealth-planning/scenarios/new">
              <Button className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans">
                <Plus className="mr-2 h-4 w-4" />
                Novo Cenário
              </Button>
            </Link>
            <Link href="/admin/wealth-planning/compare">
              <Button variant="outline" className="font-sans">
                <TrendingUp className="mr-2 h-4 w-4" />
                Comparar Cenários
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar clientes por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#98ab44] focus:ring-[#98ab44] font-sans"
              />
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-sans mb-4">
                {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              </p>
              <Link href="/admin/wealth-planning/clients/new">
                <Button className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar Primeiro Cliente
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="font-serif text-xl text-[#262d3d] mb-2">
                        {client.name}
                      </CardTitle>
                      <div className="space-y-1 text-sm text-gray-600 font-sans">
                        {client.email && (
                          <p>
                            <span className="font-medium">Email:</span> {client.email}
                          </p>
                        )}
                        {client.phone && (
                          <p>
                            <span className="font-medium">Telefone:</span> {client.phone}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {client.scenarios.length} cenário(s) cadastrado(s)
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/wealth-planning/clients/${client.id}`}>
                        <Button variant="outline" size="sm" className="font-sans">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </Button>
                      </Link>
                      <Link href={`/admin/wealth-planning/clients/${client.id}/edit`}>
                        <Button variant="outline" size="sm" className="font-sans">
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 font-sans"
                        onClick={() => handleDeleteClick(client.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {client.scenarios.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-[#262d3d] font-sans mb-2">
                        Cenários:
                      </p>
                      <div className="space-y-2">
                        {client.scenarios.map((scenario) => (
                          <div
                            key={scenario.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm text-[#262d3d] font-sans">
                                {scenario.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant={scenario.status === "published" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {scenario.status === "published" ? "Publicado" : "Rascunho"}
                                </Badge>
                                <span className="text-xs text-gray-500 font-sans">
                                  {new Date(scenario.createdAt).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link href={`/admin/wealth-planning/scenarios/${scenario.id}/results`}>
                                <Button variant="ghost" size="sm" className="font-sans">
                                  <TrendingUp className="mr-2 h-4 w-4" />
                                  Ver Resultados
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 font-sans"
                                onClick={(e) => handleDeleteScenarioClick(scenario.id, e)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 font-sans mb-3">
                        Nenhum cenário criado para este cliente
                      </p>
                      <Link href={`/admin/wealth-planning/scenarios/new?clientId=${client.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white border-[#98ab44] font-sans"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Criar Cenário
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </div>

        {/* Dialog de Confirmação de Exclusão de Cliente */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteError ? (
                  <span className="text-red-600 font-semibold">{deleteError}</span>
                ) : (
                  "Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
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

        {/* Dialog de Confirmação de Exclusão de Cenário */}
        <AlertDialog open={deleteScenarioDialogOpen} onOpenChange={setDeleteScenarioDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteScenarioError ? (
                  <span className="text-red-600 font-semibold">{deleteScenarioError}</span>
                ) : (
                  "Tem certeza que deseja excluir este cenário? Esta ação não pode ser desfeita."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingScenario}>Cancelar</AlertDialogCancel>
              {!deleteScenarioError && (
                <AlertDialogAction
                  onClick={handleDeleteScenarioConfirm}
                  disabled={isDeletingScenario}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeletingScenario ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              )}
              {deleteScenarioError && (
                <AlertDialogAction onClick={() => setDeleteScenarioDialogOpen(false)}>
                  OK
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    );
  }

