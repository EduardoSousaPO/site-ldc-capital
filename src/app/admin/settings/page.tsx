"use client";

// Auth será verificada pelo AdminLayout
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  User, 
  Key, 
  Database,
  Info,
  Save
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";

export default function SettingsPage() {
  const { data: session, status } = getCurrentUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user?.role !== "ADMIN") {
      router.push("/admin/login");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#98ab44]/30 border-t-[#98ab44] rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <Key className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Acesso Negado
          </h3>
          <p className="text-gray-500">
            Apenas administradores podem acessar as configurações
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#262d3d]">
            Configurações
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie as configurações do sistema
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <User className="w-5 h-5 text-[#98ab44]" />
                Informações do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Nome</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  {session?.user?.name}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-semibold">Email</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  {session?.user?.email}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-semibold">Função</Label>
                <div className="mt-1">
                  <Badge 
                    variant="default"
                    className="bg-[#98ab44] text-white"
                  >
                    {session?.user?.role === "ADMIN" ? "Administrador" : "Editor"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Info className="w-5 h-5 text-[#98ab44]" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Versão</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  1.0.0
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-semibold">Banco de Dados</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                  <Database className="w-4 h-4 text-green-600" />
                  SQLite (Conectado)
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-semibold">Ambiente</Label>
                <div className="mt-1">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Desenvolvimento
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Key className="w-5 h-5 text-[#98ab44]" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  Configurações de Segurança
                </h4>
                <p className="text-sm text-yellow-700">
                  Para alterar senhas ou configurações de segurança, entre em contato com o desenvolvedor do sistema.
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-semibold">Última Sessão</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  {new Date().toLocaleString("pt-BR")}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blog Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#98ab44]" />
                Configurações do Blog
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Configurações Disponíveis
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Gerenciar postagens do blog</li>
                  <li>• Criar e editar conteúdo</li>
                  <li>• Publicar e despublicar posts</li>
                  <li>• Organizar por categorias</li>
                </ul>
              </div>
              
              <div>
                <Label className="text-sm font-semibold">Categorias Disponíveis</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    "Consultoria Financeira",
                    "Investimentos", 
                    "Planejamento Financeiro",
                    "Mercado Financeiro",
                    "Educação Financeira"
                  ].map((category) => (
                    <Badge key={category} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="p-6 h-auto flex flex-col items-center gap-2"
                onClick={() => router.push("/admin/posts/new")}
              >
                <div className="w-8 h-8 bg-[#98ab44]/10 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-[#98ab44]" />
                </div>
                <div className="text-center">
                  <div className="font-semibold">Nova Postagem</div>
                  <div className="text-xs text-gray-500">Criar conteúdo</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="p-6 h-auto flex flex-col items-center gap-2"
                onClick={() => router.push("/admin/posts")}
              >
                <div className="w-8 h-8 bg-[#98ab44]/10 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-[#98ab44]" />
                </div>
                <div className="text-center">
                  <div className="font-semibold">Gerenciar Posts</div>
                  <div className="text-xs text-gray-500">Ver todos os posts</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="p-6 h-auto flex flex-col items-center gap-2"
                onClick={() => window.open("/", "_blank")}
              >
                <div className="w-8 h-8 bg-[#98ab44]/10 rounded-lg flex items-center justify-center">
                  <Database className="w-4 h-4 text-[#98ab44]" />
                </div>
                <div className="text-center">
                  <div className="font-semibold">Ver Site</div>
                  <div className="text-xs text-gray-500">Visualizar público</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

