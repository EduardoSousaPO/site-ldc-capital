"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import AdminLayout from "../../../components/AdminLayout";

// Dynamic import for markdown editor to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const categories = [
  "Consultoria Financeira",
  "Investimentos",
  "Planejamento Financeiro",
  "Mercado Financeiro",
  "Educação Financeira"
];

interface EditPostProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditPost({ params }: EditPostProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(true);
  const [postId, setPostId] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    summary: "",
    category: "",
    cover: "",
    published: false
  });

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setPostId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    if (!postId) return;
    try {
      const response = await fetch(`/api/admin/posts/${postId}`);
      if (response.ok) {
        const post = await response.json();
        setFormData({
          title: post.title,
          content: post.content,
          summary: post.summary || "",
          category: post.category,
          cover: post.cover || "",
          published: post.published
        });
      } else {
        alert("Post não encontrado");
        router.push("/admin/dashboard");
      }
    } catch (error) {
      console.error("Erro ao carregar post:", error);
      alert("Erro ao carregar post");
    } finally {
      setLoadingPost(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, publish?: boolean) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          published: publish !== undefined ? publish : formData.published
        }),
      });

      if (response.ok) {
        router.push("/admin/dashboard");
      } else {
        alert("Erro ao salvar postagem");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar postagem");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir esta postagem? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/admin/dashboard");
      } else {
        alert("Erro ao excluir postagem");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao excluir postagem");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loadingPost) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#98ab44]/30 border-t-[#98ab44] rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#262d3d]">
                Editar Postagem
              </h1>
              <p className="text-gray-600 mt-1">
                Edite sua postagem do blog
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleDelete}
              variant="outline"
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
            
            <Button
              onClick={(e) => handleSubmit(e, false)}
              disabled={loading || !formData.title || !formData.content}
              variant="outline"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
            
            <Button
              onClick={(e) => handleSubmit(e, !formData.published)}
              disabled={loading || !formData.title || !formData.content || !formData.category}
              className="bg-[#98ab44] hover:bg-[#98ab44]/90"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              {formData.published ? "Despublicar" : "Publicar"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-base font-semibold">
                      Título da Postagem *
                    </Label>
                    <Input
                      id="title"
                      placeholder="Digite o título da postagem..."
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className="mt-2 text-lg"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="summary" className="text-base font-semibold">
                      Resumo
                    </Label>
                    <Textarea
                      id="summary"
                      placeholder="Escreva um breve resumo da postagem..."
                      value={formData.summary}
                      onChange={(e) => handleInputChange("summary", e.target.value)}
                      className="mt-2"
                      rows={3}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Este resumo aparecerá na listagem do blog
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Conteúdo da Postagem *</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-[400px]">
                  <MDEditor
                    value={formData.content}
                    onChange={(val) => handleInputChange("content", val || "")}
                    preview="edit"
                    hideToolbar={false}
                    visibleDragbar={false}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Use Markdown para formatar seu conteúdo. Suporte completo para títulos, listas, links, imagens e muito mais.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category" className="text-sm font-semibold">
                    Categoria *
                  </Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange("category", value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cover" className="text-sm font-semibold">
                    Imagem de Capa
                  </Label>
                  <Input
                    id="cover"
                    placeholder="/images/blog/minha-imagem.jpg"
                    value={formData.cover}
                    onChange={(e) => handleInputChange("cover", e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL da imagem de capa (opcional)
                  </p>
                </div>

                {formData.cover && (
                  <div className="border rounded-lg p-2">
                    <img
                      src={formData.cover}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview Info */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <Badge 
                    variant={formData.published ? "default" : "secondary"}
                    className={formData.published 
                      ? "bg-green-100 text-green-800 hover:bg-green-100" 
                      : "bg-orange-100 text-orange-800 hover:bg-orange-100"
                    }
                  >
                    {formData.published ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Autor:</span>
                  <span className="font-medium">{session?.user?.name}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Palavras:</span>
                  <span className="font-medium">
                    {formData.content.split(/\s+/).filter(word => word.length > 0).length}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tempo de leitura:</span>
                  <span className="font-medium">
                    {Math.max(1, Math.ceil(formData.content.split(/\s+/).filter(word => word.length > 0).length / 200))} min
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

