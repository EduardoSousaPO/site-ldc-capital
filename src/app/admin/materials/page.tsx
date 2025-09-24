"use client";

import { getCurrentUser } from "@/lib/auth-supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  Download,
  Star,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import AdminLayout from "../components/AdminLayout";
import { toast } from "sonner";

interface Material {
  id: string;
  title: string;
  slug: string;
  category: string;
  type: string;
  published: boolean;
  featured: boolean;
  downloadCount: number;
  pages?: number;
  fileSize?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string | null;
    email: string;
  };
}

export default function MaterialsPage() {
  // Auth será verificada pelo AdminLayout
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchTerm, filterStatus, filterCategory]);

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/admin/materials");
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        toast.error(`Erro ao carregar materiais: ${errorData.error || 'Erro desconhecido'}`);
        setMaterials([]);
        return;
      }
      
      const data = await response.json();
      setMaterials(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar materiais:", error);
      toast.error("Erro ao conectar com o servidor");
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const filterMaterials = () => {
    let filtered = materials;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(material =>
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(material => {
        if (filterStatus === "published") return material.published;
        if (filterStatus === "draft") return !material.published;
        if (filterStatus === "featured") return material.featured;
        return true;
      });
    }

    // Filter by category
    if (filterCategory !== "all") {
      filtered = filtered.filter(material => 
        material.category.toLowerCase() === filterCategory.toLowerCase()
      );
    }

    setFilteredMaterials(filtered);
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este material?")) return;

    try {
      const response = await fetch(`/api/admin/materials/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMaterials(materials.filter(material => material.id !== id));
        toast.success("Material excluído com sucesso!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao excluir material");
      }
    } catch (error) {
      console.error("Erro ao excluir material:", error);
      toast.error("Erro ao excluir material");
    }
  };

  const togglePublish = async (id: string, published: boolean) => {
    try {
      const response = await fetch(`/api/admin/materials/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ published: !published }),
      });

      if (response.ok) {
        setMaterials(materials.map(material => 
          material.id === id ? { ...material, published: !published } : material
        ));
        toast.success(`Material ${!published ? 'publicado' : 'despublicado'} com sucesso!`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao atualizar status");
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const toggleFeatured = async (id: string, featured: boolean) => {
    try {
      const response = await fetch(`/api/admin/materials/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ featured: !featured }),
      });

      if (response.ok) {
        setMaterials(materials.map(material => 
          material.id === id ? { ...material, featured: !featured } : material
        ));
        toast.success(`Material ${!featured ? 'destacado' : 'removido do destaque'} com sucesso!`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao atualizar destaque");
      }
    } catch (error) {
      console.error("Erro ao atualizar destaque:", error);
      toast.error("Erro ao atualizar destaque");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#98ab44]/30 border-t-[#98ab44] rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  const categories = [...new Set(materials.map(m => m.category))];
  const publishedMaterials = materials.filter(m => m.published);
  const draftMaterials = materials.filter(m => !m.published);
  const featuredMaterials = materials.filter(m => m.featured);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#262d3d]">
              Gerenciar Materiais
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie cartilhas, guias e materiais educativos
            </p>
          </div>
          
          <Link href="/admin/materials/new">
            <Button className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Novo Material
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
                    Total de Materiais
                  </p>
                  <p className="text-3xl font-bold text-[#262d3d]">
                    {materials.length}
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
                    {publishedMaterials.length}
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
                    {draftMaterials.length}
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
                    Em Destaque
                  </p>
                  <p className="text-3xl font-bold text-[#262d3d]">
                    {featuredMaterials.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Pesquisar por título, categoria ou tipo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                  size="sm"
                  className={filterStatus === "all" ? "bg-[#98ab44] hover:bg-[#98ab44]/90" : ""}
                >
                  Todos ({materials.length})
                </Button>
                <Button
                  variant={filterStatus === "published" ? "default" : "outline"}
                  onClick={() => setFilterStatus("published")}
                  size="sm"
                  className={filterStatus === "published" ? "bg-[#98ab44] hover:bg-[#98ab44]/90" : ""}
                >
                  Publicados ({publishedMaterials.length})
                </Button>
                <Button
                  variant={filterStatus === "draft" ? "default" : "outline"}
                  onClick={() => setFilterStatus("draft")}
                  size="sm"
                  className={filterStatus === "draft" ? "bg-[#98ab44] hover:bg-[#98ab44]/90" : ""}
                >
                  Rascunhos ({draftMaterials.length})
                </Button>
                <Button
                  variant={filterStatus === "featured" ? "default" : "outline"}
                  onClick={() => setFilterStatus("featured")}
                  size="sm"
                  className={filterStatus === "featured" ? "bg-[#98ab44] hover:bg-[#98ab44]/90" : ""}
                >
                  Destaque ({featuredMaterials.length})
                </Button>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="mt-4 flex gap-2 flex-wrap">
                <Button
                  variant={filterCategory === "all" ? "default" : "outline"}
                  onClick={() => setFilterCategory("all")}
                  size="sm"
                  className={filterCategory === "all" ? "bg-[#577171] hover:bg-[#577171]/90" : ""}
                >
                  Todas Categorias
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={filterCategory === category.toLowerCase() ? "default" : "outline"}
                    onClick={() => setFilterCategory(category.toLowerCase())}
                    size="sm"
                    className={filterCategory === category.toLowerCase() ? "bg-[#577171] hover:bg-[#577171]/90" : ""}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Materials Table */}
        <Card>
          <CardContent>
            {filteredMaterials.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {searchTerm || filterStatus !== "all" || filterCategory !== "all"
                    ? "Nenhum material encontrado" 
                    : "Nenhum material criado"
                  }
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filterStatus !== "all" || filterCategory !== "all"
                    ? "Tente ajustar os filtros de busca"
                    : "Comece criando seu primeiro material educativo"
                  }
                </p>
                {!searchTerm && filterStatus === "all" && filterCategory === "all" && (
                  <Link href="/admin/materials/new">
                    <Button className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Material
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-[#262d3d]">
                        Material
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-[#262d3d]">
                        Categoria
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-[#262d3d]">
                        Tipo
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-[#262d3d]">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-[#262d3d]">
                        Downloads
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-[#262d3d]">
                        Criado em
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-[#262d3d]">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaterials.map((material) => (
                      <tr key={material.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {material.featured && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                            <div>
                              <h3 className="font-medium text-[#262d3d] line-clamp-1">
                                {material.title}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <span>por {material.author.name || "Autor"}</span>
                                {material.pages && <span>• {material.pages} páginas</span>}
                                {material.fileSize && <span>• {material.fileSize}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="secondary" className="bg-[#98ab44]/10 text-[#98ab44]">
                            {material.category}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline">
                            {material.type}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={material.published ? "default" : "secondary"}
                              className={material.published 
                                ? "bg-green-100 text-green-800 hover:bg-green-100" 
                                : "bg-orange-100 text-orange-800 hover:bg-orange-100"
                              }
                            >
                              {material.published ? "Publicado" : "Rascunho"}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Download className="w-4 h-4" />
                            {material.downloadCount}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {new Date(material.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          })}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/materials/edit/${material.id}`}>
                              <Button size="sm" variant="outline" title="Editar">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleFeatured(material.id, material.featured)}
                              className={material.featured 
                                ? "text-yellow-600 hover:text-yellow-700" 
                                : "text-gray-600 hover:text-yellow-600"
                              }
                              title={material.featured ? "Remover destaque" : "Destacar"}
                            >
                              <Star className={`w-4 h-4 ${material.featured ? 'fill-current' : ''}`} />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => togglePublish(material.id, material.published)}
                              className={material.published 
                                ? "text-orange-600 hover:text-orange-700" 
                                : "text-green-600 hover:text-green-700"
                              }
                              title={material.published ? "Despublicar" : "Publicar"}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteMaterial(material.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Excluir"
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
