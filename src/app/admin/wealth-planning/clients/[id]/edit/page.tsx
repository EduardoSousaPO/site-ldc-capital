"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import AdminLayout from "@/app/admin/components/AdminLayout";

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/admin/wealth-planning/clients/${clientId}`);
      if (response.ok) {
        const client = await response.json();
        setFormData({
          name: client.name || "",
          email: client.email || "",
          phone: client.phone || "",
          notes: client.notes || "",
        });
      } else {
        alert("Cliente não encontrado");
        router.push("/admin/wealth-planning");
      }
    } catch (error) {
      console.error("Erro ao carregar cliente:", error);
      alert("Erro ao carregar cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/wealth-planning/clients/${clientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push(`/admin/wealth-planning/clients/${clientId}`);
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao atualizar cliente");
      }
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      alert("Erro ao atualizar cliente");
    } finally {
      setSaving(false);
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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/admin/wealth-planning/clients/${clientId}`}>
            <Button variant="outline" size="sm" className="font-sans">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#262d3d] mb-2">
              Editar Cliente
            </h1>
            <p className="text-gray-600 font-sans">
              Atualize as informações do cliente
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl text-[#262d3d]">
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-sans text-[#262d3d] font-medium">
                  Nome *
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border-gray-300 focus:border-[#98ab44] focus:ring-[#98ab44] font-sans"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-sans text-[#262d3d] font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-gray-300 focus:border-[#98ab44] focus:ring-[#98ab44] font-sans"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="font-sans text-[#262d3d] font-medium">
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="border-gray-300 focus:border-[#98ab44] focus:ring-[#98ab44] font-sans"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="font-sans text-[#262d3d] font-medium">
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="border-gray-300 focus:border-[#98ab44] focus:ring-[#98ab44] font-sans"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Link href={`/admin/wealth-planning/clients/${clientId}`}>
                  <Button type="button" variant="outline" className="font-sans">
                    Cancelar
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

