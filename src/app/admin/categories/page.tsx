"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";

type Category = { id: string; name: string; slug: string };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    void loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (res.ok) setCategories(data as Category[]);
      else toast.error(data?.error || "Falha ao carregar categorias");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async () => {
    const name = newName.trim();
    if (name.length < 2) return toast.error("Informe um nome valido");
    setCreating(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setCategories((prev) => [data as Category, ...prev]);
        setNewName("");
        toast.success("Categoria criada");
      } else {
        toast.error(data?.error || "Falha ao criar categoria");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao criar categoria");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (id: string) => {
    const name = editName.trim();
    if (name.length < 2) return toast.error("Informe um nome valido");
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setCategories((prev) => prev.map((c) => (c.id === id ? (data as Category) : c)));
        cancelEdit();
        toast.success("Categoria atualizada");
      } else {
        toast.error(data?.error || "Falha ao atualizar categoria");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao atualizar categoria");
    }
  };

  const removeCategory = async (id: string) => {
    if (!confirm("Remover esta categoria?")) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast.success("Categoria removida");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "Falha ao remover categoria");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover categoria");
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-serif font-bold text-[#262d3d]">Categorias</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Nova Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label htmlFor="newName">Nome</Label>
                <Input
                  id="newName"
                  placeholder="Ex.: Planejamento Financeiro"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <Button onClick={createCategory} disabled={creating} className="bg-[#98ab44] text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Lista</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-24">
                <div className="w-6 h-6 border-4 border-gray-300 border-t-[#262d3d] rounded-full animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-gray-500">Nenhuma categoria cadastrada</p>
            ) : (
              <ul className="divide-y">
                {categories.map((cat) => (
                  <li key={cat.id} className="py-3 flex items-center gap-3">
                    {editingId === cat.id ? (
                      <>
                        <Input
                          className="flex-1"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                        <Button size="sm" onClick={() => saveEdit(cat.id)} className="bg-[#98ab44] text-white">
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="font-medium text-[#262d3d]">{cat.name}</p>
                          <p className="text-xs text-gray-500">/{cat.slug}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => startEdit(cat)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => removeCategory(cat.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

