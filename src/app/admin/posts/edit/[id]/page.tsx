"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Eye, Image as ImageIcon, Upload, X } from "lucide-react";
import Link from "next/link";
import AdminLayout from "../../../components/AdminLayout";
import { toast } from "sonner";

// Dynamic import for markdown editor to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const categories = [
  "Consultoria Financeira",
  "Investimentos",
  "Planejamento Financeiro",
  "Mercado Financeiro",
  "Educação Financeira"
];

interface BlogPost {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  category: string;
  cover: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string | null;
    email: string;
  };
}

export default function EditPost() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    summary: "",
    category: "",
    cover: "",
    published: false
  });

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/admin/posts/${postId}`);
      if (response.ok) {
        const postData = await response.json();
        setPost(postData);
        setFormData({
          title: postData.title,
          content: postData.content,
          summary: postData.summary || "",
          category: postData.category,
          cover: postData.cover || "",
          published: postData.published
        });
      } else {
        toast.error("Erro ao carregar post");
        router.push("/admin/posts");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao carregar post");
      router.push("/admin/posts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, publish?: boolean) => {
    e.preventDefault();
    setSaving(true);

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
        const updatedPost = await response.json();
        setPost(updatedPost);
        setFormData(prev => ({ ...prev, published: updatedPost.published }));
        toast.success(publish ? "Post publicado com sucesso!" : "Post salvo com sucesso!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao salvar post");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao salvar post");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (file: File) => {
    setUploadingCover(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("type", "cover");

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (response.ok) {
        const result = await response.json();
        handleInputChange("cover", result.url);
        toast.success("Imagem enviada com sucesso!");
      } else {
        const error = await response.json();
        toast.error(`Erro no upload: ${error.error}`);
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro no upload da imagem");
    } finally {
      setUploadingCover(false);
    }
  };

  const removeCover = () => {
    handleInputChange("cover", "");
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

  if (!post) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-600">Post não encontrado</h2>
          <Link href="/admin/posts">
            <Button className="mt-4">Voltar para Posts</Button>
          </Link>
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
            <Link href="/admin/posts">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#262d3d]">
                Editar Post
              </h1>
              <p className="text-gray-600 mt-1">
                Editando: {post.title}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={(e) => handleSubmit(e, false)}
              disabled={saving || !formData.title || !formData.content}
              variant="outline"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Rascunho
            </Button>
            
            <Button
              onClick={(e) => handleSubmit(e, true)}
              disabled={saving || !formData.title || !formData.content || !formData.category}
              className="bg-[#98ab44] hover:bg-[#98ab44]/90"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              {formData.published ? "Atualizar" : "Publicar"}
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
                    textareaProps={{
                      placeholder: "Comece a escrever sua postagem aqui...\n\nVocê pode usar Markdown para formatar o texto:\n\n# Título\n## Subtítulo\n\n**Texto em negrito**\n*Texto em itálico*\n\n- Lista\n- De itens\n\n[Link](https://exemplo.com)"
                    }}
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
              </CardContent>
            </Card>

            {/* Cover Image */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#98ab44]" />
                  Imagem de Capa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!formData.cover ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">
                      JPG, PNG ou WebP (máx. 5MB)
                    </p>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingCover}
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={uploadingCover}
                      >
                        {uploadingCover ? (
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {uploadingCover ? "Enviando..." : "Upload"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={formData.cover}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeCover}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-700 bg-white/90"
                    >
                      <X className="w-4 h-4" />
                    </Button>
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
                    className={formData.published ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                  >
                    {formData.published ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Autor:</span>
                  <span className="font-medium">{post.author.name || post.author.email}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Criado:</span>
                  <span className="font-medium">
                    {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Atualizado:</span>
                  <span className="font-medium">
                    {new Date(post.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
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

            {/* Actions */}
            {formData.published && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Ações</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(`/blog/${post.id}`, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver no Site
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

