"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { useToast } from "@/components/ui/toast";

export default function NewClientPage() {
  const router = useRouter();
  const { showToast } = useToast();
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
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const client = await response.json();
        showToast("Cliente criado com sucesso", "success");
        router.push(`/wealth-planning/clients/${client.id}`);
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.error || errorData.details || "Erro ao criar cliente";
        showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      showToast("Erro ao criar cliente. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="mb-6">
            <Link href="/wealth-planning/dashboard">
              <Button variant="ghost" className="font-sans">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl text-[#262d3d]">
                Novo Cliente
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
                    disabled={loading}
                    className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? "Salvando..." : "Salvar Cliente"}
                  </Button>
                  <Link href="/wealth-planning/dashboard">
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

