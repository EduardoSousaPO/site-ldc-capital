"use client";

import { getCurrentUser } from "@/lib/auth-supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Newspaper,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar
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

export default function PostsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name?: string; role: string } | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "EDITOR")) {
          router.push("/admin/login");
          return;
        }
        
        setUser(currentUser);
        await fetchPosts();
      } catch (error) {
        console.error('Auth error:', error);
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    filterPosts();
  }, [posts, searchTerm, filterStatus]);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/admin/posts");
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Erro ao carregar posts:", error);
    }
  };

  const filterPosts = () => {
    let filtered = posts;

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por status
    if (filterStatus !== "all") {
      filtered = filtered.filter(post => {
        if (filterStatus === "published") return post.published;
        if (filterStatus === "draft") return !post.published;
        return true;
      });
    }

    setFilteredPosts(filtered);
  };

  const handleDelete = async (id: string) => {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#262d3d] mb-2">Posts do Blog</h1>
            <p className="text-gray-600 font-sans">
              Gerencie todos os posts do seu blog
            </p>
          </div>
          <Link href="/admin/posts/new">
            <Button className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans">
              <Plus className="mr-2 h-4 w-4" />
              Nova Postagem
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="published">Publicados</SelectItem>
                  <SelectItem value="draft">Rascunhos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-serif text-xl font-semibold text-[#262d3d] mb-2">
                {posts.length === 0 ? "Nenhum post encontrado" : "Nenhum resultado"}
              </h3>
              <p className="text-gray-600 font-sans mb-6">
                {posts.length === 0 
                  ? "Comece criando seu primeiro post do blog"
                  : "Tente ajustar os filtros de busca"
                }
              </p>
              {posts.length === 0 && (
                <Link href="/admin/posts/new">
                  <Button className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Post
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant={post.published ? "default" : "secondary"} className="font-sans">
                          {post.published ? "Publicado" : "Rascunho"}
                        </Badge>
                        <Badge variant="outline" className="font-sans">
                          {post.category}
                        </Badge>
                      </div>
                      
                      <h3 className="font-serif text-xl font-semibold text-[#262d3d] mb-2 truncate">
                        {post.title}
                      </h3>
                      
                      <div className="flex items-center text-sm text-gray-500 font-sans gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                        <span>Por {post.author.name || post.author.email}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {post.published && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-sans"
                          onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Link href={`/admin/posts/edit/${post.id}`}>
                        <Button variant="outline" size="sm" className="font-sans">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 font-sans"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex justify-center">
          <div className="flex items-center gap-6 text-sm text-gray-500 font-sans">
            <span>{filteredPosts.length} posts encontrados</span>
            <span>•</span>
            <span>{posts.filter(p => p.published).length} publicados</span>
            <span>•</span>
            <span>{posts.filter(p => !p.published).length} rascunhos</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
