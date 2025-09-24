"use client";

import { getCurrentUser } from "@/lib/auth-supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Newspaper,
  FileText,
  TrendingUp,
  Calendar,
  BookOpen,
  BarChart3,
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

interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalMaterials: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name?: string; role: string } | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalMaterials: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "EDITOR")) {
          router.push("/admin/login");
          return;
        }
        
        setUser(currentUser);
        await fetchData();
      } catch (error) {
        console.error('Auth error:', error);
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchData = async () => {
    try {
      // Buscar posts
      const postsResponse = await fetch("/api/admin/posts");
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setPosts(postsData.slice(0, 5)); // Últimos 5 posts
        
        // Calcular estatísticas
        const published = postsData.filter((p: BlogPost) => p.published).length;
        const draft = postsData.filter((p: BlogPost) => !p.published).length;
        
        setStats({
          totalPosts: postsData.length,
          publishedPosts: published,
          draftPosts: draft,
          totalMaterials: 0 // TODO: implementar quando tiver API de materiais
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
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

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#262d3d] mb-2">Dashboard</h1>
          <p className="text-gray-600 font-sans">
            Bem-vindo de volta, {user?.name || user?.email}! Aqui está um resumo do seu conteúdo.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-sans text-gray-600">
                Total de Posts
              </CardTitle>
              <Newspaper className="h-4 w-4 text-[#98ab44]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif text-[#262d3d]">
                {stats.totalPosts}
              </div>
              <p className="text-xs text-gray-500 font-sans">
                {stats.publishedPosts} publicados
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-sans text-gray-600">
                Posts Publicados
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif text-[#262d3d]">
                {stats.publishedPosts}
              </div>
              <p className="text-xs text-gray-500 font-sans">
                Visíveis no site
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-sans text-gray-600">
                Rascunhos
              </CardTitle>
              <FileText className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif text-[#262d3d]">
                {stats.draftPosts}
              </div>
              <p className="text-xs text-gray-500 font-sans">
                Não publicados
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-sans text-gray-600">
                Materiais
              </CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif text-[#262d3d]">
                {stats.totalMaterials}
              </div>
              <p className="text-xs text-gray-500 font-sans">
                E-books e guias
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl text-[#262d3d] flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-[#98ab44]" />
                Posts Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-sans">Nenhum post encontrado</p>
                  <Link href="/admin/posts/new">
                    <Button className="mt-4 bg-[#98ab44] hover:bg-[#98ab44]/90 text-white">
                      Criar Primeiro Post
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium font-sans text-[#262d3d] truncate">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={post.published ? "default" : "secondary"} className="text-xs">
                            {post.published ? "Publicado" : "Rascunho"}
                          </Badge>
                          <span className="text-xs text-gray-500 font-sans">
                            {post.category}
                          </span>
                        </div>
                      </div>
                      <Link href={`/admin/posts/edit/${post.id}`}>
                        <Button variant="outline" size="sm" className="font-sans">
                          Editar
                        </Button>
                      </Link>
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <Link href="/admin/posts">
                      <Button variant="outline" className="w-full font-sans">
                        Ver Todos os Posts
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl text-[#262d3d] flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#98ab44]" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/admin/posts/new" className="block">
                <Button className="w-full bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans">
                  <FileText className="mr-2 h-4 w-4" />
                  Nova Postagem
                </Button>
              </Link>
              
              <Link href="/admin/materials/new" className="block">
                <Button variant="outline" className="w-full font-sans">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Novo Material
                </Button>
              </Link>
              
              <Link href="/admin/posts" className="block">
                <Button variant="outline" className="w-full font-sans">
                  <Newspaper className="mr-2 h-4 w-4" />
                  Gerenciar Posts
                </Button>
              </Link>
              
              <Link href="/admin/materials" className="block">
                <Button variant="outline" className="w-full font-sans">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Gerenciar Materiais
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
