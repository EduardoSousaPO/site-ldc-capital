"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useToast } from "@/components/ui/toast";

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const clientId = params.id as string;

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await fetch(
          `/api/admin/wealth-planning/clients/${clientId}`,
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const client: Client = await response.json();
          setFormData({
            name: client.name || "",
            email: client.email || "",
            phone: client.phone || "",
            notes: client.notes || "",
          });
        } else {
          if (response.status === 401) {
            router.push("/wealth-planning");
            return;
          }
          showToast("Erro ao carregar cliente", "error");
          router.push("/wealth-planning/dashboard");
        }
      } catch (error) {
        console.error("Erro ao carregar cliente:", error);
        showToast("Erro ao carregar cliente", "error");
        router.push("/wealth-planning/dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchClient();
    }
  }, [clientId, router, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(
        `/api/admin/wealth-planning/clients/${clientId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        showToast("Cliente atualizado com sucesso", "success");
        router.push(`/wealth-planning/clients/${clientId}`);
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.error || errorData.details || "Erro ao atualizar cliente";
        showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      showToast("Erro ao atualizar cliente. Tente novamente.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-[#262d3d]/30 border-t-[#262d3d] rounded-full animate-spin"></div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="mb-6">
            <Link href={`/wealth-planning/clients/${clientId}`}>
              <Button variant="ghost" className="font-sans">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl text-[#262d3d]">
                Editar Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-sans font-medium">
                    Nome *
                  </Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="font-sans"
                    placeholder="Nome completo do cliente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-sans font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="font-sans"
                    placeholder="cliente@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-sans font-medium">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="font-sans"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="font-sans font-medium">
                    Observações
                  </Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 font-sans"
                    placeholder="Observações sobre o cliente..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Link href={`/wealth-planning/clients/${clientId}`}>
                    <Button type="button" variant="outline" className="font-sans">
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}

