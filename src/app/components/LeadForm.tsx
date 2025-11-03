"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle } from "lucide-react";
import { leadFormSchema, type LeadFormData, formatPhone, patrimonioOptions, origemOptions } from "@/app/lib/schema";

type LeadFormProps = {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
};

export default function LeadForm({ title, subtitle, ctaLabel }: LeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
  });

  const telefoneValue = watch("telefone");

  const headingTitle = title ?? "Peça sua Análise de Carteira Gratuita";
  const headingSubtitle = subtitle ?? "Descubra como podemos potencializar seus investimentos";
  const submitLabel = ctaLabel ?? "Peça sua Análise de Carteira Gratuita";

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error("Erro ao processar resposta JSON:", jsonError);
        throw new Error("Resposta inválida do servidor");
      }

      if (response.ok && result.success) {
        setIsSubmitted(true);
        reset();
        setTimeout(() => setIsSubmitted(false), 5000);
      } else {
        // Mostrar mensagem de erro específica da API
        const errorMsg = result?.message || "Erro ao enviar formulário. Tente novamente.";
        console.error("Erro da API:", result);
        alert(errorMsg);
      }
    } catch (error) {
      console.error("Erro:", error);
      const errorMsg = error instanceof Error ? error.message : "Erro de conexão. Verifique sua internet e tente novamente.";
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue("telefone", formatted);
  };

  if (isSubmitted) {
    return (
      <section id="contact-form" className="relative py-16 text-white overflow-hidden scroll-mt-40 lg:scroll-mt-48 xl:scroll-mt-52 2xl:scroll-mt-56">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/michael-blum-uk1YeeAi5t0-unsplash.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#262d3d]/70 via-[#344645]/60 to-[#262d3d]/70" />
          <div className="absolute inset-0 bg-[#262d3d]/50" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-[#98ab44] mx-auto mb-4" />
              <h3 className="font-serif text-2xl font-bold mb-4">Obrigado pelo seu interesse!</h3>
              <p className="text-gray-200 mb-6">
                Recebemos suas informações e nossa equipe entrará em contato em breve para agendar sua análise gratuita.
              </p>
              <p className="text-sm text-gray-300">Você receberá um e-mail de confirmação nos próximos minutos.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="contact-form" className="relative py-16 text-white overflow-hidden scroll-mt-40 lg:scroll-mt-48 xl:scroll-mt-52 2xl:scroll-mt-56">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/michael-blum-uk1YeeAi5t0-unsplash.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#262d3d]/70 via-[#344645]/60 to-[#262d3d]/70" />
        <div className="absolute inset-0 bg-[#262d3d]/50" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="font-serif text-4xl lg:text-5xl font-bold mb-4">{headingTitle}</h2>
          <p className="text-xl text-gray-200">{headingSubtitle}</p>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-white font-serif text-2xl">Fale com nossa equipe</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="nome" className="text-white">Nome completo *</Label>
                <Input
                  id="nome"
                  {...register("nome")}
                  className="mt-1 bg-white/10 border-white/30 text-white placeholder:text-gray-300"
                  placeholder="Seu nome completo"
                />
                {errors.nome && <p className="mt-1 text-sm text-red-400">{errors.nome.message}</p>}
              </div>

              <div>
                <Label htmlFor="telefone" className="text-white">Telefone *</Label>
                <Input
                  id="telefone"
                  value={telefoneValue || ""}
                  onChange={handlePhoneChange}
                  className="mt-1 bg-white/10 border-white/30 text-white placeholder:text-gray-300"
                  placeholder="(11) 99999-9999"
                />
                {errors.telefone && <p className="mt-1 text-sm text-red-400">{errors.telefone.message}</p>}
              </div>

              <div>
                <Label htmlFor="email" className="text-white">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="mt-1 bg-white/10 border-white/30 text-white placeholder:text-gray-300"
                  placeholder="seu@email.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
              </div>

              <div>
                <Label htmlFor="patrimonio" className="text-white">Patrimônio para investimento *</Label>
                <Select onValueChange={(value) => setValue("patrimonio", value as LeadFormData["patrimonio"])}>
                  <SelectTrigger className="mt-1 bg-white/10 border-white/30 text-white">
                    <SelectValue placeholder="Selecione a faixa" />
                  </SelectTrigger>
                  <SelectContent>
                    {patrimonioOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.patrimonio && <p className="mt-1 text-sm text-red-400">{errors.patrimonio.message}</p>}
              </div>

              <div>
                <Label htmlFor="origem" className="text-white">Como nos conheceu? *</Label>
                <Select onValueChange={(value) => setValue("origem", value as LeadFormData["origem"])}>
                  <SelectTrigger className="mt-1 bg-white/10 border-white/30 text-white">
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    {origemOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.origem && <p className="mt-1 text-sm text-red-400">{errors.origem.message}</p>}
              </div>

              <div className="flex items-start space-x-3">
                <Controller
                  name="consentimento"
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Checkbox
                      id="consentimento"
                      checked={!!value}
                      onCheckedChange={(checked) => onChange(!!checked)}
                      className="mt-1 border-white/30"
                    />
                  )}
                />
                <Label htmlFor="consentimento" className="text-sm text-gray-200 leading-relaxed">
                  Concordo em fornecer meus dados para contato e receber informações sobre os serviços da LDC Capital.
                  Seus dados serão tratados conforme nossa Política de Privacidade. *
                </Label>
              </div>
              {errors.consentimento && <p className="text-sm text-red-400">{errors.consentimento.message}</p>}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#98ab44] hover:bg-[#98ab44]/90 text-white py-3 text-lg font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
