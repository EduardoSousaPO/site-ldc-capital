"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Eye, Images, Upload, Loader2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AdminLayout from "../../../components/AdminLayout";
import { toast } from "sonner";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type Category = { id: string; name: string; slug: string };

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<Array<{ name: string; url: string; path: string; size: number; createdAt: string }>>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    summary: "",
    category: "",
    cover: "",
    published: false,
    authorDisplayName: "",
  });

  const [previewMode, setPreviewMode] = useState<"edit" | "live">("edit");
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!postId) return;
    void Promise.all([loadPost(postId), loadCategories()]).finally(() => setLoading(false));
  }, [postId]);

  const loadPost = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/posts/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar post");
      setFormData({
        title: data.title || "",
        content: data.content || "",
        summary: data.summary || "",
        category: data.category || "",
        cover: data.cover || "",
        published: Boolean(data.published),
        authorDisplayName: data.authorDisplayName || "",
      });
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar postagem");
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data || []);
      }
    } catch {}
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const save = async (publish = false) => {
    if (!postId) return;
    setSaving(true);
    try {
      const payload = { ...formData, published: publish || formData.published };
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setAutoSaveStatus("saved");
        setLastSavedAt(new Date().toLocaleTimeString());
        toast.success(publish ? "Post publicado" : "Alteracoes salvas");
        if (publish) router.push("/admin/posts");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || "Falha ao salvar");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  // autosave
  useEffect(() => {
    if (!postId) return;
    if (!formData.title && !formData.content) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        setAutoSaveStatus("saving");
        const res = await fetch(`/api/admin/posts/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, published: false }),
        });
        if (res.ok) {
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
  }, [formData, postId]);

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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#262d3d]/30 border-t-[#262d3d] rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/posts">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#262d3d]">Editar Postagem</h1>
              <p className="text-gray-600 mt-1">Atualize a postagem publicada ou rascunho</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => save(false)} disabled={saving || !formData.title || !formData.content} variant="outline">
              {saving ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
            <Button onClick={() => save(true)} disabled={saving || !formData.title || !formData.content} className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white">
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
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
                  {autoSaveStatus === "saving" && (
                    <span className="inline-flex items-center"><Loader2 className="w-4 h-4 mr-1 animate-spin"/> Salvando...</span>
                  )}
                  {autoSaveStatus === "saved" && lastSavedAt && (
                    <span>Rascunho salvo as {lastSavedAt}</span>
                  )}
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
                    textareaProps={{ placeholder: "Edite o conteudo da postagem..." }}
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
              <CardHeader>
                <CardTitle className="font-serif">Detalhes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Categoria</Label>
                  <Select value={formData.category} onValueChange={(v)=>handleInputChange("category", v)}>
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>URL da Capa</Label>
                  <Input placeholder="https://..." value={formData.cover}
                    onChange={(e)=>handleInputChange("cover", e.target.value)} />
                </div>
                <div>
                  <Label>Autor (como aparecerá no post)</Label>
                  <Input placeholder="Ex.: João Silva" value={formData.authorDisplayName}
                    onChange={(e)=>handleInputChange("authorDisplayName", e.target.value)} />
                </div>
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
