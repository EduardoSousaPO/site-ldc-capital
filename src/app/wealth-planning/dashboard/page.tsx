"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  LogOut,
} from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { getCurrentUser, type User } from "@/lib/auth-supabase";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast-system";
import { EmptyState } from "@/components/wealth-planning/EmptyState";
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
  scenariosCount: number;
}

export default function WealthPlanningDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  // Estados para diálogo de exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Garantir que o componente está montado no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/wealth-planning/clients", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data || []);
      } else {
        if (response.status === 401) {
          router.push("/wealth-planning");
          return;
        }
        let errorMessage = "Erro ao carregar clientes";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      showToast("Erro ao carregar clientes. Tente novamente.", "error");
    }
  }, [showToast, router]);

  useEffect(() => {
    if (!mounted) return;

    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (
          !currentUser ||
          (currentUser.role !== "ADMIN" && currentUser.role !== "EDITOR")
        ) {
          router.push("/wealth-planning");
          return;
        }
        setUser(currentUser);
        await fetchClients();
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/wealth-planning");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, mounted, fetchClients]);

  const handleDeleteClick = useCallback(
    (clientId: string, e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDeleteClientId(clientId);
      setDeleteError(null);
      setDeleteDialogOpen(true);
    },
    []
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteClientId) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(
        `/api/admin/wealth-planning/clients/${deleteClientId}`,
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
        setDeleteClientId(null);
        showToast("Cliente excluído com sucesso", "success");
        await fetchClients();
      } else {
        let errorMsg = "Erro ao excluir cliente";
        try {
          const errorData = await response.json();
          console.error("Erro da API ao excluir:", errorData);
          errorMsg = errorData.error || errorMsg;

          // Se houver cenários vinculados, mostrar mensagem mais clara
          if (errorData.scenariosCount > 0) {
            errorMsg = `Não é possível excluir. O cliente possui ${errorData.scenariosCount} cenário(s) vinculado(s). Exclua os cenários primeiro.`;
          }

          if (errorData.details) {
            errorMsg += ` (${errorData.details})`;
          }
        } catch (parseError) {
          console.error("Erro ao parsear resposta:", parseError);
          errorMsg = `Erro ${response.status}: ${response.statusText}`;
        }
        setDeleteError(errorMsg);
        showToast(errorMsg, "error");
      }
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      const errorMsg = "Erro ao excluir cliente. Tente novamente.";
      setDeleteError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteClientId, fetchClients, showToast]);

  const handleLogout = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        showToast("Logout realizado com sucesso", "success");
        router.push("/wealth-planning");
        router.refresh();
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
        showToast("Erro ao fazer logout", "error");
        router.push("/wealth-planning");
      }
    },
    [router, showToast]
  );

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted || loading) {
    return (
      <>
        <Header />
        <main className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-[#262d3d]/30 border-t-[#262d3d] rounded-full animate-spin" aria-label="Carregando"></div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header do Dashboard */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#262d3d] mb-2">
                Wealth Planning
              </h1>
              <p className="text-gray-600 font-sans">
                Gerencie seus clientes e cenários de planejamento financeiro
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="font-sans"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600 font-sans">
                  Total de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#262d3d] font-serif">
                  {clients.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600 font-sans">
                  Total de Cenários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#262d3d] font-serif">
                  {clients.reduce((sum, c) => sum + c.scenariosCount, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600 font-sans">
                  Usuário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-sans text-gray-700">
                  {user?.email || "N/A"}
                </div>
                <Badge variant="outline" className="mt-1 font-sans">
                  {user?.role || "USER"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Barra de busca e ações */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar clientes por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 font-sans"
              />
            </div>
            <Link href="/wealth-planning/clients/new">
              <Button className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans">
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </Link>
          </div>

          {/* Lista de clientes */}
          {filteredClients.length === 0 ? (
            <EmptyState
              icon={searchTerm ? Search : UserPlus}
              title={searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              description={
                searchTerm
                  ? "Tente buscar com outros termos ou filtros diferentes"
                  : "Comece cadastrando seu primeiro cliente para criar cenários de planejamento"
              }
              actionLabel={!searchTerm ? "Cadastrar Primeiro Cliente" : undefined}
              onAction={!searchTerm ? () => router.push("/wealth-planning/clients/new") : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client) => (
                <Card
                  key={client.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/wealth-planning/clients/${client.id}`)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="font-serif text-xl text-[#262d3d]">
                        {client.name}
                      </CardTitle>
                      <Badge variant="outline" className="font-sans">
                        {client.scenariosCount} cenário{client.scenariosCount !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {client.email && (
                      <p className="text-sm text-gray-600 mb-1 font-sans">
                        {client.email}
                      </p>
                    )}
                    {client.phone && (
                      <p className="text-sm text-gray-600 mb-4 font-sans">
                        {client.phone}
                      </p>
                    )}
                    <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-sans"
                        asChild
                      >
                        <Link href={`/wealth-planning/clients/${client.id}`}>
                          <Eye className="mr-1 h-3 w-3" />
                          Ver
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-sans"
                        asChild
                      >
                        <Link href={`/wealth-planning/clients/${client.id}/edit`}>
                          <Edit className="mr-1 h-3 w-3" />
                          Editar
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleDeleteClick(client.id, e)}
                        className="font-sans text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                    </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Diálogo de confirmação de exclusão */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-sans">
                  Confirmar exclusão
                </AlertDialogTitle>
                <AlertDialogDescription className="font-sans">
                  Tem certeza que deseja excluir este cliente? Esta ação não
                  pode ser desfeita.
                  {deleteError && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                      {deleteError}
                    </div>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={isDeleting}
                  className="font-sans"
                >
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white font-sans"
                >
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
      <Footer />
    </>
  );
}

