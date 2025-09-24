"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Eye, Upload, FileText, Image as ImageIcon, X, Trash2 } from "lucide-react";
import Link from "next/link";
import AdminLayout from "../../../components/AdminLayout";

const categories = [
  "GUIAS",
  "Planejamento Financeiro", 
  "Investimentos",
  "Consultoria Financeira",
  "Educação Financeira"
];

const materialTypes = [
  "Cartilha",
  "Guia",
  "E-book", 
  "Planilha",
  "Checklist",
  "Template",
  "Manual"
];

interface EditMaterialProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditMaterial({ params }: EditMaterialProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingMaterial, setLoadingMaterial] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [materialId, setMaterialId] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    category: "",
    type: "",
    cover: "",
    fileUrl: "",
    fileName: "",
    fileSize: "",
    pages: "",
    published: false,
    featured: false,
    downloadCount: 0
  });

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setMaterialId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (materialId) {
      fetchMaterial();
    }
  }, [materialId]);

  const fetchMaterial = async () => {
    if (!materialId) return;
    try {
      const response = await fetch(`/api/admin/materials/${materialId}`);
      if (response.ok) {
        const material = await response.json();
        setFormData({
          title: material.title,
          description: material.description || "",
          content: material.content || "",
          category: material.category,
          type: material.type,
          cover: material.cover || "",
          fileUrl: material.fileUrl || "",
          fileName: material.fileName || "",
          fileSize: material.fileSize || "",
          pages: material.pages ? material.pages.toString() : "",
          published: material.published,
          featured: material.featured,
          downloadCount: material.downloadCount
        });
      } else {
        alert("Material não encontrado");
        router.push("/admin/materials");
      }
    } catch (error) {
      console.error("Erro ao carregar material:", error);
      alert("Erro ao carregar material");
    } finally {
      setLoadingMaterial(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, publish?: boolean) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/materials/${materialId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          published: publish !== undefined ? publish : formData.published,
          pages: formData.pages ? parseInt(formData.pages) : null
        }),
      });

      if (response.ok) {
        router.push("/admin/materials");
      } else {
        alert("Erro ao salvar material");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar material");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este material? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/materials/${materialId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/admin/materials");
      } else {
        alert("Erro ao excluir material");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao excluir material");
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (file: File, type: "material" | "cover") => {
    if (type === "material") {
      setUploadingFile(true);
    } else {
      setUploadingCover(true);
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        
        if (type === "material") {
          setFormData(prev => ({
            ...prev,
            fileUrl: result.url,
            fileName: result.filename,
            fileSize: result.size
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            cover: result.url
          }));
        }
      } else {
        const error = await response.json();
        alert(`Erro no upload: ${error.error}`);
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro no upload do arquivo");
    } finally {
      if (type === "material") {
        setUploadingFile(false);
      } else {
        setUploadingCover(false);
      }
    }
  };

  const removeFile = (type: "material" | "cover") => {
    if (type === "material") {
      setFormData(prev => ({
        ...prev,
        fileUrl: "",
        fileName: "",
        fileSize: ""
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        cover: ""
      }));
    }
  };

  if (loadingMaterial) {
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
            <Link href="/admin/materials">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#262d3d]">
                Editar Material
              </h1>
              <p className="text-gray-600 mt-1">
                Edite as informações do material
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
              disabled={loading || !formData.title}
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
              disabled={loading || !formData.title || !formData.category || !formData.type}
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
            {/* Basic Info */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-base font-semibold">
                      Título do Material *
                    </Label>
                    <Input
                      id="title"
                      placeholder="Ex: Cartilha do Investidor Iniciante"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className="mt-2 text-lg"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="text-base font-semibold">
                      Descrição
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Breve descrição do material e seus benefícios..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="mt-2"
                      rows={3}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Esta descrição aparecerá na listagem de materiais
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Conteúdo Detalhado</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Descrição detalhada do conteúdo, tópicos abordados, benefícios..."
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  className="min-h-[200px]"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Conteúdo detalhado que será exibido na página do material
                </p>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#98ab44]" />
                  Arquivo do Material
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!formData.fileUrl ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Upload do Arquivo
                    </h3>
                    <p className="text-gray-500 mb-4">
                      PDF, DOCX, XLSX ou outros formatos (máx. 50MB)
                    </p>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.docx,.xlsx,.xls,.doc,.txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "material");
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingFile}
                      />
                      <Button 
                        disabled={uploadingFile}
                        className="bg-[#98ab44] hover:bg-[#98ab44]/90"
                      >
                        {uploadingFile ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {uploadingFile ? "Enviando..." : "Selecionar Arquivo"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">{formData.fileName}</p>
                          <p className="text-sm text-green-600">{formData.fileSize}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile("material")}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
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
                  <Label htmlFor="type" className="text-sm font-semibold">
                    Tipo de Material *
                  </Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => handleInputChange("type", value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {materialTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="pages" className="text-sm font-semibold">
                    Número de Páginas
                  </Label>
                  <Input
                    id="pages"
                    type="number"
                    placeholder="Ex: 28"
                    value={formData.pages}
                    onChange={(e) => handleInputChange("pages", e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => handleInputChange("featured", checked as boolean)}
                    />
                    <Label htmlFor="featured" className="text-sm">
                      Material em destaque
                    </Label>
                  </div>
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
                          if (file) handleFileUpload(file, "cover");
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
                      onClick={() => removeFile("cover")}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-700 bg-white/90"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info */}
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
                  <span className="text-gray-600">Downloads:</span>
                  <span className="font-medium">{formData.downloadCount}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Arquivo:</span>
                  <span className="font-medium">
                    {formData.fileName ? "✓ Enviado" : "Não enviado"}
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
