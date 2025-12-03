"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import AdminLayout from "../../../components/AdminLayout";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/wealth-planning/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const client = await response.json();
        router.push(`/admin/wealth-planning/clients/${client.id}`);
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao criar cliente");
      }
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      alert("Erro ao criar cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/wealth-planning">
            <Button variant="outline" size="sm" className="font-sans">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#262d3d] mb-2">
              Novo Cliente
            </h1>
            <p className="text-gray-600 font-sans">
              Cadastre um novo cliente ou lead para criar estudos de wealth planning
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
                  placeholder="Nome completo do cliente"
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
                  placeholder="email@exemplo.com"
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
                  placeholder="(00) 00000-0000"
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
                  placeholder="Anotações sobre o cliente..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Link href="/admin/wealth-planning">
                  <Button type="button" variant="outline" className="font-sans">
                    Cancelar
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Salvando..." : "Salvar Cliente"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

