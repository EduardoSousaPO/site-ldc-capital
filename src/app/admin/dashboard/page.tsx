"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  User,
  BarChart3,
  Settings
} from "lucide-react";
import Link from "next/link";
import AdminLayout from "../components/AdminLayout";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "EDITOR")) {
      router.push("/admin/login");
      return;
    }

    fetchPosts();
  }, [session, status, router]);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/admin/posts");
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Erro ao carregar posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este post?")) return;

    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPosts(posts.filter(post => post.id !== id));
      }
    } catch (error) {
      console.error("Erro ao excluir post:", error);
    }
  };

  const togglePublish = async (id: string, published: boolean) => {
    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ published: !published }),
      });

      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === id ? { ...post, published: !published } : post
        ));
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#98ab44]/30 border-t-[#98ab44] rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  const publishedPosts = posts.filter(post => post.published);
  const draftPosts = posts.filter(post => !post.published);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#262d3d]">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Bem-vindo de volta, {session?.user?.name}!
            </p>
          </div>
          
          <Link href="/admin/posts/new">
            <Button className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nova Postagem
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total de Posts
                  </p>
                  <p className="text-3xl font-bold text-[#262d3d]">
                    {posts.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#98ab44]/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#98ab44]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Publicados
                  </p>
                  <p className="text-3xl font-bold text-[#262d3d]">
                    {publishedPosts.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Rascunhos
                  </p>
                  <p className="text-3xl font-bold text-[#262d3d]">
                    {draftPosts.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Edit className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Categorias
                  </p>
                  <p className="text-3xl font-bold text-[#262d3d]">
                    {[...new Set(posts.map(post => post.category))].length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Postagens Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Nenhuma postagem encontrada
                </h3>
                <p className="text-gray-500 mb-4">
                  Comece criando sua primeira postagem
                </p>
                <Link href="/admin/posts/new">
                  <Button className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Postagem
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-[#262d3d]">
                        Título
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-[#262d3d]">
                        Categoria
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-[#262d3d]">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-[#262d3d]">
                        Data
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-[#262d3d]">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr key={post.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <h3 className="font-medium text-[#262d3d] line-clamp-1">
                              {post.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              por {post.author.name}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="secondary" className="bg-[#98ab44]/10 text-[#98ab44]">
                            {post.category}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            variant={post.published ? "default" : "secondary"}
                            className={post.published 
                              ? "bg-green-100 text-green-800 hover:bg-green-100" 
                              : "bg-orange-100 text-orange-800 hover:bg-orange-100"
                            }
                          >
                            {post.published ? "Publicado" : "Rascunho"}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/posts/edit/${post.id}`}>
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => togglePublish(post.id, post.published)}
                              className={post.published 
                                ? "text-orange-600 hover:text-orange-700" 
                                : "text-green-600 hover:text-green-700"
                              }
                            >
                              {post.published ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePost(post.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

