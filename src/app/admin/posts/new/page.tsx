"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Eye, Image as ImageIcon, Upload, X, Images, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import AdminLayout from "../../components/AdminLayout";
import { toast } from "sonner";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type Category = { id: string; name: string; slug: string };

export default function NewPost() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    summary: "",
    category: "",
    cover: "",
    published: false,
  });

  const [previewMode, setPreviewMode] = useState<"edit" | "live">("edit");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<Array<{ name: string; url: string; path: string; size: number; createdAt: string }>>([]);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, published: publish };
      let response: Response;
      if (draftId) {
        response = await fetch(`/api/admin/posts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/admin/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        const post = await response.json();
        setDraftId(post.id);
        toast.success(publish ? "Post publicado com sucesso!" : "Rascunho salvo!");
        if (publish) router.push("/admin/posts");
      } else {
        const error = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        toast.error(error.error || "Erro ao salvar postagem");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao salvar postagem");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data || []);
        }
      } catch {}
    };
    void loadCategories();
  }, []);

  useEffect(() => {
    const { title, content, summary, category, cover } = formData;
    if (!title && !content) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        setAutoSaveStatus("saving");
        const payload = { title, content, summary, category, cover, published: false };
        let res: Response;
        if (!draftId) {
          res = await fetch("/api/admin/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } else {
          res = await fetch(`/api/admin/posts/${draftId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
        if (res.ok) {
          const post = await res.json();
          setDraftId(post.id);
          setAutoSaveStatus("saved");
          setLastSavedAt(new Date().toLocaleTimeString());
        } else {
          setAutoSaveStatus("idle");
        }
      } catch {
        setAutoSaveStatus("idle");
      }
    }, 1500);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [formData, draftId]);

  const handleImageUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("type", "cover");
      const response = await fetch("/api/admin/upload", { method: "POST", body: formDataUpload });
      if (response.ok) {
        const result = await response.json();
        handleInputChange("cover", result.url);
        toast.success("Imagem enviada com sucesso!");
      } else {
        const error = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        toast.error(error.error || "Erro no upload");
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro no upload da imagem");
    } finally {
      setUploadingCover(false);
    }
  };

  const removeCover = () => handleInputChange("cover", "");
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); if (!uploadingCover) setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = async (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) await handleImageUpload(f); };

  const insertImageInContent = (url: string, alt = "Imagem") => {
    const snippet = `\n\n![${alt}](${url})\n\n`;
    handleInputChange("content", (formData.content || "") + snippet);
  };

  const openMedia = async () => {
    setMediaOpen(true);
    try {
      const res = await fetch("/api/admin/media?type=images");
      if (res.ok) {
        const data = await res.json();
        setMediaItems(data.items || []);
      }
    } catch {}
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard"><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2"/> Voltar</Button></Link>
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#262d3d]">Nova Postagem</h1>
              <p className="text-gray-600 mt-1">Crie uma nova postagem para o blog</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={(e)=>handleSubmit(e,false)} disabled={loading || !formData.title || !formData.content} variant="outline">
              {loading ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>}
              Salvar Rascunho
            </Button>
            <Button onClick={(e)=>handleSubmit(e,true)} disabled={loading || !formData.title || !formData.content} className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"/> : <Eye className="w-4 h-4 mr-2"/>}
              Publicar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-base font-semibold">Titulo da Postagem *</Label>
                    <Input id="title" placeholder="Digite o titulo da postagem..." value={formData.title} onChange={(e)=>handleInputChange("title", e.target.value)} className="mt-2 text-lg"/>
                  </div>
                  <div>
                    <Label htmlFor="summary" className="text-base font-semibold">Resumo</Label>
                    <Textarea id="summary" placeholder="Escreva um breve resumo da postagem..." value={formData.summary} onChange={(e)=>handleInputChange("summary", e.target.value)} className="mt-2" rows={3}/>
                    <p className="text-sm text-gray-500 mt-1">Este resumo aparece na listagem do blog.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="font-serif">Conteudo da Postagem *</CardTitle>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  {autoSaveStatus === "saving" && (<span className="inline-flex items-center"><Loader2 className="w-4 h-4 mr-1 animate-spin"/> Salvando...</span>)}
                  {autoSaveStatus === "saved" && lastSavedAt && (<span>Rascunho salvo as {lastSavedAt}</span>)}
                  <Button variant="outline" size="sm" onClick={()=>setPreviewMode(previewMode==='edit'?'live':'edit')}><Eye className="w-4 h-4 mr-2"/> {previewMode==='edit'?'Preview':'Editar'}</Button>
                  <Button variant="outline" size="sm" onClick={openMedia}><Images className="w-4 h-4 mr-2"/> Biblioteca</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="min-h-[400px]">
                  <MDEditor
                    value={formData.content}
                    onChange={(val)=>handleInputChange("content", val || "")}
                    preview={previewMode}
                    hideToolbar={false}
                    visibleDragbar={false}
                    textareaProps={{ placeholder: "Comece a escrever sua postagem aqui..." }}
                  />
                </div>
                <div className="mt-3">
                  <label className="relative inline-flex items-center">
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e)=>{
                      const f = e.target.files?.[0]; if(!f) return; const fd = new FormData(); fd.append('file', f); fd.append('type','image');
                      const res = await fetch('/api/admin/upload',{method:'POST', body: fd});
                      if(res.ok){ const out = await res.json(); insertImageInContent(out.url, f.name); toast.success('Imagem adicionada ao texto'); }
                      else { try{ const j = await res.json(); toast.error(j.error || 'Falha no upload'); } catch{ toast.error('Falha no upload'); } }
                    }}/>
                    <Button variant="outline" type="button"><Upload className="w-4 h-4 mr-2"/> Inserir imagem no texto</Button>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="font-serif text-lg">Configuracoes</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category" className="text-sm font-semibold">Categoria *</Label>
                  <Select value={formData.category} onValueChange={(value)=>handleInputChange("category", value)}>
                    <SelectTrigger className="mt-2"><SelectValue placeholder="Selecione uma categoria"/></SelectTrigger>
                    <SelectContent>
                      {categories.map((c)=> (<SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="font-serif text-lg flex items-center gap-2"><ImageIcon className="w-5 h-5 text-[#98ab44]"/> Imagem de capa</CardTitle></CardHeader>
              <CardContent>
                {!formData.cover ? (
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center ${isDragging? 'border-[#98ab44]' : 'border-gray-300'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                    <ImageIcon className={`w-8 h-8 mx-auto mb-2 ${isDragging? 'text-[#98ab44]' : 'text-gray-400'}`}/>
                    <p className="text-sm text-gray-600 mb-1 font-medium">{isDragging? 'Solte a imagem aqui' : 'Arraste e solte uma imagem'}</p>
                    <p className="text-xs text-gray-500 mb-3">ou clique para selecionar (JPG, PNG, WebP - max. 5MB)</p>
                    <div className="relative">
                      <input type="file" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0]; if(f) handleImageUpload(f);}} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingCover}/>
                      <Button size="sm" className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white" disabled={uploadingCover}>{uploadingCover? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"/> : <Upload className="w-4 h-4 mr-2"/>}{uploadingCover? 'Enviando...' : 'Selecionar Arquivo'}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-32">
                    <Image src={formData.cover} alt="Preview" fill sizes="100vw" className="object-cover rounded-lg" />
                    <Button variant="outline" size="sm" onClick={removeCover} className="absolute top-2 right-2 text-red-600 hover:text-red-700 bg-white/90"><X className="w-4 h-4"/></Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="font-serif text-lg">URL da imagem (alternativa)</CardTitle></CardHeader>
              <CardContent>
                <Input placeholder="https://.../minha-imagem.jpg" value={formData.cover} onChange={(e)=>handleInputChange('cover', e.target.value)}/>
                <p className="text-xs text-gray-500 mt-1">Ou cole a URL de uma imagem externa</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="font-serif text-lg">Informacoes</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Status:</span><Badge variant="secondary" className="bg-orange-100 text-orange-800">Rascunho</Badge></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Autor:</span><span className="font-medium">Administrador</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Palavras:</span><span className="font-medium">{formData.content.split(/\s+/).filter(w=>w.length>0).length}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Tempo de leitura:</span><span className="font-medium">{Math.max(1, Math.ceil(formData.content.split(/\s+/).filter(w=>w.length>0).length/200))} min</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {mediaOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={()=>setMediaOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-auto" onClick={(e)=>e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between"><h3 className="font-serif text-lg">Biblioteca de Midia</h3><Button variant="outline" size="sm" onClick={()=>setMediaOpen(false)}><X className="w-4 h-4"/></Button></div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {mediaItems.length===0 ? (
                <div className="col-span-full text-center text-sm text-gray-500">Nenhuma midia encontrada.</div>
              ) : (
                mediaItems.map((item)=> (
                  <button key={item.path} className="group border rounded-lg overflow-hidden text-left" onClick={()=>{ insertImageInContent(item.url, item.name); toast.success('Imagem inserida no conteudo'); setMediaOpen(false); }}>
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                      <Image src={item.url} alt={item.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-200" />
                    </div>
                    <div className="p-2 text-xs truncate">{item.name}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
