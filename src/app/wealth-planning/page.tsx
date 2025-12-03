"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, TrendingUp, ArrowRight } from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { signIn, getCurrentUser } from "@/lib/auth-supabase";

export default function WealthPlanningLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      if (user && (user.role === "ADMIN" || user.role === "EDITOR")) {
        router.push("/wealth-planning/dashboard");
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } = await signIn(email, password);

      if (signInError) {
        console.error("Erro no login:", signInError);
        setError("Credenciais inválidas. Verifique seu email e senha.");
      } else if (data?.user) {
        console.log("Login bem-sucedido, verificando permissões...");
        // Aguardar um pouco para garantir que a sessão foi salva
        await new Promise((resolve) => setTimeout(resolve, 500));

        const user = await getCurrentUser();
        console.log("Usuário atual:", user);

        if (user && (user.role === "ADMIN" || user.role === "EDITOR")) {
          console.log("Usuário autorizado, redirecionando...");
          // Forçar refresh completo da página para garantir que cookies sejam salvos
          window.location.href = "/wealth-planning/dashboard";
        } else {
          console.log("Usuário sem permissão:", user?.role);
          setError(
            "Você não tem permissão para acessar a ferramenta de Wealth Planning."
          );
        }
      } else {
        setError("Erro ao fazer login. Tente novamente.");
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
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
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="shadow-lg border-2 border-[#98ab44]/20">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-16 h-16 bg-[#98ab44] rounded-full flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="font-serif text-3xl text-[#262d3d] mb-2">
                  Wealth Planning
                </CardTitle>
                <p className="text-gray-600 font-sans">
                  Ferramenta de planejamento financeiro para consultores LDC Capital
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="font-sans text-[#262d3d] font-medium"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-gray-300 focus:border-[#98ab44] focus:ring-[#98ab44] font-sans"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="font-sans text-[#262d3d] font-medium"
                    >
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-gray-300 focus:border-[#98ab44] focus:ring-[#98ab44] font-sans"
                      placeholder="••••••••"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 font-sans">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans"
                  >
                    {loading ? (
                      "Entrando..."
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Acessar Ferramenta
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center font-sans">
                    Esta é uma ferramenta exclusiva para consultores LDC Capital.
                    <br />
                    Em caso de problemas, entre em contato com o suporte.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

